#!/usr/bin/env tsx
import {
  AiIncidentSchema,
  AiModelUsageSchema,
  AiProviderQuotaSchema,
  AiProviderUsageSchema,
  AiRequestRecordSchema,
  AiTopologySchema,
  AiUsageSummarySchema,
  NEXUS_API_SCHEMAS,
} from "../src/lib/schemas";
import {
  MOCK_AI_INCIDENTS,
  MOCK_AI_MODELS,
  MOCK_AI_PROVIDERS,
  MOCK_AI_QUOTAS,
  MOCK_AI_REQUESTS,
  MOCK_AI_SUMMARY,
  MOCK_AI_TOPOLOGY,
} from "../src/data/mock-ai-infrastructure";

console.log("=== Validando Contratos de Observabilidade de IA (Zod Schemas) ===");

type ContractCase = {
  name: string;
  res: { success: true } | { success: false; error: unknown };
};

const EDGE_AI_SUMMARY = {
  ...MOCK_AI_SUMMARY,
  source: "partial" as const,
  mostUsedProvider: null,
  mostUsedModel: null,
  lastRequestAt: null,
};

const EDGE_AI_REQUEST = {
  ...MOCK_AI_REQUESTS[0],
  status: "queued" as const,
  clientName: null,
  projectId: null,
  projectName: null,
  agentId: null,
  agentName: null,
  errorCategory: "429 - Limite temporário atingido",
};

const EDGE_AI_QUOTA = {
  ...MOCK_AI_QUOTAS[0],
  status: "near_limit" as const,
  usedPct: null,
  remainingPct: null,
  resetsAt: null,
  message: null,
};

const EDGE_AI_INCIDENT = {
  ...MOCK_AI_INCIDENTS[0],
  providerId: null,
  modelId: null,
  suggestedAction: null,
};

const cases: ContractCase[] = [
  { name: "MOCK_AI_SUMMARY", res: AiUsageSummarySchema.safeParse(MOCK_AI_SUMMARY) },
  { name: "MOCK_AI_TOPOLOGY", res: AiTopologySchema.safeParse(MOCK_AI_TOPOLOGY) },
  { name: "EDGE_AI_SUMMARY(partial/null)", res: AiUsageSummarySchema.safeParse(EDGE_AI_SUMMARY) },
  { name: "EDGE_AI_REQUEST(queued/null)", res: AiRequestRecordSchema.safeParse(EDGE_AI_REQUEST) },
  { name: "EDGE_AI_QUOTA(near_limit/null)", res: AiProviderQuotaSchema.safeParse(EDGE_AI_QUOTA) },
  { name: "EDGE_AI_INCIDENT(null)", res: AiIncidentSchema.safeParse(EDGE_AI_INCIDENT) },
  { name: "AI_MODEL_PAGE", res: NEXUS_API_SCHEMAS.aiModels.safeParse({ items: MOCK_AI_MODELS, snapshotId: null, capturedAt: null, source: "simulated" }) },
  { name: "AI_PROVIDER_PAGE", res: NEXUS_API_SCHEMAS.aiProviders.safeParse({ items: MOCK_AI_PROVIDERS, snapshotId: null, capturedAt: null, source: "simulated" }) },
  { name: "AI_QUOTA_PAGE", res: NEXUS_API_SCHEMAS.aiQuotas.safeParse({ items: MOCK_AI_QUOTAS, generatedAt: null, source: "simulated" }) },
  { name: "AI_INCIDENT_PAGE", res: NEXUS_API_SCHEMAS.aiIncidents.safeParse({ items: MOCK_AI_INCIDENTS, generatedAt: null, source: "simulated" }) },
  // Envelope vazio explícito — garante que `api/ai/incidents` e
  // `api/ai/quotas` continuam devolvendo `generatedAt`/`source` mesmo
  // quando não há itens. Sem este caso, a remoção do envelope quebra
  // o schema em runtime (ApiContractError) sem falhar o build.
  { name: "EDGE_AI_INCIDENT_PAGE_EMPTY", res: NEXUS_API_SCHEMAS.aiIncidents.safeParse({ items: [], generatedAt: null, source: "partial" }) },
  { name: "EDGE_AI_QUOTA_PAGE_EMPTY", res: NEXUS_API_SCHEMAS.aiQuotas.safeParse({ items: [], generatedAt: null, source: "partial" }) },
];

for (const [i, m] of MOCK_AI_MODELS.entries()) {
  cases.push({ name: `MOCK_AI_MODELS[${i}]`, res: AiModelUsageSchema.safeParse(m) });
}

for (const [i, p] of MOCK_AI_PROVIDERS.entries()) {
  cases.push({ name: `MOCK_AI_PROVIDERS[${i}]`, res: AiProviderUsageSchema.safeParse(p) });
}

for (const [i, q] of MOCK_AI_QUOTAS.entries()) {
  cases.push({ name: `MOCK_AI_QUOTAS[${i}]`, res: AiProviderQuotaSchema.safeParse(q) });
}

for (const [i, r] of MOCK_AI_REQUESTS.entries()) {
  cases.push({ name: `MOCK_AI_REQUESTS[${i}]`, res: AiRequestRecordSchema.safeParse(r) });
}

for (const [i, inc] of MOCK_AI_INCIDENTS.entries()) {
  cases.push({ name: `MOCK_AI_INCIDENTS[${i}]`, res: AiIncidentSchema.safeParse(inc) });
}

let fails = 0;
for (const c of cases) {
  if (c.res.success) {
    console.log(`✓ ${c.name}`);
  } else {
    console.error(`✗ ${c.name}`, c.res.error);
    fails++;
  }
}

if (fails > 0) {
  console.error(`\n❌ Validação de Contratos de IA FALHOU (${fails} erros em ${cases.length} itens).`);
  process.exit(1);
}

console.log(`\n✅ Contratos de Observabilidade de IA OK (${cases.length} itens validados).`);
