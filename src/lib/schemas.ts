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
  activeJobs: z.number().int().nonnegative(),
  totalJobs: z.literal(48),
  nextRunAt: z.string().datetime({ offset: true }),
  heartbeatSecondsAgo: z.number().int().nonnegative(),
  lastRunAt: z.string().datetime({ offset: true }).nullable(),
  lastFailureAt: z.string().datetime({ offset: true }).nullable(),
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

/**
 * Porcentagem 0..100. Usado em CPU/memória/disco/availability/latência
 * para rejeitar valores absurdos (CPU -40%, memória 340%).
 */
const PercentageSchema = z.number().min(0).max(100);

export const TechnicalSummarySchema = z.object({
  activeMcps: z.number().int().nonnegative(),
  activeSkills: z.number().int().nonnegative(),
  activeAgents: z.number().int().nonnegative(),
  runningAutomations: z.number().int().nonnegative(),
  activeContainers: z.number().int().nonnegative(),
  lastSyncAt: z.string().datetime({ offset: true }).nullable(),
  lastBackupAt: z.string().datetime({ offset: true }).nullable(),
  lastFailureAt: z.string().datetime({ offset: true }).nullable(),
});

export const NexusSystemStatusSchema = z.object({
  status: NexusSystemStateEnum,
  overall: NexusSystemStateEnum.optional(),
  message: z.string(),
  generatedAt: z.string().datetime({ offset: true }),
  lastUpdate: z.string().datetime({ offset: true }),
  uptimeSeconds: z.number().int().nonnegative().nullable(),
  cpuUsage: PercentageSchema.nullable(),
  memoryUsage: PercentageSchema.nullable(),
  diskUsage: PercentageSchema.nullable(),
  counts: z.object({
    servicesOperational: z.number().int().nonnegative(),
    servicesAttention: z.number().int().nonnegative(),
    servicesUnavailable: z.number().int().nonnegative(),
    agentsActive: z.number().int().nonnegative(),
    mcpsActive: z.number().int().nonnegative(),
    skillsActive: z.number().int().nonnegative(),
    automationsActive: z.number().int().nonnegative(),
    projectsActive: z.number().int().nonnegative(),
    executionsLast24h: z.number().int().nonnegative(),
  }),
  technicalSummary: TechnicalSummarySchema,
  source: DataSourceEnum,
});
export type NexusSystemStatusParsed = z.infer<typeof NexusSystemStatusSchema>;

// === RoutineDay ============================================================
//
// A regra 12×4 é o coração do produto e o schema precisa garantir
// integridade estrutural, não só literais nos totais declarados.

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

/** `HH:00` ou `HH:30` — granularidade semianual (00:00, 00:30, …, 23:30). */
const SEMIHOURLY_TIME = /^([01]\d|2[0-3]):(00|30)$/;

/** IDs canônicos `job-30m-01`..`job-30m-48`. */
const JOB_ID = /^job-30m-(0[1-9]|[1-3][0-9]|4[0-8])$/;

export const GeneratedArtifactSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: ArtifactKindEnum,
  sourceJobId: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  projectId: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  publicPath: z.string(),
});
export type GeneratedArtifactParsed = z.infer<typeof GeneratedArtifactSchema>;

