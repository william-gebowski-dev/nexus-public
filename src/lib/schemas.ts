/**
 * Schemas Zod para validação runtime das respostas dos endpoints públicos
 * (`/api/*`). Os tipos em `src/types/*.ts` continuam sendo o contrato TS;
 * os schemas aqui complementam com validação em runtime, fechando o gap
 * de drift entre mocks e backend real.
 *
 * Convenção:
 *  - Schema exportado em PascalCase com sufixo `Schema`.
 *  - Tipo TS exportado via `z.infer<typeof XSchema>` — não duplicar.
 *  - Apenas recursos com contrato de API público ganham schema. Tipos
 *    internos (UI props, helpers) continuam em `src/types/`.
 */
import { z } from "zod";

// === CronStatus ============================================================

export const CronStatusSchema = z.object({
  gatewayRunning: z.boolean(),
  gatewayPid: z.number().int().nullable(),
  activeJobs: z.number().int(),
  totalJobs: z.literal(48),
  nextRunAt: z.string(),
  heartbeatSecondsAgo: z.number(),
  lastRunAt: z.string().nullable(),
  lastFailureAt: z.string().nullable(),
  provider: z.literal("custom"),
  model: z.literal("9Router"),
  delivery: z.literal("local"),
  tickerOk: z.boolean(),
});
export type CronStatusParsed = z.infer<typeof CronStatusSchema>;

// === NexusSystemStatus =====================================================

const ServiceStatusEnum = z.enum(["healthy", "attention", "down"]);
const DataSourceEnum = z.enum(["live", "periodic", "manual", "simulated"]);
const NexusSystemStateEnum = z.enum([
  "operational",
  "attention_required",
  "unavailable",
  "maintenance",
]);

export const TechnicalSummarySchema = z.object({
  activeMcps: z.number(),
  activeSkills: z.number(),
  activeAgents: z.number(),
  runningAutomations: z.number(),
  activeContainers: z.number(),
  lastSyncAt: z.string().nullable(),
  lastBackupAt: z.string().nullable(),
  lastFailureAt: z.string().nullable(),
});

export const NexusSystemStatusSchema = z.object({
  status: NexusSystemStateEnum,
  overall: NexusSystemStateEnum.optional(),
  message: z.string(),
  generatedAt: z.string(),
  lastUpdate: z.string(),
  uptimeSeconds: z.number().nullable(),
  cpuUsage: z.number().nullable(),
  memoryUsage: z.number().nullable(),
  diskUsage: z.number().nullable(),
  counts: z.object({
    servicesOperational: z.number(),
    servicesAttention: z.number(),
    servicesUnavailable: z.number(),
    agentsActive: z.number(),
    mcpsActive: z.number(),
    skillsActive: z.number(),
    automationsActive: z.number(),
    projectsActive: z.number(),
    executionsLast24h: z.number(),
  }),
  technicalSummary: TechnicalSummarySchema,
  source: DataSourceEnum,
});
export type NexusSystemStatusParsed = z.infer<typeof NexusSystemStatusSchema>;

// === RoutineDay ============================================================

const BlockExecutionStateEnum = z.enum([
  "scheduled",
  "running",
  "completed",
  "partial",
  "failed",
  "cancelled",
  "skipped",
  "unknown",
]);
const RoutineSlotEnum = z.enum(["coletar", "analisar", "produzir", "consolidar"]);
const ArtifactKindEnum = z.enum([
  "report",
  "boletim",
  "study-plan",
  "pauta",
  "content",
  "roadmap",
  "leads",
  "project-update",
  "note",
  "daily-report",
]);

export const GeneratedArtifactSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: ArtifactKindEnum,
  sourceJobId: z.string(),
  createdAt: z.string(),
  projectId: z.string().optional(),
  sizeBytes: z.number().optional(),
  publicPath: z.string(),
});
export type GeneratedArtifactParsed = z.infer<typeof GeneratedArtifactSchema>;

export const RoutineTaskSchema = z.object({
  id: z.string(),
  jobName: z.string(),
  blockId: z.number().int(),
  slot: RoutineSlotEnum,
  scheduledTime: z.string(),
  title: z.string(),
  description: z.string(),
  status: BlockExecutionStateEnum,
  provider: z.string(),
  model: z.string(),
  delivery: z.string(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  durationSeconds: z.number().optional(),
  dependsOn: z.array(z.string()),
  projectId: z.string().optional(),
  resultSummary: z.string().optional(),
  artifactIds: z.array(z.string()).optional(),
});

export const RoutineBlockSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  tasks: z.array(RoutineTaskSchema),
  status: BlockExecutionStateEnum,
  completedCount: z.number().int(),
  failedCount: z.number().int(),
});

