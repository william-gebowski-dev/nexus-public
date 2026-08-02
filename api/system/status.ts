import { json, methodNotAllowed, type ApiRequest, type ApiResponse } from "../_shared/http";
import { getSupabaseServer } from "../_shared/supabaseServer";

/**
 * Defaults para os campos obrigatórios de `NexusSystemStatusSchema` quando
 * a fonte operacional não está configurada ou não respondeu. Sem estes
 * defaults, o cliente `jsonGetSafe` lança `ApiContractError` e o Overview
 * fica em ErrorState em vez de "Sem dados operacionais".
 */
const DEFAULT_COUNTS = {
  servicesOperational: 0,
  servicesAttention: 0,
  servicesUnavailable: 0,
  agentsActive: 0,
  mcpsActive: 0,
  skillsActive: 0,
  automationsActive: 0,
  projectsActive: 0,
  executionsLast24h: 0,
};

const DEFAULT_TECHNICAL_SUMMARY = {
  activeMcps: 0,
  activeSkills: 0,
  activeAgents: 0,
  runningAutomations: 0,
  activeContainers: 0,
  lastSyncAt: null,
  lastBackupAt: null,
  lastFailureAt: null,
};

/**
 * Estado "Sem dados operacionais". `status: "unavailable"` é o único valor
 * aceito por `NexusSystemStateEnum` que sinaliza ausência sem acionar
 * ErrorState.
 */
const NO_DATA_STATUS = {
  status: "unavailable",
  message: "Nenhuma fonte operacional foi configurada.",
  generatedAt: null,
  lastUpdate: null,
  source: "unavailable" as const,
  counts: DEFAULT_COUNTS,
  technicalSummary: DEFAULT_TECHNICAL_SUMMARY,
  uptimeSeconds: null,
  cpuUsage: null,
  memoryUsage: null,
  diskUsage: null,
};

const UPSTREAM_UNAVAILABLE_STATUS = {
  status: "unavailable",
  message: "A fonte operacional não respondeu.",
  generatedAt: null,
  lastUpdate: null,
  source: "unavailable" as const,
  counts: DEFAULT_COUNTS,
  technicalSummary: DEFAULT_TECHNICAL_SUMMARY,
  uptimeSeconds: null,
  cpuUsage: null,
  memoryUsage: null,
  diskUsage: null,
};

const EMPTY_TELEMETRY = {
  uptimeSeconds: null,
  cpuUsage: null,
  memoryUsage: null,
  diskUsage: null,
};

type DbStatusRow = {
  status: string;
  message: string;
  generated_at: string | null;
  last_update: string | null;
  source: string;
  counts: Record<string, number>;
  technical_summary: Record<string, unknown>;
  captured_at: string;
};

type StatusResponse = {
  status: string;
  message: string;
  generatedAt: string | null;
  lastUpdate: string | null;
  source: "live" | "partial" | "periodic" | "simulated" | "unavailable";
  counts: typeof DEFAULT_COUNTS;
  technicalSummary: typeof DEFAULT_TECHNICAL_SUMMARY;
  uptimeSeconds: number | null;
  cpuUsage: number | null;
  memoryUsage: number | null;
  diskUsage: number | null;
};

/**
 * Lê o snapshot mais recente do Supabase. Se a tabela existir e a seed
 * tiver sido populada, devolve o estado. Se falhar (tabela inexistente,
 * RLS bloqueando, etc.), devolve null para o caller cair no fallback.
 */
async function readFromDatabase(): Promise<StatusResponse | null> {
  try {
    const client = getSupabaseServer();
    const { data, error } = await client
      .from("system_status_snapshots")
      .select("status, message, generated_at, last_update, source, counts, technical_summary, captured_at")
      .eq("id", 1)
      .maybeSingle<DbStatusRow>();

    if (error || !data) return null;

    const source = (["live", "partial", "periodic", "simulated", "unavailable"].includes(data.source)
      ? data.source
      : "live") as StatusResponse["source"];

    return {
      status: data.status,
      message: data.message,
      generatedAt: data.generated_at,
      lastUpdate: data.last_update,
      source,
      counts: { ...DEFAULT_COUNTS, ...(data.counts ?? {}) },
      technicalSummary: { ...DEFAULT_TECHNICAL_SUMMARY, ...(data.technical_summary ?? {}) },
      ...EMPTY_TELEMETRY,
    };
  } catch {
    return null;
  }
}

/**
 * Tenta o endpoint upstream configurado via env. Se responder JSON
 * válido, devolve o body. Senão, null para o caller cair no fallback.
 */
async function readFromUpstream(): Promise<StatusResponse | null> {
  const upstream = process.env.NEXUS_STATUS_ENDPOINT;
  const token = process.env.NEXUS_STATUS_TOKEN;
  if (!upstream) return null;

  try {
    const upstreamRes = await fetch(upstream, {
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });

    const contentType = upstreamRes.headers.get("content-type");
    if (!upstreamRes.ok || !contentType?.includes("application/json")) return null;

    const body = await upstreamRes.json().catch(() => null);
    if (!body || typeof body !== "object") return null;

    return body as StatusResponse;
  } catch {
    return null;
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  // 1) Preferência: snapshot persistido no Supabase (coletor do Hermes
  //    escreve via `upsert_system_status`). Se a linha semente já existe,
  //    a UI sempre tem dados para renderizar.
  const fromDb = await readFromDatabase();
  if (fromDb) {
    return json(res, 200, fromDb);
  }

  // 2) Fallback: upstream externo configurado via env.
  const fromUpstream = await readFromUpstream();
  if (fromUpstream) {
    return json(res, 200, fromUpstream);
  }

  // 3) Sem DB e sem upstream: 503 com shape NO_DATA_STATUS. Front trata
  //    como estado vazio conhecido, não como erro.
  return json(res, 503, UPSTREAM_UNAVAILABLE_STATUS);
}