export const RoutineTaskSchema = z.object({
  id: z.string().regex(JOB_ID, "id deve seguir padrão job-30m-01..48"),
  jobName: z.string(),
  blockId: z.number().int().min(1).max(12),
  slot: RoutineSlotEnum,
  scheduledTime: z.string().regex(SEMIHOURLY_TIME, "horário deve ser HH:00 ou HH:30"),
  title: z.string(),
  description: z.string(),
  status: BlockExecutionStateEnum,
  provider: z.string(),
  model: z.string(),
  delivery: z.string(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  finishedAt: z.string().datetime({ offset: true }).optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  dependsOn: z.array(z.string()),
  projectId: z.string().optional(),
  resultSummary: z.string().optional(),
  artifactIds: z.array(z.string()).optional(),
});

/**
 * Cada bloco tem exatamente 4 tarefas (coletar → analisar → produzir → consolidar).
 * A contagem rígida garante a regra 12×4 no nível de schema, não só na rotina
 * de geração.
 */
export const RoutineBlockSchema = z.object({
  id: z.number().int().min(1).max(12),
  name: z.string(),
  windowStart: z.string().regex(SEMIHOURLY_TIME),
  windowEnd: z.string().regex(SEMIHOURLY_TIME),
  tasks: z.array(RoutineTaskSchema).length(4),
  status: BlockExecutionStateEnum,
  completedCount: z.number().int().min(0).max(4),
  failedCount: z.number().int().min(0).max(4),
});

export const DailyActivitySchema = z.object({
  id: z.string(),
  text: z.string(),
  at: z.string().datetime({ offset: true }),
  state: z.enum(["success", "running", "warning", "error"]),
});

/** `America/Sao_Paulo` pinado; totalBlocks=12 e totalJobs=48 são literais. */
export const RoutineDaySchema = z.object({
  date: z.string(),
  timezone: z.literal("America/Sao_Paulo"),
  totalBlocks: z.literal(12),
  totalJobs: z.literal(48),
  completedJobs: z.number().int().nonnegative(),
  failedJobs: z.number().int().nonnegative(),
  runningJobs: z.number().int().nonnegative(),
  nextExecutionAt: z.string().datetime({ offset: true }),
  blocks: z.array(RoutineBlockSchema).length(12),
  artifacts: z.array(GeneratedArtifactSchema),
  recentActivities: z.array(DailyActivitySchema),
}).superRefine((routine, ctx) => {
  const blockIds = new Set<number>();
  const jobIds = new Set<string>();

  routine.blocks.forEach((block, blockIndex) => {
    if (blockIds.has(block.id)) {
      ctx.addIssue({
        code: "custom",
        message: `block id duplicado: ${block.id}`,
        path: ["blocks", blockIndex, "id"],
      });
    }
    blockIds.add(block.id);

    block.tasks.forEach((task, taskIndex) => {
      if (task.blockId !== block.id) {
        ctx.addIssue({
          code: "custom",
          message: `blockId ${task.blockId} não corresponde ao bloco ${block.id}`,
          path: ["blocks", blockIndex, "tasks", taskIndex, "blockId"],
        });
      }
      if (jobIds.has(task.id)) {
        ctx.addIssue({
          code: "custom",
          message: `job id duplicado: ${task.id}`,
          path: ["blocks", blockIndex, "tasks", taskIndex, "id"],
        });
      }
      jobIds.add(task.id);
    });
  });
});
export type RoutineDayParsed = z.infer<typeof RoutineDaySchema>;

// === Execution ============================================================

export const ExecutionStatusEnum = z.enum([
  "success",
  "running",
  "failed",
  "cancelled",
  "queued",
  "partial",
]);

export const ExecutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  runner: z.string(),
  jobId: z.string().regex(/^job-30m-\d{1,2}$/).optional(),
  blockId: z.number().int().min(1).max(12).optional(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  agent: z.string().optional(),
  project: z.string().optional(),
  projectId: z.string().optional(),
  actionLabel: z.string().optional(),
  startedAt: z.string().datetime({ offset: true }),
  durationMs: z.number().nonnegative(),
  status: ExecutionStatusEnum,
  summary: z.string(),
  source: DataSourceEnum,
});
export type ExecutionParsed = z.infer<typeof ExecutionSchema>;

export const ExecutionPageSchema = z.object({
  items: z.array(ExecutionSchema),
  nextCursor: z.number().int().nonnegative().nullable(),
  totalItems: z.number().int().nonnegative().optional(),
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
  category: z.string().optional(),
  status: ServiceStatusEnum.optional(),
  description: z.string().optional(),
  trend: z.enum(["up", "down", "flat"]).optional(),
  source: DataSourceEnum.optional(),
  // Campos do RoutineInfrastructureService (obrigatórios)
  latencyMs: z.number().nonnegative(),
  availabilityPct: PercentageSchema,
  lastCheckedAt: z.string().datetime({ offset: true }),
  sparkline24h: z.array(PercentageSchema).length(12),
  uptime7d: z.array(z.boolean()).length(7),
  version: z.string(),
  // Campos estendidos
  publicLabel: z.string().optional(),
  usageLabel: z.string().optional(),
  availability24hPct: PercentageSchema.optional(),
  availability7dPct: PercentageSchema.optional(),
  lastFailureAt: z.string().datetime({ offset: true }).nullable().optional(),
  detailsHref: z.string().optional(),
  availabilityChecks: z
    .array(
      z.object({
        id: z.string(),
        checkedAt: z.string().datetime({ offset: true }),
        state: z.enum(["operational", "instability", "unavailable", "no_data"]),
      }),
    )
    .optional(),
});