export const DailyActivitySchema = z.object({
  id: z.string(),
  text: z.string(),
  at: z.string(),
  state: z.enum(["success", "running", "warning", "error"]),
});

export const RoutineDaySchema = z.object({
  date: z.string(),
  timezone: z.literal("America/Sao_Paulo"),
  totalBlocks: z.literal(12),
  totalJobs: z.literal(48),
  completedJobs: z.number().int(),
  failedJobs: z.number().int(),
  runningJobs: z.number().int(),
  nextExecutionAt: z.string(),
  blocks: z.array(RoutineBlockSchema),
  artifacts: z.array(GeneratedArtifactSchema),
  recentActivities: z.array(DailyActivitySchema),
});
export type RoutineDayParsed = z.infer<typeof RoutineDaySchema>;

// === Execution ============================================================

export const ExecutionStatusEnum = z.enum([
  "success",
  "running",
  "failed",
  "cancelled",
  "queued",
]);

export const ExecutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  runner: z.string(),
  agent: z.string().optional(),
  project: z.string().optional(),
  projectId: z.string().optional(),
  actionLabel: z.string().optional(),
  startedAt: z.string(),
  durationMs: z.number().nonnegative(),
  status: ExecutionStatusEnum,
  summary: z.string(),
  source: DataSourceEnum,
});
export type ExecutionParsed = z.infer<typeof ExecutionSchema>;

export const ExecutionPageSchema = z.object({
  items: z.array(ExecutionSchema),
  nextCursor: z.number().nullable(),
});

// === InfrastructureService =================================================
//
// O tipo público `InfrastructureService extends Service` traz campos ricos
// (category, status, description, trend, source) que o consumidor preenche
// em runtime. O mock atual produz a versão "rotina" (apenas id/nome/latência/
// availability/sparkline/uptime/version). Este schema aceita ambas — campos
// extras são opcionais — para que o shape check não dependa da camada de
// enriquecimento. Quando o backend real substituir os mocks, ele retorna
// o envelope cheio e o schema continua válido.

export const InfrastructureServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Campos do Service base (opcionais — mocks rotina não preenchem)
  category: z.enum(["ia", "api", "web"]).optional(),
  status: ServiceStatusEnum.optional(),
  description: z.string().optional(),
  trend: z.enum(["up", "down", "flat"]).optional(),
  source: DataSourceEnum.optional(),
  // Campos do RoutineInfrastructureService (obrigatórios)
  latencyMs: z.number(),
  availabilityPct: z.number(),
  lastCheckedAt: z.string(),
  sparkline24h: z.array(z.number()).length(12),
  uptime7d: z.array(z.boolean()).length(7),
  version: z.string(),
  // Campos estendidos
  publicLabel: z.string().optional(),
  usageLabel: z.string().optional(),
  availability24hPct: z.number().optional(),
  availability7dPct: z.number().optional(),
  lastFailureAt: z.string().nullable().optional(),
  detailsHref: z.string().optional(),
  availabilityChecks: z
    .array(
      z.object({
        id: z.string(),
        checkedAt: z.string(),
        state: z.enum(["operational", "instability", "unavailable", "no_data"]),
      }),
    )
    .optional(),
});

// === Map de schemas por método do nexusApi ================================
//
// A chave é o nome do método em `nexusApi`. Usado tanto em runtime
// (`nexusApi` valida a resposta antes de devolver) quanto em build-time
// (`scripts/check-mocks.js` valida os mocks contra o mesmo schema).

export const NEXUS_API_SCHEMAS = {
  cronStatus: CronStatusSchema,
  systemStatus: NexusSystemStatusSchema,
  routineToday: RoutineDaySchema,
  recentExecutions: ExecutionPageSchema,
  executionById: ExecutionSchema.nullable(),
  dailyReport: z.object({
    date: z.string(),
    scheduledJobs: z.number(),
    completedJobs: z.number(),
    failedJobs: z.number(),
    completeBlocks: z.number(),
    highlights: z.array(z.string()),
    discoveries: z.array(z.string()),
    incidents: z.array(z.string()),
    pending: z.array(z.string()),
    humanDecisions: z.array(z.string()),
  }),
  artifacts: z.array(GeneratedArtifactSchema),
  infrastructure: z.array(InfrastructureServiceSchema),
  availability: z.record(z.string(), z.array(z.unknown())),
} as const;

export type NexusApiMethod = keyof typeof NEXUS_API_SCHEMAS;
