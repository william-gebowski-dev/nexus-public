import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Force API mode so nexusApi routes through jsonGetSafe instead of MOCK_*.
vi.stubEnv("VITE_DATA_MODE", "api");

import { nexusApi, ApiContractError } from "./nexus-api";

const originalFetch = globalThis.fetch;

function stubJson(body: unknown) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  return fetchMock;
}

describe("nexusApi contrato (modo API)", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  // Métodos que hoje validam via jsonGetSafe: não devem regredir.
  describe("endpoints já validados", () => {
    beforeEach(() => vi.stubEnv("VITE_DATA_MODE", "api"));

    it("rejeita services com availabilityPct fora de 0..100", async () => {
      const fetchMock = stubJson([
        {
          id: "x",
          name: "x",
          latencyMs: 10,
          availabilityPct: 250,
          lastCheckedAt: "2026-07-30T00:00:00Z",
          sparkline24h: Array(12).fill(50),
          uptime7d: Array(7).fill(true),
          version: "1",
        },
      ]);
      await expect(nexusApi.services()).rejects.toBeInstanceOf(ApiContractError);
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  // Métodos que ainda passavam por jsonGet cru: agora devem bloquear.
  describe("endpoints antes sem validação", () => {
    beforeEach(() => vi.stubEnv("VITE_DATA_MODE", "api"));

    it("rejeita projects quando status está fora do enum", async () => {
      stubJson([
        { id: "x", name: "x", description: "d", category: "c", status: "zombie", priority: "low", progress: 10, updatedAt: "2026-07-30T00:00:00Z", source: "manual" },
      ]);
      await expect(nexusApi.projects()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita agents quando completedCount é negativo", async () => {
      stubJson([
        { id: "x", name: "x", role: "r", status: "active", model: "m", lastActivityAt: "2026-07-30T00:00:00Z", completedCount: -3, errorCount: 0, avgDurationMs: 10, source: "manual" },
      ]);
      await expect(nexusApi.agents()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita executions paginadas quando nextCursor é negativo", async () => {
      stubJson({ items: [], nextCursor: -5 });
      await expect(nexusApi.executions(10, 0)).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita activities paginadas com items não-array", async () => {
      stubJson({ items: "nope", nextCursor: null });
      await expect(nexusApi.activities(10, 0)).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita automations com successRatePct > 100", async () => {
      stubJson([
        { id: "x", name: "x", purpose: "p", status: "running", lastRunAt: null, nextRunAt: null, successRatePct: 180, source: "manual" },
      ]);
      await expect(nexusApi.automations()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita MCPs com status desconhecido", async () => {
      stubJson([
        { id: "x", name: "x", category: "c", status: "degraded", lastActivityAt: "2026-07-30T00:00:00Z", source: "manual" },
      ]);
      await expect(nexusApi.mcps()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita skills quando active não é booleano", async () => {
      stubJson([
        { id: "x", name: "x", purpose: "p", active: "yes", source: "manual" },
      ]);
      await expect(nexusApi.skills()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita models quando callsLast14d é negativo", async () => {
      stubJson([
        { id: "x", label: "x", status: "available", callsLast14d: -1, source: "manual" },
      ]);
      await expect(nexusApi.models()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita roadmap quando progress > 100", async () => {
      stubJson([
        { id: "x", title: "x", objective: "o", priority: "low", state: "pending", progress: 140, dueDate: null, dependencies: [], doneCriteria: "d", phase: "now", source: "manual" },
      ]);
      await expect(nexusApi.roadmap()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita alerts com severity desconhecida", async () => {
      stubJson([
        { id: "x", title: "x", description: "d", severity: "catastrophic", category: "operational", raisedAt: "2026-07-30T00:00:00Z", read: false, ignored: false, source: "manual" },
      ]);
      await expect(nexusApi.alerts()).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita search quando um grupo não é array", async () => {
      stubJson({ projects: {}, services: [], agents: [], mcps: [], skills: [], automations: [], activities: [], roadmap: [] });
      await expect(nexusApi.search("x")).rejects.toBeInstanceOf(ApiContractError);
    });

    it("rejeita availability com estado desconhecido no modo API", async () => {
      window.history.pushState({}, "", "/?mock=0");
      vi.resetModules();
      const apiMode = await import("./nexus-api");
      stubJson({ gateway: [{ id: "x", checkedAt: "2026-07-30T00:00:00Z", state: "maybe" }] });

      await expect(apiMode.nexusApi.availability()).rejects.toBeInstanceOf(
        apiMode.ApiContractError,
      );
    });
  });
});