// === Agents / MCPs / Skills / Automations / Models ========================

export const AgentStatusEnum = z.enum(["active", "paused", "disabled"]);
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  status: AgentStatusEnum,
  model: z.string(),
  lastActivityAt: z.string().datetime({ offset: true }),
  completedCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  avgDurationMs: z.number().nonnegative(),
  source: DataSourceEnum,
});

export const McpStatusEnum = z.enum(["connected", "unavailable"]);
export const McpSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  status: McpStatusEnum,
  lastActivityAt: z.string().datetime({ offset: true }),
  source: DataSourceEnum,
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string(),
  active: z.boolean(),
  source: DataSourceEnum,
});

export const AutomationStatusEnum = z.enum(["running", "paused", "failed", "scheduled"]);
export const AutomationSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string(),
  status: AutomationStatusEnum,
  project: z.string().optional(),
  lastRunAt: z.string().datetime({ offset: true }).nullable(),
  nextRunAt: z.string().datetime({ offset: true }).nullable(),
  successRatePct: PercentageSchema,
  source: DataSourceEnum,
});

export const ModelStatusEnum = z.enum(["available", "rate_limited", "offline"]);
export const ModelInfoSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: ModelStatusEnum,
  callsLast14d: z.number().int().nonnegative(),
  source: DataSourceEnum,
});

// === Projects / Roadmap / Alerts / Activities / Search ====================

export const ProjectStatusEnum = z.enum([
  "planning",
  "development",
  "validation",
  "operational",
  "paused",
  "archived",
]);
export const PriorityEnum = z.enum(["critical", "high", "medium", "low"]);

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().max(140),
  category: z.string(),
  status: ProjectStatusEnum,
  priority: PriorityEnum,
  progress: PercentageSchema,
  currentPhase: z.string(),
  nextAction: z.string(),
  updatedAt: z.string().datetime({ offset: true }),
  tech: z.array(z.string()),
  publicUrl: z.string().optional(),
  source: DataSourceEnum,
});

export const RoadmapPhaseEnum = z.enum(["now", "next", "future", "done"]);
export const RoadmapStateEnum = z.enum(["pending", "in_progress", "blocked", "done"]);
export const RoadmapItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  objective: z.string(),
  projectSlug: z.string().optional(),
  priority: PriorityEnum,
  state: RoadmapStateEnum,
  progress: PercentageSchema,
  dueDate: z.string().nullable(),
  dependencies: z.array(z.string()),
  doneCriteria: z.string(),
  phase: RoadmapPhaseEnum,
  source: DataSourceEnum,
});

export const AlertCategoryEnum = z.enum([
  "service_down",
  "data_stale",
  "automation_error",
  "agent_idle",
  "deploy_failed",
  "limit_near",
  "integration_offline",
]);
export const AlertSeverityEnum = z.enum(["info", "warning", "critical"]);
export const AlertSchema = z.object({
  id: z.string(),
  category: AlertCategoryEnum,
  severity: AlertSeverityEnum,
  title: z.string(),
  description: z.string(),
  raisedAt: z.string().datetime({ offset: true }),
  read: z.boolean(),
  ignored: z.boolean(),
  source: DataSourceEnum,
});

export const ActivityKindEnum = z.enum([
  "service_started",
  "service_stopped",
  "agent_run",
  "automation_completed",
  "project_updated",
  "deploy",
  "error_detected",
  "integration_added",
  "document_updated",
]);
export const ActivityScopeEnum = z.enum([
  "infrastructure",
  "ai",
  "projects",
  "deploys",
  "alerts",
]);
export const ActivityStateEnum = z.enum(["success", "running", "warning", "error"]);
export const ActivitySchema = z.object({
  id: z.string(),
  kind: ActivityKindEnum,
  title: z.string(),
  description: z.string(),
  occurredAt: z.string().datetime({ offset: true }),
  origin: z.string(),
  severity: AlertSeverityEnum,
  scope: ActivityScopeEnum,
  source: DataSourceEnum,
  actor: z.string().optional(),
  action: z.string().optional(),
  project: z.string().optional(),
  result: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  state: ActivityStateEnum.optional(),
});

export const ActivityPageSchema = z.object({
  items: z.array(ActivitySchema),
  nextCursor: z.number().int().nonnegative().nullable(),
});

