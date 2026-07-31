import type { DataSource } from "./service";

export type ExecutionStatus =
  | "success"
  | "running"
  | "failed"
  | "cancelled"
  | "queued"
  | "partial";

export interface Execution {
  id: string;
  /** Nome da execução. */
  name: string;
  /** Agente/automação responsável. */
  runner: string;
  /** ID estruturado do job (ex.: "job-30m-12"). */
  jobId?: string;
  /** Bloco 1..12 ao qual a execução pertence. */
  blockId?: number;
  /** Horário agendado (HH:mm) na rotina 12×4. */
  scheduledTime?: string;
  /** Nome público do agente responsável. */
  agent?: string;
  /** Projeto relacionado. */
  project?: string;
  /** Identificador público do projeto relacionado. */
  projectId?: string;
  /** Ação da coluna operacional. */
  actionLabel?: string;
  /** ISO 8601 — início. */
  startedAt: string;
  /** Duração (ms). */
  durationMs: number;
  status: ExecutionStatus;
  /** Resultado resumido (sanitizado). */
  summary: string;
  source: DataSource;
}
