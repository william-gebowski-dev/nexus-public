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

/**
 * Fonte única do modo de dados do front.
 *
 * Aceita:
 *   - `?mock=1` na URL (override de demo/debug)
 *   - `VITE_DATA_MODE=mock` ou `=api` (env de build/deploy)
 *
 * Qualquer outro valor cai em `mock` enquanto não houver backend real,
 * para que o dashboard continue navegável em preview/dev. Quando o
 * `/api/*` estiver implementado, defina `VITE_DATA_MODE=api` na Vercel.
 *
 * MSW (service worker) e o badge "Dados de demonstração" consomem
 * `USE_MOCK_DATA`, derivado daqui — nunca ler `import.meta.env`
 * direto fora deste arquivo.
 */
export type DataMode = "mock" | "api";

function resolveDataMode(): DataMode {
  if (typeof location !== "undefined") {
    const override = new URLSearchParams(location.search).get("mock");
    if (override === "1") return "mock";
    if (override === "0") return "api";
  }
  const env = import.meta.env.VITE_DATA_MODE;
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

async function jsonGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" },
    ...init,
  });

  if (!res.ok) {
    if (path.includes("/api/system/status") || path.includes("/api/status")) {
      throw new Error("Não foi possível atualizar os dados do sistema.");
    }
    throw new Error("Não foi possível carregar os dados.");
  }

  return res.json() as Promise<T>;
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

  activities: (limit = 10, cursor: number | null = null) =>
    jsonGetSafe("activities", NEXUS_API_SCHEMAS.activities, `/api/activities?limit=${limit}${cursor !== null ? `&cursor=${cursor}` : ""}`),

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
};

export const api = nexusApi;