export const SearchResultSchema = z.object({
  projects: z.array(ProjectSchema),
  services: z.array(InfrastructureServiceSchema),
  agents: z.array(AgentSchema),
  mcps: z.array(McpSchema),
  skills: z.array(SkillSchema),
  automations: z.array(AutomationSchema),
  activities: z.array(ActivitySchema),
  roadmap: z.array(RoadmapItemSchema),
});

// === Availability =========================================================

export const AvailabilityCheckSchema = z.object({
  id: z.string(),
  checkedAt: z.string().datetime({ offset: true }),
  state: z.enum(["operational", "instability", "unavailable", "no_data"]),
});
export const AvailabilitySchema = z.record(z.string(), z.array(AvailabilityCheckSchema));

// === AI Infrastructure Observability =====================================

export const AiUsagePeriodSchema = z.enum(["today", "24h", "7d", "30d", "60d"]);

/**
 * `live`     — todos os campos vieram do 9Router.
 * `partial`  — parte dos dados é real; outra está ausente.
 * `periodic` — snapshot real coletado em intervalo.
 * `simulated`— dados de demonstração, sem origem no 9Router.
 *
 * Nunca inventar campo ausente: o normalizador deve virar o campo em
 * `null` (e o tipo Zod aceita `null`) ou em "Sem dados" na UI.
 */
const AiDataSourceSchema = z.enum(["live", "partial", "periodic", "simulated"]);

const AiProviderStatusSchema = z.enum([
  "operational",
  "attention",
  "near_limit",
  "exhausted",
  "authentication_error",
  "payment_required",
  "no_access",
  "unavailable",
  "unknown",
]);

const AiModelStatusSchema = z.enum(["operational", "attention", "unavailable", "unknown"]);

const AiQuotaStatusSchema = z.enum([
  "available",
  "attention",
  "near_limit",
  "exhausted",
  "authentication_error",
  "payment_required",
  "no_access",
  "unknown",
]);

const AiRequestStatusSchema = z.enum(["success", "running", "failed", "cancelled"]);

const AiIncidentStatusSchema = z.enum(["open", "acknowledged", "resolved", "ignored"]);

const AiIncidentSeveritySchema = z.enum(["info", "warning", "critical"]);

export const AiUsageSummarySchema = z.object({
  period: AiUsagePeriodSchema,
  generatedAt: z.string().datetime({ offset: true }),
  source: AiDataSourceSchema,

  totalRequests: z.number().int().nonnegative(),
  successfulRequests: z.number().int().nonnegative(),
  failedRequests: z.number().int().nonnegative(),

  inputTokens: z.number().int().nonnegative(),
  cachedInputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),

  cacheRatePct: z.number().min(0).max(100),
  errorRatePct: z.number().min(0).max(100),

  estimatedCostUsd: z.number().nonnegative().nullable(),
  averageLatencyMs: z.number().nonnegative().nullable(),
  medianLatencyMs: z.number().nonnegative().nullable(),

  activeProviders: z.number().int().nonnegative(),
  activeModels: z.number().int().nonnegative(),

  mostUsedProvider: z.string().optional(),
  mostUsedModel: z.string().optional(),
  lastRequestAt: z.string().datetime({ offset: true }).optional(),
});

export const AiModelUsageSchema = z.object({
  modelId: z.string().min(1),
  publicName: z.string().min(1),
  providerId: z.string().min(1),
  providerName: z.string().min(1),

  requests: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),

  estimatedCostUsd: z.number().nonnegative().nullable(),
  averageLatencyMs: z.number().nonnegative().nullable(),
  medianLatencyMs: z.number().nonnegative().nullable(),
  errorCount: z.number().int().nonnegative(),

  lastUsedAt: z.string().datetime({ offset: true }).nullable(),
  status: AiModelStatusSchema,
  source: AiDataSourceSchema,
});

export const AiProviderUsageSchema = z.object({
  providerId: z.string().min(1),
  publicName: z.string().min(1),
  status: AiProviderStatusSchema,
  activeModels: z.number().int().nonnegative(),

  requests: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),

  estimatedCostUsd: z.number().nonnegative().nullable(),
  averageLatencyMs: z.number().nonnegative().nullable(),
  errorCount: z.number().int().nonnegative(),

  lastUsedAt: z.string().datetime({ offset: true }).nullable(),
  authStatus: z.string(),
  quotaStatus: z.string(),
  source: AiDataSourceSchema,
});

