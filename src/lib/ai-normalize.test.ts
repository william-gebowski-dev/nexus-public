import { describe, expect, it } from "vitest";
import {
  aggregateSnapshot,
  detectIncident,
  normalizeRouterQuota,
  normalizeRouterRequest,
} from "./ai-normalize";
import {
  AiIncidentSchema,
  AiProviderQuotaSchema,
  AiRequestRecordSchema,
  AiUsageSummarySchema,
} from "./schemas";

const NOW = new Date("2026-07-31T17:03:00-03:00");

describe("9Router → Nexus AI contracts", () => {
  it("normaliza erro 429 como request queued com categoria preservada", () => {
    const request = normalizeRouterRequest(
      {
        requestId: "req-rate-limit",
        timestamp: "2026-07-31T17:02:00-03:00",
        provider: "z-ai-nvidia",
        model: "glm-5-2",
        client: "hermes-12x4",
        inputTokens: 1200,
        cachedTokens: 300,
        outputTokens: 80,
        durationMs: 1600,
        status: 429,
      },
      NOW,
    );

    expect(request.status).toBe("queued");
    expect(request.errorCategory).toBe("429 - Limite temporário atingido");
    expect(request.totalTokens).toBe(1280);
    expect(request.clientName).toBe("Hermes 12×4");
    expect(AiRequestRecordSchema.safeParse(request).success).toBe(true);
  });

  it("gera incidente de rate limit mesmo quando a requisição fica em fila", () => {
    const request = normalizeRouterRequest(
      {
        requestId: "req-rate-limit-incident",
        timestamp: "2026-07-31T17:02:00-03:00",
        provider: "z-ai-nvidia",
        model: "glm-5-2",
        status: 429,
      },
      NOW,
    );

    const incident = detectIncident(request, null);

    expect(incident?.type).toBe("rate_limit_exceeded");
    expect(incident?.severity).toBe("warning");
    expect(AiIncidentSchema.safeParse(incident).success).toBe(true);
  });

  it("normaliza quota low do 9Router para near_limit do contrato público", () => {
    const quota = normalizeRouterQuota(
      {
        providerId: "z-ai-nvidia",
        quotaType: "Tokens por minuto",
        status: "low",
        usedPct: 86,
        remainingPct: 14,
        message: "Janela próxima do limite.",
      },
      NOW,
    );

    expect(quota.status).toBe("near_limit");
    expect(quota.providerName).toBe("NVIDIA Cloud");
    expect(AiProviderQuotaSchema.safeParse(quota).success).toBe(true);
  });

  it("agrega snapshot parcial sem contar queued como sucesso", () => {
    const queued = normalizeRouterRequest(
      {
        requestId: "req-queued",
        timestamp: "2026-07-31T17:02:00-03:00",
        provider: "z-ai-nvidia",
        model: "glm-5-2",
        status: 429,
      },
      NOW,
    );
    const success = normalizeRouterRequest(
      {
        requestId: "req-success",
        timestamp: "2026-07-31T17:03:00-03:00",
        provider: "claude-code",
        model: "claude-sonnet-5",
        inputTokens: 10,
        outputTokens: 5,
        status: 200,
      },
      NOW,
    );

    const snapshot = aggregateSnapshot([queued, success], [], "today", NOW);

    expect(snapshot.successfulRequests).toBe(1);
    expect(snapshot.failedRequests).toBe(0);
    expect(snapshot.totalRequests).toBe(2);
    expect(snapshot.totalTokens).toBe(15);
    expect(AiUsageSummarySchema.safeParse(snapshot).success).toBe(true);
  });
});
