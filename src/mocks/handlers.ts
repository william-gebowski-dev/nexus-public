import { http, HttpResponse } from "msw";
import { safeStringify } from "@/lib/sanitize";
import type { Activity, Agent, Mcp, Project, RoadmapItem, Service, Skill } from "@/types";

import status from "./data/status.json";
import services from "./data/services.json";
import agents from "./data/agents.json";
import mcps from "./data/mcps.json";
import skills from "./data/skills.json";
import models from "./data/models.json";
import projects from "./data/projects.json";
import activities from "./data/activities.json";
import roadmap from "./data/roadmap.json";
import executions from "./data/executions.json";
import alerts from "./data/alerts.json";

/**
 * Handlers MSW — endpoints do dashboard.
 * Toda resposta passa por `safeStringify` antes de ir ao cliente.
 * Se um padrão sensível vazar no payload, a request retorna 500
 * (mesmo gate final do `status-page.py`).
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

export const handlers = [
  http.get("/api/status", () => jsonResponse(status)),
  http.get("/api/services", () => jsonResponse(services)),

  http.get("/api/agents", () => jsonResponse(agents)),
  http.get("/api/mcps", () => jsonResponse(mcps)),
  http.get("/api/skills", () => jsonResponse(skills)),
  http.get("/api/models", () => jsonResponse(models)),

  http.get("/api/projects", () => jsonResponse(projects)),
  http.get("/api/roadmap", () => jsonResponse(roadmap)),
  http.get("/api/alerts", () => jsonResponse(alerts)),

  http.get("/api/activities", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const cursorRaw = url.searchParams.get("cursor");
    const cursor = cursorRaw ? Number(cursorRaw) : null;
    return jsonResponse(paginate(activities as unknown[], limit, cursor));
  }),

  http.get("/api/executions", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const cursorRaw = url.searchParams.get("cursor");
    const cursor = cursorRaw ? Number(cursorRaw) : null;
    return jsonResponse(paginate(executions as unknown[], limit, cursor));
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
        const haystack = fields
          .map((f) => String(it[f] ?? ""))
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });

    return jsonResponse({
      projects: matchesByName(projects as Project[], (p) => [
        p.description,
        p.category,
        p.currentPhase,
      ]),
      services: matchesByName(services as Service[], (s) => [s.description, s.category]),
      agents: matchesByName(agents as Agent[], (a) => [a.role, a.model]),
      mcps: matchesByName(mcps as Mcp[], (m) => [m.category]),
      skills: matchesByName(skills as Skill[], (s) => [s.purpose]),
      activities: matchesArray(activities as unknown as Activity[], ["title", "description", "origin", "scope"] as const),
      roadmap: matchesArray(roadmap as unknown as RoadmapItem[], ["title", "objective", "doneCriteria"] as const),
    });
  }),
];
