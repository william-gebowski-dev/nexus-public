import { json, methodNotAllowed, type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * Defaults para os campos obrigatórios de `NexusSystemStatusSchema` quando
 * a fonte operacional não está configurada ou não respondeu. Sem estes
 * defaults, o cliente `jsonGetSafe` lança `ApiContractError` e o Overview
 * fica em ErrorState em vez de "Sem dados operacionais".
 *
 * `counts` e `technicalSummary` são obrigatórios no schema; retornamos
 * zeros (sem inflar métricas) e um timestamp `null` para `lastSyncAt`,
 * sinalizando explicitamente que o estado é vazio.
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
 * ErrorState. Antes desta correção, o handler usava `"no_data"`, que
 * viola o enum e dispara `ApiContractError` no cliente.
 */
const NO_DATA_STATUS = {
  status: "unavailable",
  message: "Nenhuma fonte operacional foi configurada.",
  generatedAt: null,
  lastUpdate: null,
  source: "unavailable" as const,
  counts: DEFAULT_COUNTS,
  technicalSummary: DEFAULT_TECHNICAL_SUMMARY,
};

const UPSTREAM_UNAVAILABLE_STATUS = {
  status: "unavailable",
  message: "A fonte operacional não respondeu.",
  generatedAt: null,
  lastUpdate: null,
  source: "unavailable" as const,
  counts: DEFAULT_COUNTS,
  technicalSummary: DEFAULT_TECHNICAL_SUMMARY,
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const upstream = process.env.NEXUS_STATUS_ENDPOINT;
  const token = process.env.NEXUS_STATUS_TOKEN;

  if (!upstream) {
    return json(res, 503, NO_DATA_STATUS);
  }

  try {
    const upstreamRes = await fetch(upstream, {
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });

    const contentType = upstreamRes.headers.get("content-type");
    if (!upstreamRes.ok || !contentType?.includes("application/json")) {
      return json(res, 503, UPSTREAM_UNAVAILABLE_STATUS);
    }

    const body = await upstreamRes.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(res, 503, UPSTREAM_UNAVAILABLE_STATUS);
    }

    return json(res, 200, body);
  } catch {
    return json(res, 503, UPSTREAM_UNAVAILABLE_STATUS);
  }
}
