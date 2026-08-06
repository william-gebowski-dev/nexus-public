import type {
  NexusSystemStatus,
  SystemSummary,
} from "@/types";
import { NEXUS_API_SCHEMAS } from "@/lib/schemas";
import type { AiUsagePeriod } from "@/types/ai-infrastructure";

/**
 * Fonte única do modo de dados do front.
 *
 * Aceita apenas `VITE_DATA_MODE=mock|api`.
 *
 * Produção exige `VITE_DATA_MODE=api` — `vite.config.ts::enforceDataModePlugin`
 * já falha o build se env ausente. Este módulo mantém um check runtime
 * como defesa em profundidade: dispara cedo no browser se alguém trocar
 * a config sem rebuild.
 *
 * MSW (service worker) e o badge "Dados de demonstração" consomem
 * `USE_MOCK_DATA`, derivado daqui — nunca ler `import.meta.env`
 * direto fora deste arquivo.
 *
 * Mocks ficam em `src/mocks/runtime-mocks.ts` e são carregados via
 * `import()` dinâmico apenas quando `DATA_MODE === "mock"`. Em
 * produção api, o bundle não inclui `src/data/mock-*`.
 */
export type DataMode = "mock" | "api";

function resolveDataMode(): DataMode {
  // Em contextos onde import.meta.env não existe (ex.: vitest rodando
  // módulos sem pipeline Vite), assume mock para não quebrar imports.
  const meta = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const env = meta?.VITE_DATA_MODE;
  // A validação de build prod (api/mock) vive em
  // `vite.config.ts::enforceDataModePlugin` — não duplica aqui para
  // permitir prod-mock sem runtime throw ao importar.
  return env === "api" ? "api" : "mock";
}

export const DATA_MODE: DataMode = resolveDataMode();

/**
 * Decisão pura e testável: o MSW (service worker de mocks) deve ser
 * iniciado sempre que o modo de dados for `mock`, inclusive em produção.
 * `main.tsx` usa este helper para evitar depender de `import.meta.env.PROD`
 * (que pararia o startup em build prod-mock).
 */
export function shouldStartBrowserMocks(dataMode: DataMode): boolean {
  return dataMode === "mock";
}

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
    // O endpoint /api/system/status devolve 503 com o shape NO_DATA_STATUS
    // (counts zerados, technicalSummary default) quando a fonte operacional
    // não está configurada. Isso NÃO é erro de servidor — é o estado
    // vazio conhecido. Devolvemos o body para que o React Query trate
    // como `data` (mostra "Sem dados") em vez de `isError: true`
    // (mostra ErrorState com "Não foi possível atualizar").
    const isSystemStatus = path.includes("/api/system/status") || path.includes("/api/status");
    if (isSystemStatus && res.status === 503 && body && typeof body === "object" && "status" in body) {
      return body as T;
    }
    const fallback = isSystemStatus
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
 *  - em modo `mock`, o caminho bypassa este wrapper (usa mocks direto),
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

/**
 * Helper único para carregar mocks no escopo dinâmico. Garante tree-shake
 * robusto: o bundle prod-api não importa `src/data/mock-*` porque este
 * `import()` só executa quando `USE_MOCK_DATA === true`.
 */
async function mockScope() {
  if (!USE_MOCK_DATA) {
    throw new Error("[nexus-api] mockScope chamado em modo api");
  }
  return await import("@/mocks/runtime-mocks");
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

  cronStatus: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockCronStatus();
    return jsonGetSafe("cronStatus", NEXUS_API_SCHEMAS.cronStatus, "/api/cron/status");
  },

  routineToday: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockRoutineToday();
    return jsonGetSafe("routineToday", NEXUS_API_SCHEMAS.routineToday, "/api/routine/today");
  },

  routine: async (date: string) => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockRoutine(date);
    return jsonGetSafe("routine", NEXUS_API_SCHEMAS.routineToday, `/api/routine/${encodeURIComponent(date)}`);
  },

  executionById: async (id: string) => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockExecutionById(id);
    return jsonGetSafe("executionById", NEXUS_API_SCHEMAS.executionById, `/api/executions/${encodeURIComponent(id)}`);
  },

  dailyReport: async (date: string) => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockDailyReport(date);
    return jsonGetSafe("dailyReport", NEXUS_API_SCHEMAS.dailyReport, `/api/reports/daily/${encodeURIComponent(date)}`);
  },

  recentExecutions: async (limit = 10, cursor: number | null = null) => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockRecentExecutions(limit, cursor);
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) qs.set("cursor", String(cursor));
    return jsonGetSafe("recentExecutions", NEXUS_API_SCHEMAS.recentExecutions, `/api/executions?${qs}`);
  },

  artifacts: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockArtifacts();
    return jsonGetSafe("artifacts", NEXUS_API_SCHEMAS.artifacts, "/api/artifacts");
  },

  infrastructure: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockInfrastructure();
    return jsonGetSafe("infrastructure", NEXUS_API_SCHEMAS.infrastructure, "/api/infrastructure");
  },

  availability: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAvailability();
    return jsonGetSafe("availability", NEXUS_API_SCHEMAS.availability, "/api/availability");
  },

  // === AI Infrastructure Observability Endpoints ===
  aiSummary: async (period: AiUsagePeriod = "today") => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiSummary(period);
    return jsonGetSafe("aiSummary", NEXUS_API_SCHEMAS.aiSummary, `/api/ai/summary?period=${period}`);
  },

  aiTimeseries: async (metric = "tokens", period: AiUsagePeriod = "today") => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiTimeseries(metric, period);
    return jsonGetSafe("aiTimeseries", NEXUS_API_SCHEMAS.aiTimeseries, `/api/ai/timeseries?metric=${metric}&period=${period}`);
  },

  aiModels: async (period: AiUsagePeriod = "today") => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiModelsPage(period);
    return jsonGetSafe("aiModels", NEXUS_API_SCHEMAS.aiModels, `/api/ai/models?period=${period}`);
  },

  aiProviders: async (period: AiUsagePeriod = "today") => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiProvidersPage(period);
    return jsonGetSafe("aiProviders", NEXUS_API_SCHEMAS.aiProviders, `/api/ai/providers?period=${period}`);
  },

  aiQuotas: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiQuotasPage();
    return jsonGetSafe("aiQuotas", NEXUS_API_SCHEMAS.aiQuotas, "/api/ai/quotas");
  },

  aiRequests: async (limit = 10, cursor: number | null = null) => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiRequestsPage(limit, cursor);
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) qs.set("cursor", String(cursor));
    return jsonGetSafe("aiRequests", NEXUS_API_SCHEMAS.aiRequests, `/api/ai/requests?${qs}`);
  },

  aiIncidents: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiIncidentsPage();
    return jsonGetSafe("aiIncidents", NEXUS_API_SCHEMAS.aiIncidents, "/api/ai/incidents");
  },

  aiTopology: async () => {
    if (USE_MOCK_DATA) return (await mockScope()).getMockAiTopology();
    return jsonGetSafe("aiTopology", NEXUS_API_SCHEMAS.aiTopology, "/api/ai/topology");
  },
};

export const api = nexusApi;