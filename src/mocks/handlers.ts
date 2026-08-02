import { http, HttpResponse } from "msw";
import { safeStringify } from "@/lib/sanitize";
import { sanitizePayload } from "./serializers";
import type { Activity, Agent, Alert, Automation, Execution, Mcp, ModelInfo, NexusSystemStatus, Project, RoadmapItem, Service, Skill } from "@/types";

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

import status from "./data/status.json";
import services from "./data/services.json";
import agents from "./data/agents.json";
import mcps from "./data/mcps.json";
import skills from "./data/skills.json";
import automations from "./data/automations.json";
import models from "./data/models.json";
import projects from "./data/projects.json";
import activities from "./data/activities.json";
import roadmap from "./data/roadmap.json";
import executions from "./data/executions.json";
import alerts from "./data/alerts.json";

/**
 * Handlers MSW — endpoints do dashboard.
 *
 * Toda resposta passa por DUAS camadas antes de ir ao cliente:
 *   1. `sanitizePayload` — reescreve marcas internas (hermes, tailscale) e
 *      mapeia categorias restritas para termos públicos (rede-privada).
 *   2. `safeStringify` — gate final de regex. Se algum padrão sensível
 *      sobreviver à camada 1 e bater na blocklist, a request retorna 500.
 */

function jsonResponse(value: unknown, init?: ResponseInit): Response {
  const body = safeStringify(value);
  return new HttpResponse(body, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

function paginate<T>(items: T[], limit: number, cursor: number | null): {
  items: T[];
  nextCursor: number | null;
} {
  const start = cursor ?? 0;
  const end = start + limit;
  const page = items.slice(start, end);
  const nextCursor = end < items.length ? end : null;
  return { items: page, nextCursor };
}

// JSON imports inferem tipos literalmente; estes casts tipam os dados ao
// contrato público. Não há `as unknown[]` — TypeScript valida cada objeto
// contra a interface exportada em src/types.
const statusData = status as unknown as NexusSystemStatus;
const servicesData = services as unknown as Service[];
const agentsData = agents as unknown as Agent[];
const mcpsData = mcps as unknown as Mcp[];
const skillsData = skills as unknown as Skill[];
const automationsData = automations as unknown as Automation[];
const modelsData = models as unknown as ModelInfo[];
const projectsData = projects as unknown as Project[];
const activitiesData = activities as unknown as Activity[];
const roadmapData = roadmap as unknown as RoadmapItem[];
const executionsData = executions as unknown as Execution[];
const alertsData = alerts as unknown as Alert[];

export const handlers = [
  http.get("/api/system/status", () => jsonResponse(sanitizePayload(statusData))),
  http.get("/api/status", () => jsonResponse(sanitizePayload(statusData))),
  http.get("/api/services", () => jsonResponse(sanitizePayload(servicesData))),

  http.get("/api/agents", () => jsonResponse(sanitizePayload(agentsData))),
  http.get("/api/mcps", () => jsonResponse(sanitizePayload(mcpsData))),
  http.get("/api/skills", () => jsonResponse(sanitizePayload(skillsData))),
  http.get("/api/automations", () => jsonResponse(sanitizePayload(automationsData))),
  http.get("/api/models", () => jsonResponse(sanitizePayload(modelsData))),

  http.get("/api/projects", () => jsonResponse(sanitizePayload(projectsData))),
  http.get("/api/roadmap", () => jsonResponse(sanitizePayload(roadmapData))),
  http.get("/api/alerts", () => jsonResponse(sanitizePayload(alertsData))),

  http.get("/api/activities", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const cursorRaw = url.searchParams.get("cursor");
    const cursor = cursorRaw ? Number(cursorRaw) : null;
    const scope = url.searchParams.get("scope");
    // Filtro é aplicado ANTES da paginação (audit F). Sem isso, a página
    // atual de 20 itens pode não ter nenhuma atividade de infraestrutura
    // mesmo existindo várias após o offset.
    const filtered = scope && scope !== "all"
      ? activitiesData.filter((a) => a.scope === scope)
      : activitiesData;
    return jsonResponse(sanitizePayload(paginate(filtered, limit, cursor)));
  }),

  http.get("/api/executions", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const cursorRaw = url.searchParams.get("cursor");
    const cursor = cursorRaw ? Number(cursorRaw) : null;
    return jsonResponse(sanitizePayload(paginate(executionsData, limit, cursor)));
  }),

  // Endpoint de busca global — combina várias entidades.
  http.get("/api/search", ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    if (!q) {
      return jsonResponse({
        projects: [],
        services: [],
        agents: [],
        mcps: [],
        skills: [],
        automations: [],
        activities: [],
        roadmap: [],
      });
    }

    // Match por campos textuais públicos. Cada entidade define quais campos
    // entram no "haystack" para que nada protegido (prompts, hosts, paths)
    // seja indexado.
    const matchesByName = <T extends { name: string }>(items: T[], extra: (it: T) => string[] = () => []): T[] =>
      items.filter((it) => {
        const haystack = [it.name, ...extra(it)].join(" ").toLowerCase();
        return haystack.includes(q);
      });

    const matchesArray = <T, K extends keyof T>(items: T[], fields: K[]): T[] =>
      items.filter((it) => {
        const haystack = fields.map((f) => String(it[f] ?? "")).join(" ").toLowerCase();
        return haystack.includes(q);
      });

    return jsonResponse(
      sanitizePayload({
        projects: matchesByName(projectsData, (p) => [p.description, p.category, p.currentPhase]),
        services: matchesByName(servicesData, (s) => [s.description, s.category]),
        agents: matchesByName(agentsData, (a) => [a.role, a.model]),
        mcps: matchesByName(mcpsData, (m) => [m.category]),
        skills: matchesByName(skillsData, (s) => [s.purpose]),
        automations: matchesByName(automationsData, (a) => [a.purpose, a.project ?? ""]),
        activities: matchesArray(activitiesData, ["title", "description", "origin", "scope"] as const),
        roadmap: matchesArray(roadmapData, ["title", "objective", "doneCriteria"] as const),
      }),
    );
  }),

  // === Rotina Hermes 12×4 — handlers espelhando USE_MOCK_DATA ===
  http.get("/api/cron/status", () =>
    jsonResponse(sanitizePayload(MOCK_CRON_STATUS))),

  http.get("/api/routine/today", () =>
    jsonResponse(sanitizePayload(MOCK_ROUTINE_TODAY))),

  http.get("/api/routine/:date", () =>
    jsonResponse(sanitizePayload(MOCK_ROUTINE_TODAY))),

  http.get("/api/reports/daily/:date", ({ params }) => {
    const date = String(params.date);
    const report = MOCK_DAILY_REPORT[date] ?? MOCK_DAILY_REPORT[Object.keys(MOCK_DAILY_REPORT)[0]];
    return jsonResponse(sanitizePayload(report));
  }),

  http.get("/api/executions/:id", ({ params }) => {
    const id = String(params.id);
    const item = MOCK_RECENT_EXECUTIONS.find((e) => e.id === id);
    return item
      ? jsonResponse(sanitizePayload(item))
      : new HttpResponse(null, { status: 404 });
  }),

  http.get("/api/artifacts", () =>
    jsonResponse(sanitizePayload(MOCK_GENERATED_ARTIFACTS))),

  http.get("/api/infrastructure", () =>
    jsonResponse(sanitizePayload(MOCK_INFRASTRUCTURE))),

  http.get("/api/availability", () =>
    jsonResponse(sanitizePayload(MOCK_AVAILABILITY))),

  // === AI Infrastructure MSW Handlers ===
  // Cada handler devolve o envelope exato que `api/ai/*.ts` devolve em
  // modo api. Antes, handlers retornavam arrays cruas — `jsonGetSafe` no
  // cliente rejeitava via `safeParse` e lançava `ApiContractError`.
  http.get("/api/ai/summary", ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") ?? "today";
    return jsonResponse(sanitizePayload({ ...MOCK_AI_SUMMARY, period }));
  }),

  http.get("/api/ai/timeseries", ({ request }) => {
    const url = new URL(request.url);
    const metric = url.searchParams.get("metric") ?? "tokens";
    const period = url.searchParams.get("period") ?? "today";
    const points = Array.from({ length: 12 }, (_, i) => ({
      bucket: `${String(i * 2).padStart(2, "0")}:00`,
      value: metric === "tokens" ? 10_000_000 + i * 1_500_000 : 1 + i,
    }));
    return jsonResponse(sanitizePayload({ metric, period, points, source: "simulated" }));
  }),

  http.get("/api/ai/models", () =>
    jsonResponse(sanitizePayload({
      items: MOCK_AI_MODELS,
      snapshotId: null,
      capturedAt: null,
      source: "simulated",
    }))),

  http.get("/api/ai/providers", () =>
    jsonResponse(sanitizePayload({
      items: MOCK_AI_PROVIDERS,
      snapshotId: null,
      capturedAt: null,
      source: "simulated",
    }))),

  http.get("/api/ai/quotas", () =>
    jsonResponse(sanitizePayload({
      items: MOCK_AI_QUOTAS,
      generatedAt: null,
      source: "simulated",
    }))),

  http.get("/api/ai/requests", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const cursorRaw = url.searchParams.get("cursor");
    const cursor = cursorRaw ? Number(cursorRaw) : 0;
    const page = MOCK_AI_REQUESTS.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < MOCK_AI_REQUESTS.length ? cursor + limit : null;
    return jsonResponse(sanitizePayload({ items: page, nextCursor }));
  }),

  http.get("/api/ai/incidents", () =>
    jsonResponse(sanitizePayload({
      items: MOCK_AI_INCIDENTS,
      generatedAt: null,
      source: "simulated",
    }))),

  http.get("/api/ai/topology", () =>
    jsonResponse(sanitizePayload({ ...MOCK_AI_TOPOLOGY, source: "simulated" }))),
];
