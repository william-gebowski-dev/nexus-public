#!/usr/bin/env tsx
import {
  AiIncidentSchema,
  AiModelUsageSchema,
  AiProviderQuotaSchema,
  AiProviderUsageSchema,
  AiRequestRecordSchema,
  AiTopologySchema,
  AiUsageSummarySchema,
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

const cases = [
  { name: "MOCK_AI_SUMMARY", res: AiUsageSummarySchema.safeParse(MOCK_AI_SUMMARY) },
  { name: "MOCK_AI_TOPOLOGY", res: AiTopologySchema.safeParse(MOCK_AI_TOPOLOGY) },
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
