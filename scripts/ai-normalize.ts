/**
 * Normalizadores puros para dados do 9Router → contrato Nexus.
 *
 * Cada função recebe uma linha crua do 9Router e devolve o objeto
 * no formato esperado pelo schema Zod. Funções puras: nenhuma I/O,
 * nenhuma chamada a `Date.now()` ou similar. O timestamp é sempre
 * parâmetro explícito.
 *
 * Importante: campos ausentes no 9Router viram `null` (nunca 0 ou
 * string vazia forçada). O campo `source` recebe classificação
 * explícita (live/partial/periodic/simulated) conforme a origem.
 */

import { createHash } from "node:crypto";
import type { AiUsagePeriod } from "../src/types/ai-infrastructure";

// === Tabelas canônicas de mapeamento (interno → público) ==================
//
// Estes mapeamentos são o ÚNICO ponto em que nomes internos do 9Router
// viram nomes públicos. A UI consome apenas nomes públicos. Se o
// 9Router adicionar um novo provedor, atualize aqui.

const PROVIDER_INTERNAL_TO_PUBLIC: Record<string, string> = {
  "9router": "9Router Engine",
  "router-9router": "9Router Engine",
  "claude-code": "Claude Code",
  "claude_code": "Claude Code",
  "codex-openai": "OpenAI Codex",
  "openai-codex": "OpenAI Codex",
  "z-ai-nvidia": "NVIDIA Cloud",
  "nvidia-nim": "NVIDIA Cloud",
  "minimax-provider": "MiniMax Cloud",
  "minimax-cloud": "MiniMax Cloud",
};

const MODEL_INTERNAL_TO_PUBLIC: Record<string, string> = {
  "claude-sonnet-5": "Claude Sonnet 5",
  "claude-opus-5": "Claude Opus 5",
  "claude-haiku-4-5": "Claude Haiku 4.5",
  "gpt-5-5": "OpenAI GPT-5.5",
  "glm-5-2": "GLM 5.2",
  "minimax-coding": "MiniMax Coding",
};

const CLIENT_INTERNAL_TO_PUBLIC: Record<string, string> = {
  "claude-code": "Claude Code",
  "opencode": "OpenCode",
  "github-copilot": "GitHub Copilot",
  "9router-cli": "9Router CLI",
  "hermes-12x4": "Hermes 12×4",
  "code-reviewer": "Code Reviewer",
  "planner": "Planner",
  "researcher": "Researcher",
  "architect": "Architect",
};

const HTTP_STATUS_TO_HEALTH: Record<number, "operational" | "attention" | "unavailable" | "unknown"> = {
  200: "operational",
  201: "operational",
  204: "operational",
  301: "operational",
  302: "operational",
  304: "operational",
  400: "attention",
  401: "attention",
  403: "attention",
  404: "attention",
  408: "attention",
  429: "attention",
  500: "unavailable",
  502: "unavailable",
  503: "unavailable",
  504: "unavailable",
};

const ERROR_CATEGORY: Record<number | string, string> = {
  400: "400 - Requisição inválida",
  401: "401 - Não autorizado",
  403: "403 - Proibido",
  404: "404 - Não encontrado",
  408: "408 - Timeout",
  429: "429 - Limite temporário atingido",
  500: "500 - Erro interno",
  502: "502 - Gateway inválido",
  503: "503 - Serviço indisponível",
  504: "504 - Timeout upstream",
};

export function mapProvider(internal: string): string {
  if (!internal) return "Provedor desconhecido";
  return PROVIDER_INTERNAL_TO_PUBLIC[internal] ?? humanize(internal);
}

export function mapModel(internal: string): string {
  if (!internal) return "Modelo desconhecido";
  return MODEL_INTERNAL_TO_PUBLIC[internal] ?? humanize(internal);
}

export function mapClient(internal: string | null | undefined): string | null {
  if (!internal) return null;
  return CLIENT_INTERNAL_TO_PUBLIC[internal] ?? humanize(internal);
}

export function mapStatus(status: number | undefined | null): {
  status: "operational" | "attention" | "unavailable" | "unknown";
  category: string | null;
} {
  if (status === undefined || status === null) {
    return { status: "unknown", category: null };
  }
  const s = HTTP_STATUS_TO_HEALTH[status] ?? "unknown";
  const category = ERROR_CATEGORY[status] ?? null;
  return { status: s, category };
}

