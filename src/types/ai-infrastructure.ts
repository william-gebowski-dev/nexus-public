export type AiUsagePeriod = "today" | "24h" | "7d" | "30d" | "60d";

export type AiProviderStatus =
  | "operational"
  | "attention"
  | "near_limit"
  | "exhausted"
  | "authentication_error"
  | "payment_required"
  | "no_access"
  | "unavailable"
  | "unknown";

export interface AiUsageSummary {
  period: AiUsagePeriod;
  generatedAt: string;
  source: "live" | "periodic" | "simulated";

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

  mostUsedProvider?: string;
  mostUsedModel?: string;
  lastRequestAt?: string;
}

export interface AiModelUsage {
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
  source: "live" | "periodic" | "simulated";
}

export interface AiProviderUsage {
  providerId: string;
  publicName: string;
  status: AiProviderStatus;
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
  authStatus: string;
  quotaStatus: string;
  source: "live" | "periodic" | "simulated";
}

export interface AiProviderQuota {
  id: string;
  providerId: string;
  providerName: string;
  quotaType: string;

  status:
    | "available"
    | "attention"
    | "near_limit"
    | "exhausted"
    | "authentication_error"
    | "payment_required"
    | "no_access"
    | "unknown";

  usedPct: number | null;
  remainingPct: number | null;
  resetsAt: string | null;
  checkedAt: string;
  message?: string;
}

export interface AiRequestRecord {
  id: string;
  createdAt: string;

  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;

  clientName?: string;
  projectId?: string;
  projectName?: string;
  agentId?: string;
  agentName?: string;

  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  totalTokens: number;

  durationMs: number | null;
  estimatedCostUsd: number | null;

  status: "success" | "running" | "failed" | "cancelled";
  errorCategory?: string | null;
  source: "live" | "periodic" | "simulated";
}

export interface AiIncident {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "acknowledged" | "resolved" | "ignored";

  providerId?: string;
  modelId?: string;

  firstSeenAt: string;
  lastSeenAt: string;
  occurrences: number;

  title: string;
  summary: string;
  suggestedAction?: string;
}

export interface AiTopologyNode {
  id: string;
  name: string;
  type: "tool" | "router" | "provider" | "model";
  // União completa de AiProviderStatus — providers podem aparecer com
  // near_limit/exhausted/etc, então o nó da topologia aceita o mesmo
  // conjunto para não exigir coerção entre camadas.
  status:
    | "operational"
    | "attention"
    | "near_limit"
    | "exhausted"
    | "authentication_error"
    | "payment_required"
    | "no_access"
    | "unavailable"
    | "unknown";
  lastUsedAt?: string;
  requestsCount?: number;
  latencyMs?: number;
  errorCount?: number;
}

export interface AiTopologyEdge {
  from: string;
  to: string;
}

export interface AiTopology {
  nodes: AiTopologyNode[];
  edges: AiTopologyEdge[];
}
