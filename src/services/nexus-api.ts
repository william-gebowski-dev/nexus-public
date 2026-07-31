import type {
  Activity,
  Agent,
  Alert,
  Automation,
  AvailabilityRecord,
  CronStatus,
  DailyReportSummary,
  Execution,
  GeneratedArtifact,
  InfrastructureService,
  Mcp,
  ModelInfo,
  NexusSystemStatus,
  Project,
  RoadmapItem,
  RoutineDay,
  Service,
  Skill,
  SystemSummary,
} from "@/types";
import {
  MOCK_AVAILABILITY,
  MOCK_CRON_STATUS,
  MOCK_DAILY_REPORT,
  MOCK_GENERATED_ARTIFACTS,
  MOCK_INFRASTRUCTURE,
  MOCK_RECENT_EXECUTIONS,
  MOCK_ROUTINE_TODAY,
} from "@/data/mock-routine";

/** Ativa/desativa dados mockados sem trocar o chamador. Use ?mock=1 na URL
 *  ou VITE_USE_MOCK_DATA=true para forçar. */
export const USE_MOCK_DATA: boolean =
  (typeof location !== "undefined" &&
    new URLSearchParams(location.search).get("mock") === "1") ||
  import.meta.env.VITE_USE_MOCK_DATA === "true";

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
  systemStatus: () => jsonGet<NexusSystemStatus>("/api/system/status"),
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
    USE_MOCK_DATA ? MOCK_CRON_STATUS : jsonGet<CronStatus>("/api/cron/status"),

  routineToday: async () =>
    USE_MOCK_DATA ? MOCK_ROUTINE_TODAY : jsonGet<RoutineDay>("/api/routine/today"),

  routine: async (date: string) =>
    USE_MOCK_DATA
      ? { ...MOCK_ROUTINE_TODAY, date }
      : jsonGet<RoutineDay>(`/api/routine/${encodeURIComponent(date)}`),

  executionById: async (id: string) =>
    USE_MOCK_DATA
      ? MOCK_RECENT_EXECUTIONS.find((e) => e.id === id) ?? null
      : jsonGet<Execution>(`/api/executions/${encodeURIComponent(id)}`),

  dailyReport: async (date: string) =>
    USE_MOCK_DATA
      ? (MOCK_DAILY_REPORT[date] ?? MOCK_DAILY_REPORT[Object.keys(MOCK_DAILY_REPORT)[0]])
      : jsonGet<DailyReportSummary>(`/api/reports/daily/${encodeURIComponent(date)}`),

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
    return jsonGet<Page<Execution>>(`/api/executions?${qs}`);
  },

  artifacts: async () =>
    USE_MOCK_DATA ? MOCK_GENERATED_ARTIFACTS : jsonGet<GeneratedArtifact[]>("/api/artifacts"),

  infrastructure: async () =>
    USE_MOCK_DATA ? MOCK_INFRASTRUCTURE : jsonGet<InfrastructureService[]>("/api/infrastructure"),

  availability: async () =>
    USE_MOCK_DATA ? MOCK_AVAILABILITY : jsonGet<Record<string, AvailabilityRecord[]>>("/api/availability"),
};

export const api = nexusApi;