function humanize(s: string): string {
  return s
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// === Normalização de request log ==========================================

export interface RouterRequestRaw {
  id?: string;
  requestId?: string;
  timestamp?: string;
  ts?: string;
  provider?: string;
  model?: string;
  client?: string;
  project?: string;
  agent?: string;
  inputTokens?: number;
  cachedTokens?: number;
  outputTokens?: number;
  durationMs?: number;
  costUsd?: number;
  status?: number;
  statusText?: string;
}

export interface NormalizedRequest {
  id: string;
  externalRequestHash: string;
  createdAt: string;
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  agentId: string | null;
  agentName: string | null;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number | null;
  estimatedCostUsd: number | null;
  status: "success" | "failed" | "running" | "cancelled" | "queued";
  errorCategory: string | null;
  source: "live" | "partial" | "periodic" | "simulated";
}

export function normalizeRouterRequest(
  raw: RouterRequestRaw,
  now: Date,
): NormalizedRequest {
  const providerId = raw.provider ?? "unknown";
  const modelId = raw.model ?? "unknown";
  const clientName = mapClient(raw.client);
  const tsIso = raw.timestamp ?? raw.ts ?? now.toISOString();

  // Hash externo: id canônico do request (se vier) ou hash estável do
  // conteúdo. O Supabase usa este hash como chave única natural.
  const idSeed = raw.id ?? raw.requestId ?? `${providerId}::${modelId}::${tsIso}::${raw.inputTokens ?? 0}`;
  const externalRequestHash = createHash("sha256").update(idSeed).digest("hex").slice(0, 32);

  const { status: health, category } = mapStatus(raw.status);
  const status: NormalizedRequest["status"] =
    health === "operational" ? "success" :
    health === "unavailable" ? "failed" :
    health === "attention" ? (raw.status === 429 ? "queued" : "failed") :
    "queued";

  const input = raw.inputTokens ?? 0;
  const cached = raw.cachedTokens ?? 0;
  const output = raw.outputTokens ?? 0;
  // totalTokens = input + output (cache já está dentro de input, conforme
  // contrato do 9Router — não somar duas vezes).
  const totalTokens = input + output;

  return {
    id: externalRequestHash,
    externalRequestHash,
    createdAt: tsIso,
    providerId,
    providerName: mapProvider(providerId),
    modelId,
    modelName: mapModel(modelId),
    clientName,
    projectId: raw.project ?? null,
    projectName: raw.project ?? null,
    agentId: raw.agent ?? null,
    agentName: raw.agent ?? null,
    inputTokens: input,
    cachedTokens: cached,
    outputTokens: output,
    totalTokens,
    durationMs: raw.durationMs ?? null,
    estimatedCostUsd: raw.costUsd ?? null,
    status,
    errorCategory: status === "success" ? null : category,
    source: "live",
  };
}

// === Normalização de provider ==============================================

export interface RouterProviderRaw {
  id?: string;
  name?: string;
  status?: "operational" | "attention" | "near_limit" | "exhausted" | "authentication_error" | "payment_required" | "no_access" | "unavailable" | "unknown";
  activeModels?: number;
  requests?: number;
  inputTokens?: number;
  cachedTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  latencyMs?: number;
  errorCount?: number;
  lastUsedAt?: string | null;
  authStatus?: "valid" | "expired" | "missing" | "invalid" | "unknown";
  quotaStatus?: "available" | "low" | "exhausted" | "unknown";
}

export interface NormalizedProvider {
  providerId: string;
  publicName: string;
  status: "operational" | "attention" | "near_limit" | "exhausted" | "authentication_error" | "payment_required" | "no_access" | "unavailable" | "unknown";
  activeModels: number;
  requests: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
  averageLatencyMs: number | null;
  errorCount: number;
  lastUsedAt: string | null;
  authStatus: "valid" | "expired" | "missing" | "invalid" | "unknown";
  quotaStatus: "available" | "low" | "exhausted" | "unknown";
  source: "live" | "partial" | "periodic" | "simulated";
}

export function normalizeRouterProvider(raw: RouterProviderRaw): NormalizedProvider {
  const id = raw.id ?? "unknown";
  const input = raw.inputTokens ?? 0;
  const output = raw.outputTokens ?? 0;
  return {
    providerId: id,
    publicName: raw.name ?? mapProvider(id),
    status: raw.status ?? "unknown",
    activeModels: raw.activeModels ?? 0,
    requests: raw.requests ?? 0,
    inputTokens: input,
    cachedTokens: raw.cachedTokens ?? 0,
    outputTokens: output,
    totalTokens: input + output,
    estimatedCostUsd: raw.costUsd ?? null,
    averageLatencyMs: raw.latencyMs ?? null,
    errorCount: raw.errorCount ?? 0,
    lastUsedAt: raw.lastUsedAt ?? null,
    authStatus: raw.authStatus ?? "unknown",
    quotaStatus: raw.quotaStatus ?? "unknown",
    source: "live",
  };
}

// === Normalização de quota ================================================

export interface RouterQuotaRaw {
  id?: string;
  providerId?: string;
  providerName?: string;
  quotaType?: string;
  status?: "available" | "low" | "near_limit" | "exhausted" | "unknown";
  usedPct?: number;
  remainingPct?: number;
  resetsAt?: string;
  message?: string;
}

export interface NormalizedQuota {
  id: string;
  providerId: string;
  providerName: string;
  quotaType: string;
  status: "available" | "near_limit" | "exhausted" | "unknown";
  usedPct: number | null;
  remainingPct: number | null;
  resetsAt: string | null;
  checkedAt: string;
  message: string | null;
}

export function normalizeRouterQuota(raw: RouterQuotaRaw, now: Date): NormalizedQuota {
  const id = raw.id ?? `${raw.providerId ?? "unknown"}::${raw.quotaType ?? "default"}`;
  return {
    id,
    providerId: raw.providerId ?? "unknown",
    providerName: raw.providerName ?? mapProvider(raw.providerId ?? ""),
    quotaType: raw.quotaType ?? "default",
    status: raw.status === "low" ? "near_limit" : raw.status ?? "unknown",
    usedPct: typeof raw.usedPct === "number" ? raw.usedPct : null,
    remainingPct: typeof raw.remainingPct === "number" ? raw.remainingPct : null,
    resetsAt: raw.resetsAt ?? null,
    checkedAt: now.toISOString(),
    message: raw.message ?? null,
  };
}

// === Detecção de incidente ===============================================

export interface NormalizedIncident {
  id: string;
  type: "rate_limit_exceeded" | "high_latency_spike" | "auth_error" | "quota_exhausted" | "unavailable";
  severity: "info" | "warning" | "critical";
  status: "open" | "acknowledged" | "resolved" | "ignored";
  providerId: string | null;
  modelId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrences: number;
  title: string;
  summary: string;
  suggestedAction: string | null;
}

export function detectIncident(
  req: NormalizedRequest,
  previous: NormalizedIncident | null,
): NormalizedIncident | null {
  if (req.status === "success") return null;
  const category = req.errorCategory ?? "Falha";
  const now = req.createdAt;
  if (!previous) {
    return {
      id: `inc-${req.id.slice(0, 8)}`,
      type: req.errorCategory?.includes("429")
        ? "rate_limit_exceeded"
        : "auth_error",
      severity: req.status === "failed" || req.errorCategory?.includes("429") ? "warning" : "info",
      status: "open",
      providerId: req.providerId,
      modelId: req.modelId,
      firstSeenAt: now,
      lastSeenAt: now,
      occurrences: 1,
      title: `Falha em ${req.providerName} → ${req.modelName}`,
      summary: `${category} na requisição ${req.id.slice(0, 8)}.`,
      suggestedAction: "Verificar estado do provedor e chaves de autenticação.",
    };
  }
  return {
    ...previous,
    lastSeenAt: now,
    occurrences: previous.occurrences + 1,
  };
}

// === Agregação de snapshot ===============================================

export interface NormalizedSnapshot {
  period: AiUsagePeriod;
  generatedAt: string;
  source: "live" | "partial" | "periodic" | "simulated";
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheRatePct: number;
  errorRatePct: number;
  estimatedCostUsd: number | null;
  averageLatencyMs: number | null;
  medianLatencyMs: number | null;
  activeProviders: number;
  activeModels: number;
  mostUsedProvider: string | null;
  mostUsedModel: string | null;
  lastRequestAt: string | null;
}

export function aggregateSnapshot(
  requests: NormalizedRequest[],
  providers: NormalizedProvider[],
  period: AiUsagePeriod,
  now: Date,
): NormalizedSnapshot {
  const total = requests.length;
  const failed = requests.filter((r) => r.status === "failed").length;
  const successful = requests.filter((r) => r.status === "success").length;
  const input = requests.reduce((s, r) => s + r.inputTokens, 0);
  const cached = requests.reduce((s, r) => s + r.cachedTokens, 0);
  const output = requests.reduce((s, r) => s + r.outputTokens, 0);
  const totalTokens = input + output;
  const totalCost = requests.reduce((s, r) => s + (r.estimatedCostUsd ?? 0), 0);
  const durations = requests
    .map((r) => r.durationMs)
    .filter((d): d is number => typeof d === "number");
  const avgLatency = durations.length > 0 ? Number((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)) : null;

  // top provider/model
  const providerCounts = new Map<string, number>();
  const modelCounts = new Map<string, number>();
  for (const r of requests) {
    providerCounts.set(r.providerId, (providerCounts.get(r.providerId) ?? 0) + 1);
    modelCounts.set(r.modelId, (modelCounts.get(r.modelId) ?? 0) + 1);
  }
  const topProvider = Array.from(providerCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topModel = Array.from(modelCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // source: live se todos os campos vieram do 9Router, partial se algum
  // campo crítico está ausente.
  const hasRequests = requests.length > 0;
  const source: NormalizedSnapshot["source"] = hasRequests ? "live" : "partial";

  return {
    period,
    generatedAt: now.toISOString(),
    source,
    totalRequests: total,
    successfulRequests: successful,
    failedRequests: failed,
    inputTokens: input,
    cachedInputTokens: cached,
    outputTokens: output,
    totalTokens,
    cacheRatePct: input > 0 ? Number(((cached / input) * 100).toFixed(2)) : 0,
    errorRatePct: total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0,
    estimatedCostUsd: totalCost > 0 ? Number(totalCost.toFixed(4)) : null,
    averageLatencyMs: avgLatency,
    medianLatencyMs: null, // exige ordenação completa; pode ser calculado on-demand
    activeProviders: providers.length,
    activeModels: new Set(requests.map((r) => r.modelId)).size,
    mostUsedProvider: topProvider,
    mostUsedModel: topModel,
    lastRequestAt: requests[requests.length - 1]?.createdAt ?? null,
  };
}
