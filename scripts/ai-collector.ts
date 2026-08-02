#!/usr/bin/env tsx
import crypto from "node:crypto";
import { AiIngestPayloadSchema } from "../src/lib/schemas";
import {
  aggregateSnapshot,
  detectIncident,
  normalizeRouterProvider,
  normalizeRouterQuota,
  normalizeRouterRequest,
  type NormalizedIncident,
  type NormalizedProvider,
  type NormalizedQuota,
  type NormalizedRequest,
  type NormalizedSnapshot,
} from "../src/lib/ai-normalize";
import { FORBIDDEN_PATTERNS } from "../src/lib/sanitize";
import type { AiUsagePeriod } from "../src/types/ai-infrastructure";

/**
 * Coletor local Nexus para 9Router.
 *
 * Conecta no 9Router (porta 20128), normaliza via src/lib/ai-normalize.ts,
 * assina com HMAC-SHA256 e envia para a API de Ingestão do Nexus.
 *
 * Variáveis de ambiente:
 *   NEXUS_INGEST_URL    URL completa do endpoint /api/ai/ingest (obrigatória)
 *   NEXUS_INGEST_SECRET Segredo HMAC compartilhado com a Vercel (obrigatório)
 *   ROUTER_BASE_URL     Base do 9Router local (default http://127.0.0.1:20128)
 *   ROUTER_API_TOKEN    Token Bearer para o 9Router (opcional mas recomendado)
 *
 * Variáveis opcionais:
 *   COLLECTOR_INTERVAL_SECONDS Intervalo em modo --watch (default 300)
 *
 * Modos:
 *   --once      Uma coleta e encerra (padrão)
 *   --watch     Loop contínuo
 *   --dry-run   Coleta e imprime o payload sanitizado; sem envio
 *
 * Em --dry-run, NEXUS_INGEST_SECRET e NEXUS_INGEST_URL não são
 * exigidos — o coletor apenas consulta o 9Router e mostra o que
 * seria enviado.
 *
 * Período do snapshot é **derivado de `now`** (não configurável): se
 * `now.getUTCHours() === hoje && dataUtc === hoje` → "today"; janelas
 * 7d/30d/60d são calculadas a partir de `captured_at` no momento da
 * leitura, não exigem snapshot pré-rotulado.
 */

