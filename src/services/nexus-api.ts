import type {
  NexusSystemStatus,
  SystemSummary,
} from "@/types";
import { NEXUS_API_SCHEMAS } from "@/lib/schemas";
import {
  MOCK_AVAILABILITY,
  MOCK_CRON_STATUS,
  MOCK_DAILY_REPORT,
  MOCK_GENERATED_ARTIFACTS,
  MOCK_INFRASTRUCTURE,
  MOCK_RECENT_EXECUTIONS,
  MOCK_ROUTINE_TODAY,
} from "@/data/mock-routine";
import {
  MOCK_AI_INCIDENTS,
  MOCK_AI_MODELS,
  MOCK_AI_PROVIDERS,
  MOCK_AI_QUOTAS,
  MOCK_AI_REQUESTS,
  MOCK_AI_SUMMARY,
  MOCK_AI_TOPOLOGY,
} from "@/data/mock-ai-infrastructure";
import type { AiUsagePeriod } from "@/types/ai-infrastructure";

/**
 * Fonte única do modo de dados do front.
 *
 * Aceita apenas `VITE_DATA_MODE=mock|api`.
 *
 * Produção exige `VITE_DATA_MODE=api`; query string pública nunca pode
 * trocar a fonte de dados do site publicado.
 *
 * MSW (service worker) e o badge "Dados de demonstração" consomem
 * `USE_MOCK_DATA`, derivado daqui — nunca ler `import.meta.env`
 * direto fora deste arquivo.
 */
export type DataMode = "mock" | "api";

function resolveDataMode(): DataMode {
  const env = import.meta.env.VITE_DATA_MODE;
  if (import.meta.env.PROD && env !== "api") {
    throw new Error("Produção exige VITE_DATA_MODE=api.");
  }
  return env === "api" ? "api" : "mock";
}

export const DATA_MODE: DataMode = resolveDataMode();

/** Mantido por compatibilidade — novos consumidores devem importar `DATA_MODE`. */
export const USE_MOCK_DATA: boolean = DATA_MODE === "mock";

export const isMockDataEnabled = (): boolean => USE_MOCK_DATA;

export interface Page<T> {
  items: T[];
  nextCursor: number | null;
  /** Total reportado pelo backend, quando aplicável. */
  totalItems?: number;
}

export class ApiResponseError extends Error {
  public readonly status: number;
  public readonly path: string;
  public readonly contentType: string | null;
  public readonly requestId: string | null;

  constructor(message: string, details: { status: number; path: string; contentType: string | null; requestId: string | null }) {
    super(message);
    this.name = "ApiResponseError";
    this.status = details.status;
    this.path = details.path;
    this.contentType = details.contentType;
    this.requestId = details.requestId;
  }
}

async function jsonGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" },
    ...init,
  });
  const contentType = res.headers.get("content-type");
  const requestId = res.headers.get("x-request-id") ?? res.headers.get("x-vercel-id");
  const raw = await res.text();

  if (!contentType || !contentType.includes("application/json")) {
    console.warn("[nexus-api] invalid content-type", { path, status: res.status, contentType, requestId });
    throw new ApiResponseError("A API não retornou uma resposta válida.", {
      status: res.status,
      path,
      contentType,
      requestId,
    });
  }

  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    console.warn("[nexus-api] invalid json", { path, status: res.status, contentType, requestId });
    throw new ApiResponseError("A API não retornou uma resposta válida.", {
      status: res.status,
      path,
      contentType,
      requestId,
    });
  }

  if (!res.ok) {
    const fallback = path.includes("/api/system/status") || path.includes("/api/status")
      ? "Não foi possível atualizar os dados do sistema."
      : "Não foi possível carregar os dados.";
    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : fallback;
    throw new ApiResponseError(message, { status: res.status, path, contentType, requestId });
  }

  return body as T;
}

/**
 * Erro lançado quando a resposta de um endpoint viola o schema Zod.
 * Sinaliza para a UI (via ErrorState) que o contrato da API quebrou.
 */
export class ApiContractError extends Error {
  public readonly method: string;
  public readonly path: string;
  public readonly issues: unknown;

  constructor(method: string, path: string, issues: unknown) {
    super(`[nexus] contrato violado em ${method} (${path})`);
    this.name = "ApiContractError";
    this.method = method;
    this.path = path;
    this.issues = issues;
  }
}

