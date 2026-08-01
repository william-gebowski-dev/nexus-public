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
} from "./ai-normalize";
import type { AiUsagePeriod } from "../src/types/ai-infrastructure";

/**
 * Coletor local Nexus para 9Router.
 *
 * Conecta no 9Router (porta 20128), normaliza via scripts/ai-normalize.ts,
 * assina com HMAC-SHA256 e envia para a API de Ingestão do Nexus.
 *
 * Variáveis de ambiente:
 *   NEXUS_INGEST_URL    URL completa do endpoint /api/ai/ingest (obrigatória)
 *   NEXUS_INGEST_SECRET Segredo HMAC compartilhado com a Vercel (obrigatório)
 *   ROUTER_BASE_URL     Base do 9Router local (default http://127.0.0.1:20128)
 *
 * Variáveis opcionais:
 *   COLLECTOR_PERIOD          Período do snapshot (default today)
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

const FORBIDDEN_PATTERNS = [
  /100\.(?:6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}/g, // Tailscale CGNAT
  /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}/g,
  /\bnvapi-[A-Za-z0-9_-]{16,}/g,
  /\bghp_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{40,}/g,
  /\/(?:opt|home)\//g,
  /hermes-nexus-os/g,
  /srv\d{5,}/g,
];

function sanitizeString(input: string): string {
  let clean = input;
  for (const rx of FORBIDDEN_PATTERNS) {
    clean = clean.replace(rx, "[REDACTED]");
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

  const tryFetch = async (path: string): Promise<unknown> => {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { accept: "application/json" },
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

  return AiIngestPayloadSchema.parse({
    snapshot,
    modelUsage: [],
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
