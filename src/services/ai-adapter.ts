import type {
  AiIncident,
  AiModelUsage,
  AiProviderQuota,
  AiProviderUsage,
  AiRequestRecord,
  AiTopology,
  AiUsagePeriod,
  AiUsageSummary,
} from "@/types/ai-infrastructure";
import {
  MOCK_AI_INCIDENTS,
  MOCK_AI_MODELS,
  MOCK_AI_PROVIDERS,
  MOCK_AI_QUOTAS,
  MOCK_AI_REQUESTS,
  MOCK_AI_SUMMARY,
  MOCK_AI_TOPOLOGY,
} from "@/data/mock-ai-infrastructure";

export interface AiInfrastructureAdapter {
  getSummary(period: AiUsagePeriod): Promise<AiUsageSummary>;
  getModels(period: AiUsagePeriod): Promise<AiModelUsage[]>;
  getProviders(period: AiUsagePeriod): Promise<AiProviderUsage[]>;
  getQuotas(): Promise<AiProviderQuota[]>;
  getRecentRequests(limit?: number, offset?: number): Promise<{ items: AiRequestRecord[]; nextCursor: number | null }>;
  getIncidents(): Promise<AiIncident[]>;
  getTopology(): Promise<AiTopology>;
}

export class MockAiInfrastructureAdapter implements AiInfrastructureAdapter {
  async getSummary(period: AiUsagePeriod): Promise<AiUsageSummary> {
    return { ...MOCK_AI_SUMMARY, period };
  }

  async getModels(_period: AiUsagePeriod): Promise<AiModelUsage[]> {
    return MOCK_AI_MODELS;
  }

  async getProviders(_period: AiUsagePeriod): Promise<AiProviderUsage[]> {
    return MOCK_AI_PROVIDERS;
  }

  async getQuotas(): Promise<AiProviderQuota[]> {
    return MOCK_AI_QUOTAS;
  }

  async getRecentRequests(limit = 10, offset = 0): Promise<{ items: AiRequestRecord[]; nextCursor: number | null }> {
    const page = MOCK_AI_REQUESTS.slice(offset, offset + limit);
    const nextCursor = offset + limit < MOCK_AI_REQUESTS.length ? offset + limit : null;
    return { items: page, nextCursor };
  }

  async getIncidents(): Promise<AiIncident[]> {
    return MOCK_AI_INCIDENTS;
  }

  async getTopology(): Promise<AiTopology> {
    return MOCK_AI_TOPOLOGY;
  }
}