/**
 * Valida runtime a resposta JSON contra um schema Zod. Em falha de shape:
 *  - lança `ApiContractError`. O componente consumidor deve tratar via
 *    ErrorState do React Query.
 *  - em modo `mock`, o caminho bypassa este wrapper (usa MOCK_* direto),
 *    então a validação runtime fica a cargo de `check-shapes.ts` no build.
 *
 * Erro duro é intencional: dados inválidos chegando na UI causam bugs
 * silenciosos muito piores que um erro de carregamento visível.
 */
async function jsonGetSafe<T>(
  method: string,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: unknown } },
  path: string,
  init?: RequestInit,
): Promise<T> {
  const raw = await jsonGet<T>(path, init);
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiContractError(method, path, result.error);
  }
  return result.data;
}

export function systemStatusToSummary(status: NexusSystemStatus): SystemSummary {
  return {
    overall: status.status,
    generatedAt: status.generatedAt,
    counts: {
      servicesUp: status.counts.servicesOperational,
      servicesAttention: status.counts.servicesAttention,
      servicesDown: status.counts.servicesUnavailable,
      agentsActive: status.counts.agentsActive,
      mcpsActive: status.counts.mcpsActive,
      skillsActive: status.counts.skillsActive,
      automationsActive: status.counts.automationsActive,
      projectsActive: status.counts.projectsActive,
      executionsLast24h: status.counts.executionsLast24h,
    },
    nextRefreshAt: status.lastUpdate,
    source: status.source,
  };
}