export const AiProviderQuotaSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  quotaType: z.string().min(1),

  status: AiQuotaStatusSchema,
  usedPct: z.number().min(0).max(100).nullable(),
  remainingPct: z.number().min(0).max(100).nullable(),
  resetsAt: z.string().datetime({ offset: true }).nullable(),
  checkedAt: z.string().datetime({ offset: true }),
  message: z.string().optional(),
});

export const AiRequestRecordSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),

  providerId: z.string().min(1),
  providerName: z.string().min(1),
  modelId: z.string().min(1),
  modelName: z.string().min(1),

  clientName: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),

  inputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),

  durationMs: z.number().nonnegative().nullable(),
  estimatedCostUsd: z.number().nonnegative().nullable(),

  status: AiRequestStatusSchema,
  errorCategory: z.string().nullable().optional(),
  source: AiDataSourceSchema,
});

export const AiRequestPageSchema = z.object({
  items: z.array(AiRequestRecordSchema),
  nextCursor: z.number().int().nonnegative().nullable(),
});

export const AiIncidentSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  severity: AiIncidentSeveritySchema,
  status: AiIncidentStatusSchema,

  providerId: z.string().optional(),
  modelId: z.string().optional(),

  firstSeenAt: z.string().datetime({ offset: true }),
  lastSeenAt: z.string().datetime({ offset: true }),
  occurrences: z.number().int().nonnegative(),

  title: z.string().min(1),
  summary: z.string(),
  suggestedAction: z.string().optional(),
});

export const AiTopologyNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["tool", "router", "provider", "model"]),
  status: z.enum([
    "operational",
    "attention",
    "near_limit",
    "exhausted",
    "authentication_error",
    "payment_required",
    "no_access",
    "unavailable",
    "unknown",
  ]),
  lastUsedAt: z.string().datetime({ offset: true }).optional(),
  requestsCount: z.number().int().nonnegative().optional(),
  latencyMs: z.number().nonnegative().optional(),
  errorCount: z.number().int().nonnegative().optional(),
});

export const AiTopologyEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export const AiTopologySchema = z.object({
  nodes: z.array(AiTopologyNodeSchema),
  edges: z.array(AiTopologyEdgeSchema),
});

export const AiTimeseriesPointSchema = z.object({
  bucket: z.string(),
  value: z.number().nonnegative(),
});

export const AiTimeseriesSchema = z.object({
  metric: z.enum(["tokens", "cost", "requests", "latency", "errors", "cache"]),
  period: AiUsagePeriodSchema,
  points: z.array(AiTimeseriesPointSchema),
  source: AiDataSourceSchema,
});

export const AiIngestPayloadSchema = z.object({
  snapshot: AiUsageSummarySchema,
  modelUsage: z.array(AiModelUsageSchema),
  providerUsage: z.array(AiProviderUsageSchema),
  providerQuotas: z.array(AiProviderQuotaSchema),
  requestRecords: z.array(AiRequestRecordSchema),
  incidents: z.array(AiIncidentSchema),
  topology: AiTopologySchema,
  payloadVersion: z.string(),
  collectorVersion: z.string(),
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
  executions: ExecutionPageSchema,
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
  // Endpoints adicionais — Fase 19
  services: z.array(InfrastructureServiceSchema),
  agents: z.array(AgentSchema),
  mcps: z.array(McpSchema),
  skills: z.array(SkillSchema),
  automations: z.array(AutomationSchema),
  models: z.array(ModelInfoSchema),
  projects: z.array(ProjectSchema),
  roadmap: z.array(RoadmapItemSchema),
  alerts: z.array(AlertSchema),
  activities: ActivityPageSchema,
  search: SearchResultSchema,
  availability: AvailabilitySchema,
  // === AI Infrastructure Observability ===
  aiSummary: AiUsageSummarySchema,
  aiTimeseries: AiTimeseriesSchema,
  aiModels: z.array(AiModelUsageSchema),
  aiProviders: z.array(AiProviderUsageSchema),
  aiQuotas: z.array(AiProviderQuotaSchema),
  aiRequests: AiRequestPageSchema,
  aiIncidents: z.array(AiIncidentSchema),
  aiTopology: AiTopologySchema,
} as const;

export type NexusApiMethod = keyof typeof NEXUS_API_SCHEMAS;
