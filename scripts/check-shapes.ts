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
import {
  NEXUS_API_SCHEMAS,
  CronStatusSchema,
  ExecutionSchema,
  RoutineDaySchema,
  GeneratedArtifactSchema,
  InfrastructureServiceSchema,
} from "../src/lib/schemas";
import {
  MOCK_CRON_STATUS,
  MOCK_ROUTINE_TODAY,
  MOCK_RECENT_EXECUTIONS,
  MOCK_GENERATED_ARTIFACTS,
  MOCK_INFRASTRUCTURE,
} from "../src/data/mock-routine";

type Case = { name: string; result: { success: boolean; error?: unknown } };

const cases: Case[] = [
  { name: "MOCK_CRON_STATUS", result: CronStatusSchema.safeParse(MOCK_CRON_STATUS) },
  { name: "MOCK_ROUTINE_TODAY", result: RoutineDaySchema.safeParse(MOCK_ROUTINE_TODAY) },
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
