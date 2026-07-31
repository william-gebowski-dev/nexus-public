import type {
  Activity,
  Agent,
  Alert,
  Automation,
  AvailabilityRecord,
  Execution,
  Mcp,
  ModelInfo,
  NexusSystemStatus,
  Project,
  RoadmapItem,
  Service,
  Skill,
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
 * Valida runtime a resposta JSON contra um schema Zod. Em falha de shape:
 *  - loga `console.warn` com método, path e issues do Zod (debugging
 *    sem quebrar a UI).
 *  - devolve os dados crus mesmo assim (graceful degrade). O objetivo
 *    é detectar drift entre mock e backend real, não bloquear render.
 *
 * Para mocks que não são inferidos pelo Zod (por exemplo listas onde o
 * backend retorna envelope `{ ok, data }`), não usar este wrapper.
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
    // eslint-disable-next-line no-console
    console.warn(`[nexus] shape divergente em ${method} (${path}):`, result.error);
  }
  return raw;
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
  services: () => jsonGet<Service[]>("/api/services"),

  agents: () => jsonGet<Agent[]>("/api/agents"),
  mcps: () => jsonGet<Mcp[]>("/api/mcps"),
  skills: () => jsonGet<Skill[]>("/api/skills"),
  automations: () => jsonGet<Automation[]>("/api/automations"),
  models: () => jsonGet<ModelInfo[]>("/api/models"),

  projects: () => jsonGet<Project[]>("/api/projects"),
  roadmap: () => jsonGet<RoadmapItem[]>("/api/roadmap"),
  alerts: () => jsonGet<Alert[]>("/api/alerts"),

  activities: (limit = 10, cursor: number | null = null) =>
    jsonGet<Page<Activity>>(`/api/activities?limit=${limit}${cursor !== null ? `&cursor=${cursor}` : ""}`),

  executions: (limit = 10, cursor: number | null = null) =>
    jsonGet<Page<Execution>>(`/api/executions?limit=${limit}${cursor !== null ? `&cursor=${cursor}` : ""}`),

  search: (q: string) =>
    jsonGet<{
      projects: Project[];
      services: Service[];
      agents: Agent[];
      mcps: Mcp[];
      skills: Skill[];
      automations: Automation[];
      activities: Activity[];
      roadmap: RoadmapItem[];
    }>(`/api/search?q=${encodeURIComponent(q)}`),

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
    USE_MOCK_DATA ? MOCK_AVAILABILITY : jsonGet<Record<string, AvailabilityRecord[]>>("/api/availability"),
};

export const api = nexusApi;
