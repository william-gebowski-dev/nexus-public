import type { DataSource } from "./service";

export type ExecutionStatus =
  | "success"
  | "running"
  | "failed"
  | "cancelled"
  | "queued";

export interface Execution {
  id: string;
  /** Nome da execução. */
  name: string;
  /** Agente/automação responsável. */
  runner: string;
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
