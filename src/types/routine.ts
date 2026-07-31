/**
 * Domínio da rotina operacional (12 blocos × 4 tarefas).
 *
 * Os 48 jobs (`job-30m-01..48`) são mapeados em 12 blocos × 4 tarefas,
 * com dependência sequencial interna (Coletar → Analisar → Produzir → Consolidar). Estados podem ser 8 valores; o status do `Execution` legado tem 5 valores e convive em paralelo.
 */

export type BlockExecutionState =
  | "scheduled" | "running" | "completed" | "partial"
  | "failed"   | "cancelled" | "skipped" | "unknown";

export type RoutineSlot = "coletar" | "analisar" | "produzir" | "consolidar";

export interface RoutineTask {
  id: string;
  jobName: string;
  blockId: number;
  slot: RoutineSlot;
  scheduledTime: string;
  title: string;
  description: string;
  status: BlockExecutionState;
  provider: string;
  model: string;
  delivery: string;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
  dependsOn: string[];
  projectId?: string;
  resultSummary?: string;
  artifactIds?: string[];
  /**
   * ID da execução correspondente em /executions. Preenchido pelo backend
   * ou pelo mock para que o card "Abrir logs" só apareça quando existir
   * de fato (antes caía em 404).
   */
  executionId?: string;
}

export interface RoutineBlock {
  id: number; name: string; windowStart: string; windowEnd: string;
  tasks: RoutineTask[]; status: BlockExecutionState; completedCount: number; failedCount: number;
}
export interface DailyActivity { id: string; text: string; at: string; state: "success" | "running" | "warning" | "error"; }
export interface RoutineDay { date: string; timezone: "America/Sao_Paulo"; totalBlocks: 12; totalJobs: 48; completedJobs: number; failedJobs: number; runningJobs: number; nextExecutionAt: string; blocks: RoutineBlock[]; artifacts: GeneratedArtifact[]; recentActivities: DailyActivity[]; }
export interface CronStatus { gatewayRunning: boolean; gatewayPid: number | null; activeJobs: number; totalJobs: 48; nextRunAt: string; heartbeatSecondsAgo: number; lastRunAt: string | null; lastFailureAt: string | null; provider: "custom"; model: "9Router"; delivery: "local"; tickerOk: boolean; }
export type ArtifactKind = "report" | "boletim" | "study-plan" | "pauta" | "content" | "roadmap" | "leads" | "project-update" | "note" | "daily-report";
export interface GeneratedArtifact { id: string; name: string; kind: ArtifactKind; sourceJobId: string; createdAt: string; projectId?: string; sizeBytes?: number; publicPath: string; }
export interface DailyReportSummary { date: string; scheduledJobs: number; completedJobs: number; failedJobs: number; completeBlocks: number; highlights: string[]; discoveries: string[]; incidents: string[]; pending: string[]; humanDecisions: string[]; }

export interface RoutineInfrastructureService {
  id: string;
  name: string;
  status: import("./service").ServiceStatus;
  latencyMs: number;
  availabilityPct: number;
  lastCheckedAt: string;
  sparkline24h: number[];
  uptime7d: boolean[];
  version: string;
}
export interface RoutineAvailabilityRecord {
  at: string;
  state: "operacional" | "instability";
}
