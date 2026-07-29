import type {
  Activity,
  Agent,
  Alert,
  Execution,
  Mcp,
  ModelInfo,
  Project,
  RoadmapItem,
  Service,
  Skill,
  SystemSummary,
} from "@/types";

/**
 * Camada fina sobre `fetch` — tipada por endpoint.
 *
 * Em produção, se as APIs reais (nexus-api no Tailscale) ainda não
 * estiverem servidas publicamente, o MSW intercepta e responde com
 * os mocks de `src/mocks/data/*.json`. Quando o backend real estiver
 * no ar, basta desligar o MSW e os mesmos endpoints respondem direto.
 */

async function jsonGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Falha em ${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface Page<T> {
  items: T[];
  nextCursor: number | null;
}

export const api = {
  status: () => jsonGet<SystemSummary>("/api/status"),
  services: () => jsonGet<Service[]>("/api/services"),

  agents: () => jsonGet<Agent[]>("/api/agents"),
  mcps: () => jsonGet<Mcp[]>("/api/mcps"),
  skills: () => jsonGet<Skill[]>("/api/skills"),
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
      activities: Activity[];
      roadmap: RoadmapItem[];
    }>(`/api/search?q=${encodeURIComponent(q)}`),
};
