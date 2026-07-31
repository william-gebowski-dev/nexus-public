#!/usr/bin/env tsx
/**
 * Valida runtime o shape dos mocks centrais contra os schemas Zod.
 *
 * Roda via `npx tsx` (Node 24, sem instalar tsx como dep). Usa o mesmo
 * NEXUS_API_SCHEMAS que o front usa em runtime — assim, qualquer drift
 * entre tipo, mock e schema é detectado aqui.
 *
 * Falha não-bloqueante: se o shape divergir, imprime warnings com o path
 * do mock e os issues do Zod. Não derruba o build porque hoje ainda há
 * campos opcionais e enums em transição; quando os schemas estiverem
 * estáveis, promover para erro duro.
 *
 * Uso: npx tsx scripts/check-shapes.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  NEXUS_API_SCHEMAS,
  CronStatusSchema,
  ExecutionSchema,
  RoutineDaySchema,
  GeneratedArtifactSchema,
  InfrastructureServiceSchema,
  AgentSchema,
  McpSchema,
  SkillSchema,
  AutomationSchema,
  ModelInfoSchema,
  ProjectSchema,
  RoadmapItemSchema,
  AlertSchema,
  ActivitySchema,
} from "../src/lib/schemas";
import {
  MOCK_CRON_STATUS,
  MOCK_ROUTINE_TODAY,
  MOCK_RECENT_EXECUTIONS,
  MOCK_GENERATED_ARTIFACTS,
  MOCK_INFRASTRUCTURE,
} from "../src/data/mock-routine";
import {
  MOCK_AI_SUMMARY,
  MOCK_AI_TOPOLOGY,
} from "../src/data/mock-ai-infrastructure";
import {
  AiUsageSummarySchema,
  AiTopologySchema,
} from "../src/lib/schemas";

type Case = { name: string; result: { success: boolean; error?: unknown } };

const cases: Case[] = [
  { name: "MOCK_CRON_STATUS", result: CronStatusSchema.safeParse(MOCK_CRON_STATUS) },
  { name: "MOCK_ROUTINE_TODAY", result: RoutineDaySchema.safeParse(MOCK_ROUTINE_TODAY) },
  { name: "MOCK_AI_SUMMARY", result: AiUsageSummarySchema.safeParse(MOCK_AI_SUMMARY) },
  { name: "MOCK_AI_TOPOLOGY", result: AiTopologySchema.safeParse(MOCK_AI_TOPOLOGY) },
];

for (const [i, exec] of MOCK_RECENT_EXECUTIONS.entries()) {
  cases.push({
    name: `MOCK_RECENT_EXECUTIONS[${i}]`,
    result: ExecutionSchema.safeParse(exec),
  });
}

for (const [i, art] of MOCK_GENERATED_ARTIFACTS.entries()) {
  cases.push({
    name: `MOCK_GENERATED_ARTIFACTS[${i}]`,
    result: GeneratedArtifactSchema.safeParse(art),
  });
}

for (const [i, svc] of MOCK_INFRASTRUCTURE.entries()) {
  cases.push({
    name: `MOCK_INFRASTRUCTURE[${i}]`,
    result: InfrastructureServiceSchema.safeParse(svc),
  });
}

// Mocks JSON legados — lidos do disco e validados contra os schemas.
const dataDir = join(import.meta.dirname ?? ".", "..", "src", "mocks", "data");

const jsonSchemas: Record<string, { schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } } }> = {
  "services.json": { schema: { safeParse: (v) => InfrastructureServiceSchema.array().safeParse(v) } },
  "agents.json": { schema: { safeParse: (v) => AgentSchema.array().safeParse(v) } },
  "mcps.json": { schema: { safeParse: (v) => McpSchema.array().safeParse(v) } },
  "skills.json": { schema: { safeParse: (v) => SkillSchema.array().safeParse(v) } },
  "automations.json": { schema: { safeParse: (v) => AutomationSchema.array().safeParse(v) } },
  "models.json": { schema: { safeParse: (v) => ModelInfoSchema.array().safeParse(v) } },
  "projects.json": { schema: { safeParse: (v) => ProjectSchema.array().safeParse(v) } },
  "roadmap.json": { schema: { safeParse: (v) => RoadmapItemSchema.array().safeParse(v) } },
  "alerts.json": { schema: { safeParse: (v) => AlertSchema.array().safeParse(v) } },
  "activities.json": { schema: { safeParse: (v) => ActivitySchema.array().safeParse(v) } },
};

for (const file of Object.keys(jsonSchemas)) {
  try {
    const raw = readFileSync(join(dataDir, file), "utf8");
    const data = JSON.parse(raw);
    const result = jsonSchemas[file].schema.safeParse(data);
    cases.push({ name: file, result });
  } catch (err) {
    cases.push({ name: file, result: { success: false, error: String(err) } });
  }
}

// Apenas confere que NEXUS_API_SCHEMAS é importável — não roda contra dados.
cases.push({
  name: "NEXUS_API_SCHEMAS importável",
  result: { success: !!NEXUS_API_SCHEMAS && typeof NEXUS_API_SCHEMAS === "object" },
});

let failures = 0;
for (const c of cases) {
  if (c.result.success) {
    console.log(`✓ ${c.name}`);
  } else {
    console.error(`✗ ${c.name}`, c.result.error);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n❌ Shape check FALHOU (${failures} de ${cases.length}).`);
  process.exit(1);
}
console.log(`\n✅ Shape check OK (${cases.length} mocks validados).`);