export const nexusApi = {
  systemStatus: () => jsonGetSafe("systemStatus", NEXUS_API_SCHEMAS.systemStatus, "/api/system/status"),
  status: async () => systemStatusToSummary(await nexusApi.systemStatus()),
  services: () => jsonGetSafe("services", NEXUS_API_SCHEMAS.services, "/api/services"),

  agents: () => jsonGetSafe("agents", NEXUS_API_SCHEMAS.agents, "/api/agents"),
  mcps: () => jsonGetSafe("mcps", NEXUS_API_SCHEMAS.mcps, "/api/mcps"),
  skills: () => jsonGetSafe("skills", NEXUS_API_SCHEMAS.skills, "/api/skills"),
  automations: () => jsonGetSafe("automations", NEXUS_API_SCHEMAS.automations, "/api/automations"),
  models: () => jsonGetSafe("models", NEXUS_API_SCHEMAS.models, "/api/models"),

  projects: () => jsonGetSafe("projects", NEXUS_API_SCHEMAS.projects, "/api/projects"),
  roadmap: () => jsonGetSafe("roadmap", NEXUS_API_SCHEMAS.roadmap, "/api/roadmap"),
  alerts: () => jsonGetSafe("alerts", NEXUS_API_SCHEMAS.alerts, "/api/alerts"),

  activities: (limit = 10, cursor: number | null = null, scope?: string) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) qs.set("cursor", String(cursor));
    if (scope && scope !== "all") qs.set("scope", scope);
    return jsonGetSafe("activities", NEXUS_API_SCHEMAS.activities, `/api/activities?${qs}`);
  },

  executions: (limit = 10, cursor: number | null = null) =>
    jsonGetSafe("executions", NEXUS_API_SCHEMAS.executions, `/api/executions?limit=${limit}${cursor !== null ? `&cursor=${cursor}` : ""}`),

  search: (q: string) =>
    jsonGetSafe("search", NEXUS_API_SCHEMAS.search, `/api/search?q=${encodeURIComponent(q)}`),

  cronStatus: async () =>
    USE_MOCK_DATA
      ? MOCK_CRON_STATUS
      : jsonGetSafe("cronStatus", NEXUS_API_SCHEMAS.cronStatus, "/api/cron/status"),

  routineToday: async () =>
    USE_MOCK_DATA
      ? MOCK_ROUTINE_TODAY
      : jsonGetSafe("routineToday", NEXUS_API_SCHEMAS.routineToday, "/api/routine/today"),

  routine: async (date: string) =>
    USE_MOCK_DATA
      ? { ...MOCK_ROUTINE_TODAY, date }
      : jsonGetSafe("routine", NEXUS_API_SCHEMAS.routineToday, `/api/routine/${encodeURIComponent(date)}`),

  executionById: async (id: string) =>
    USE_MOCK_DATA
      ? MOCK_RECENT_EXECUTIONS.find((e) => e.id === id) ?? null
      : jsonGetSafe("executionById", NEXUS_API_SCHEMAS.executionById, `/api/executions/${encodeURIComponent(id)}`),

  dailyReport: async (date: string) =>
    USE_MOCK_DATA
      ? (MOCK_DAILY_REPORT[date] ?? MOCK_DAILY_REPORT[Object.keys(MOCK_DAILY_REPORT)[0]])
      : jsonGetSafe("dailyReport", NEXUS_API_SCHEMAS.dailyReport, `/api/reports/daily/${encodeURIComponent(date)}`),

  recentExecutions: async (limit = 10, cursor: number | null = null) => {
    if (USE_MOCK_DATA) {
      const start = cursor ?? 0;
      const end = start + limit;
      const page = MOCK_RECENT_EXECUTIONS.slice(start, end);
      return {
        items: page,
        nextCursor: end < MOCK_RECENT_EXECUTIONS.length ? end : null,
        totalItems: MOCK_RECENT_EXECUTIONS.length,
      };
    }
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) qs.set("cursor", String(cursor));
    return jsonGetSafe("recentExecutions", NEXUS_API_SCHEMAS.recentExecutions, `/api/executions?${qs}`);
  },

  artifacts: async () =>
    USE_MOCK_DATA
      ? MOCK_GENERATED_ARTIFACTS
      : jsonGetSafe("artifacts", NEXUS_API_SCHEMAS.artifacts, "/api/artifacts"),

  infrastructure: async () =>
    USE_MOCK_DATA
      ? MOCK_INFRASTRUCTURE
      : jsonGetSafe("infrastructure", NEXUS_API_SCHEMAS.infrastructure, "/api/infrastructure"),

  availability: async () =>
    USE_MOCK_DATA
      ? MOCK_AVAILABILITY
      : jsonGetSafe("availability", NEXUS_API_SCHEMAS.availability, "/api/availability"),

  // === AI Infrastructure Observability Endpoints ===
  aiSummary: async (period: AiUsagePeriod = "today") =>
    USE_MOCK_DATA
      ? { ...MOCK_AI_SUMMARY, period }
      : jsonGetSafe("aiSummary", NEXUS_API_SCHEMAS.aiSummary, `/api/ai/summary?period=${period}`),

  aiTimeseries: async (metric = "tokens", period: AiUsagePeriod = "today") => {
    if (USE_MOCK_DATA) {
      const points = Array.from({ length: 12 }, (_, i) => ({
        bucket: `${String(i * 2).padStart(2, "0")}:00`,
        value: metric === "tokens" ? Math.floor(10000000 + Math.random() * 15000000) : Math.floor(1 + Math.random() * 8),
      }));
      return { metric, period, points, source: "simulated" as const };
    }
    return jsonGetSafe("aiTimeseries", NEXUS_API_SCHEMAS.aiTimeseries, `/api/ai/timeseries?metric=${metric}&period=${period}`);
  },

  aiModels: async (period: AiUsagePeriod = "today") =>
    USE_MOCK_DATA
      ? { items: MOCK_AI_MODELS, snapshotId: null, capturedAt: null, source: "simulated" as const }
      : jsonGetSafe("aiModels", NEXUS_API_SCHEMAS.aiModels, `/api/ai/models?period=${period}`),

  aiProviders: async (period: AiUsagePeriod = "today") =>
    USE_MOCK_DATA
      ? { items: MOCK_AI_PROVIDERS, snapshotId: null, capturedAt: null, source: "simulated" as const }
      : jsonGetSafe("aiProviders", NEXUS_API_SCHEMAS.aiProviders, `/api/ai/providers?period=${period}`),

  aiQuotas: async () =>
    USE_MOCK_DATA
      ? { items: MOCK_AI_QUOTAS, generatedAt: null, source: "simulated" as const }
      : jsonGetSafe("aiQuotas", NEXUS_API_SCHEMAS.aiQuotas, "/api/ai/quotas"),

  aiRequests: async (limit = 10, cursor: number | null = null) => {
    if (USE_MOCK_DATA) {
      const start = cursor ?? 0;
      const end = start + limit;
      return {
        items: MOCK_AI_REQUESTS.slice(start, end),
        nextCursor: end < MOCK_AI_REQUESTS.length ? end : null,
      };
    }
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) qs.set("cursor", String(cursor));
    return jsonGetSafe("aiRequests", NEXUS_API_SCHEMAS.aiRequests, `/api/ai/requests?${qs}`);
  },

  aiIncidents: async () =>
    USE_MOCK_DATA
      ? { items: MOCK_AI_INCIDENTS, generatedAt: null, source: "simulated" as const }
      : jsonGetSafe("aiIncidents", NEXUS_API_SCHEMAS.aiIncidents, "/api/ai/incidents"),

  aiTopology: async () =>
    USE_MOCK_DATA
      ? MOCK_AI_TOPOLOGY
      : jsonGetSafe("aiTopology", NEXUS_API_SCHEMAS.aiTopology, "/api/ai/topology"),
};

export const api = nexusApi;