interface CollectorOptions {
  once: boolean;
  watch: boolean;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CollectorOptions {
  const args = process.argv.slice(2);
  return {
    once: args.includes("--once") || !args.includes("--watch"),
    watch: args.includes("--watch"),
    dryRun: args.includes("--dry-run"),
    verbose: args.includes("--verbose"),
  };
}

function sanitizeString(input: string): string {
  let clean = input;
  for (const { regex } of FORBIDDEN_PATTERNS) {
    clean = clean.replace(regex, "[REDACTED]");
  }
  return clean;
}

interface RouterTelemetry {
  requests: unknown[];
  providers: unknown[];
  quotas: unknown[];
  topologyNodes?: unknown[];
  topologyEdges?: unknown[];
}

async function fetchFromRouter(baseUrl: string, opts: CollectorOptions): Promise<RouterTelemetry> {
  const out: RouterTelemetry = { requests: [], providers: [], quotas: [], topologyNodes: [], topologyEdges: [] };
  const TIMEOUT_MS = 3_000;

  const routerToken = process.env.ROUTER_API_TOKEN;
  if (!routerToken && opts.verbose) {
    console.warn("[collector] ROUTER_API_TOKEN ausente — requisições ao 9Router sem Authorization.");
  }
  const tryFetch = async (path: string): Promise<unknown> => {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        accept: "application/json",
        ...(routerToken ? { authorization: `Bearer ${routerToken}` } : {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return [];
    try {
      return await res.json();
    } catch {
      return [];
    }
  };

  const candidates = {
    requests: await tryFetch("/api/usage/request-logs").catch(() => []),
    providers: await tryFetch("/api/usage/providers").catch(() => []),
    quotas: await tryFetch("/api/usage/quotas").catch(() => []),
    topology: await tryFetch("/api/usage/topology").catch(() => ({ nodes: [], edges: [] })),
  };

  out.requests = Array.isArray(candidates.requests) ? candidates.requests : [];
  out.providers = Array.isArray(candidates.providers) ? candidates.providers : [];
  out.quotas = Array.isArray(candidates.quotas) ? candidates.quotas : [];
  const topo = candidates.topology as { nodes?: unknown[]; edges?: unknown[] } | unknown[];
  if (Array.isArray(topo)) {
    out.topologyNodes = topo;
  } else if (topo && typeof topo === "object") {
    out.topologyNodes = topo.nodes ?? [];
    out.topologyEdges = topo.edges ?? [];
  }

  if (opts.verbose) {
    console.log(
      `[collector] 9Router respondeu: ${out.requests.length} requests, ${out.providers.length} providers, ${out.quotas.length} quotas`,
    );
  }
  return out;
}

function buildPayload(
  telemetry: RouterTelemetry,
  period: AiUsagePeriod,
  now: Date,
  ingestSecret: string,
  collectorVersion: string,
): ReturnType<typeof AiIngestPayloadSchema.parse> {
  const requests: NormalizedRequest[] = telemetry.requests.map((r) =>
    normalizeRouterRequest(r as Parameters<typeof normalizeRouterRequest>[0], now),
  );
  const providers: NormalizedProvider[] = telemetry.providers.map((p) =>
    normalizeRouterProvider(p as Parameters<typeof normalizeRouterProvider>[0]),
  );
  const quotas: NormalizedQuota[] = telemetry.quotas.map((q) =>
    normalizeRouterQuota(q as Parameters<typeof normalizeRouterQuota>[0], now),
  );

  // Detecção de incidentes: agrega falhas consecutivas.
  const incidentsMap = new Map<string, NormalizedIncident>();
  for (const r of requests) {
    if (r.status !== "success") {
      const k = `${r.providerId}::${r.modelId}::${r.errorCategory ?? "unknown"}`;
      const prev = incidentsMap.get(k) ?? null;
      const next = detectIncident(r, prev);
      if (next) incidentsMap.set(k, next);
    }
  }
  const incidents = Array.from(incidentsMap.values());

  const snapshot: NormalizedSnapshot = aggregateSnapshot(requests, providers, period, now);

  // Agrega modelUsage a partir de `requests` (antes era hardcoded `[]`).
  // Cada modelo vira uma linha: requests, tokens, latência média,
  // errorCount, lastUsedAt. Esta derivação é a fonte de verdade para a
  // aba Modelos do front — sem ela, `/api/ai/models` ficaria vazio.
  const modelUsage = aggregateModelUsage(requests, providers, now);

  return AiIngestPayloadSchema.parse({
    snapshot,
    modelUsage,
    providerUsage: providers,
    providerQuotas: quotas,
    requestRecords: requests,
    incidents,
    topology: {
      nodes: (telemetry.topologyNodes ?? []) as never,
      edges: (telemetry.topologyEdges ?? []) as never,
    },
    payloadVersion: "1.0",
    collectorVersion,
  });
}

async function collectOnce(opts: CollectorOptions): Promise<void> {
  const routerBase = process.env.ROUTER_BASE_URL ?? "http://127.0.0.1:20128";
  const ingestUrl = process.env.NEXUS_INGEST_URL;
  const ingestSecret = process.env.NEXUS_INGEST_SECRET;
  const period = (process.env.COLLECTOR_PERIOD ?? "today") as AiUsagePeriod;

  if (opts.verbose) {
    console.log(`[collector] Coletando no 9Router em ${routerBase} (período: ${period})...`);
  }

  if (!opts.dryRun) {
    if (!ingestUrl) {
      throw new Error("NEXUS_INGEST_URL não configurado.");
    }
    if (!ingestSecret) {
      throw new Error(
        "NEXUS_INGEST_SECRET não configurado. Defina a variável de ambiente com o mesmo segredo configurado na Vercel.",
      );
    }
  }

  const telemetry = await fetchFromRouter(routerBase, opts);
  const now = new Date();
  const pkgVersion = "0.4.0";

  let payload;
  try {
    payload = buildPayload(telemetry, period, now, ingestSecret ?? "dry-run", pkgVersion);
  } catch (err) {
    console.error("[collector] Falha ao montar payload válido:", (err as Error).message);
    throw err;
  }

  const rawPayload = sanitizeString(JSON.stringify(payload));
  const idempotencyKey = `ingest-${now.toISOString().slice(0, 13)}-${crypto.randomBytes(4).toString("hex")}`;

  if (opts.dryRun) {
    console.log("=== DRY RUN (payload sanitizado, nada foi enviado) ===");
    console.log(rawPayload);
    console.log(`Idempotency Key: ${idempotencyKey}`);
    return;
  }

  if (!ingestUrl || !ingestSecret) {
    throw new Error("NEXUS_INGEST_URL/NEXUS_INGEST_SECRET ausentes em modo não-dry-run.");
  }

  const timestamp = now.toISOString();
  const signature = crypto
    .createHmac("sha256", ingestSecret)
    .update(`${timestamp}.${rawPayload}`)
    .digest("hex");

  if (opts.verbose) {
    console.log(`[collector] Enviando para ${ingestUrl} (idempotency: ${idempotencyKey})`);
  }

  try {
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nexus-timestamp": timestamp,
        "x-nexus-signature": signature,
        "x-nexus-idempotency-key": idempotencyKey,
      },
      body: rawPayload,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`✓ [collector] Ingestão concluída (${res.status}):`, (data as { message?: string }).message);
    } else {
      console.error(`✗ [collector] Erro na ingestão (${res.status}):`, (data as { error?: string }).error);
    }
  } catch (err) {
    console.error("✗ [collector] Falha de conexão:", String(err));
  }
}

