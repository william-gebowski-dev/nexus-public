/**
 * Wrappers dinâmicos para os mocks de dados.
 *
 * Por que este arquivo existe:
 *
 *   Antes, `src/services/nexus-api.ts` importava `MOCK_*` no topo do
 *   módulo (`import { MOCK_AI_MODELS } from "@/data/mock-..."`). Mesmo
 *   com `DATA_MODE === "api"`, Rollup/Vite não conseguiam tree-shake
 *   branches condicionais simples (`USE_MOCK_DATA ? MOCK_X : ...`) e
 *   os mocks iam parar no bundle de produção.
 *
 *   Agora, `nexus-api.ts` chama `await import("@/mocks/runtime-mocks")`
 *   **apenas** quando `DATA_MODE === "mock"`. O bundle prod-api não
 *   carrega este módulo nem o conteúdo de `src/data/mock-*`. Tree-shake
 *   robusto via dynamic import.
 *
 * Cada função aqui retorna o shape exato que `nexusApi.<método>`
 * devolveria em modo real — sem precisar repetir os envelopes duas
 * vezes.
 */

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

export async function getMockCronStatus() {
  return MOCK_CRON_STATUS;
}

export async function getMockRoutineToday() {
  return MOCK_ROUTINE_TODAY;
}

export async function getMockRoutine(date: string) {
  return { ...MOCK_ROUTINE_TODAY, date };
}

export async function getMockExecutionById(id: string) {
  return MOCK_RECENT_EXECUTIONS.find((e) => e.id === id) ?? null;
}

export async function getMockDailyReport(date: string) {
  return (
    MOCK_DAILY_REPORT[date] ??
    MOCK_DAILY_REPORT[Object.keys(MOCK_DAILY_REPORT)[0]]
  );
}

export async function getMockRecentExecutions(limit: number, cursor: number | null) {
  const start = cursor ?? 0;
  const end = start + limit;
  const page = MOCK_RECENT_EXECUTIONS.slice(start, end);
  return {
    items: page,
    nextCursor: end < MOCK_RECENT_EXECUTIONS.length ? end : null,
    totalItems: MOCK_RECENT_EXECUTIONS.length,
  };
}

export async function getMockArtifacts() {
  return MOCK_GENERATED_ARTIFACTS;
}

export async function getMockInfrastructure() {
  return MOCK_INFRASTRUCTURE;
}

export async function getMockAvailability() {
  return MOCK_AVAILABILITY;
}

// === AI Infrastructure ==================================================

export async function getMockAiSummary(period: AiUsagePeriod) {
  return { ...MOCK_AI_SUMMARY, period };
}

export async function getMockAiTimeseries(metric: string, period: AiUsagePeriod) {
  // Sem `Math.random()` em código de produção. Mantemos pontos
  // determinísticos para que snapshots reproduzam entre visitas.
  const points = Array.from({ length: 12 }, (_, i) => ({
    bucket: `${String(i * 2).padStart(2, "0")}:00`,
    value: metric === "tokens" ? 10_000_000 + i * 1_500_000 : 1 + i,
  }));
  return { metric, period, points, source: "simulated" as const };
}

export async function getMockAiModelsPage(period: AiUsagePeriod) {
  return {
    items: MOCK_AI_MODELS,
    snapshotId: null,
    capturedAt: null,
    source: "simulated" as const,
    period,
  };
}

export async function getMockAiProvidersPage(period: AiUsagePeriod) {
  return {
    items: MOCK_AI_PROVIDERS,
    snapshotId: null,
    capturedAt: null,
    source: "simulated" as const,
    period,
  };
}

export async function getMockAiQuotasPage() {
  return {
    items: MOCK_AI_QUOTAS,
    generatedAt: null,
    source: "simulated" as const,
  };
}

export async function getMockAiRequestsPage(limit: number, cursor: number | null) {
  const start = cursor ?? 0;
  const end = start + limit;
  return {
    items: MOCK_AI_REQUESTS.slice(start, end),
    nextCursor: end < MOCK_AI_REQUESTS.length ? end : null,
  };
}

export async function getMockAiIncidentsPage() {
  return {
    items: MOCK_AI_INCIDENTS,
    generatedAt: null,
    source: "simulated" as const,
  };
}

export async function getMockAiTopology() {
  return MOCK_AI_TOPOLOGY;
}