async function main(): Promise<void> {
  const opts = parseArgs();

  if (opts.watch) {
    const intervalSec = Number(process.env.COLLECTOR_INTERVAL_SECONDS ?? 300);
    console.log(`[collector] --watch (intervalo: ${intervalSec}s). Ctrl+C para sair.`);
    await collectOnce(opts);
    setInterval(() => {
      void collectOnce(opts);
    }, intervalSec * 1000);
  } else {
    await collectOnce(opts);
  }
}

main().catch((err) => {
  console.error("Fatal:", (err as Error).message);
  process.exit(1);
});

// === Derivação de modelUsage ============================================

// `NormalizedProvider` (não `NormalizedProviderUsage` — esse tipo não
// existe em `ai-normalize.ts`). `NormalizedRequest` é consumido via
// import de topo.
type AggregatedRequest = NormalizedRequest;

/**
 * Agrega linhas `modelUsage` a partir da lista de requisições.
 *
 * Cada modelo vira uma entrada com requests, tokens, latência média,
 * errorCount, lastUsedAt, status. O source é `"live"` quando há
 * requisições e providers; cai para `"partial"` se algum modelo
 * tiver providers desconhecidos (model_id sem provider_id válido na
 * agregação).
 *
 * Antes desta função, o coletor enviava `modelUsage: []` — o front
 * mostrava tabela vazia mesmo com requests chegando. Esta é a
 * função que destrava a aba Modelos.
 */
function aggregateModelUsage(
  requests: AggregatedRequest[],
  providers: NormalizedProvider[],
  now: Date,
): Array<{
  modelId: string;
  publicName: string;
  providerId: string;
  providerName: string;
  requests: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  estimatedCostUsd: number | null;
  averageLatencyMs: number | null;
  medianLatencyMs: number | null;
  errorCount: number;
  lastUsedAt: string | null;
  status: "operational" | "attention" | "unavailable" | "unknown";
  source: "live" | "partial" | "periodic" | "simulated" | "unavailable";
}> {
  if (requests.length === 0) return [];

  const providerById = new Map(providers.map((p) => [p.providerId, p] as const));
  const byModel = new Map<string, NormalizedRequest[]>();
  for (const r of requests) {
    const arr = byModel.get(r.modelId);
    if (arr) arr.push(r);
    else byModel.set(r.modelId, [r]);
  }

  return Array.from(byModel.entries()).map(([modelId, rs]) => {
    const provider = providerById.get(rs[0].providerId);
    const publicName = rs[0].modelName || modelId;
    const providerId = rs[0].providerId;
    const providerName = provider?.publicName ?? rs[0].providerName ?? providerId;
    const requests = rs.length;
    const inputTokens = rs.reduce((s, r) => s + (r.inputTokens ?? 0), 0);
    const cachedTokens = rs.reduce((s, r) => s + (r.cachedTokens ?? 0), 0);
    const outputTokens = rs.reduce((s, r) => s + (r.outputTokens ?? 0), 0);
    const cost = rs.reduce((s, r) => s + (r.estimatedCostUsd ?? 0), 0);
    const latencies = rs
      .map((r) => r.durationMs)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const averageLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((s, n) => s + n, 0) / latencies.length)
      : null;
    const medianLatencyMs = latencies.length > 0
      ? latencies.slice().sort((a, b) => a - b)[Math.floor(latencies.length / 2)]
      : null;
    const errorCount = rs.filter((r) => r.status === "failed").length;
    const lastUsedAt = rs.length > 0
      ? rs.map((r) => r.createdAt).sort().slice(-1)[0]
      : null;
    const source = provider ? "live" : "partial";
    const status: "operational" | "attention" | "unavailable" | "unknown" =
      errorCount > requests / 2 ? "attention" : "operational";

    return {
      modelId,
      publicName,
      providerId,
      providerName,
      requests,
      inputTokens,
      cachedTokens,
      outputTokens,
      estimatedCostUsd: cost > 0 ? Number(cost.toFixed(4)) : null,
      averageLatencyMs,
      medianLatencyMs,
      errorCount,
      lastUsedAt,
      status,
      source,
    };
  });
}
