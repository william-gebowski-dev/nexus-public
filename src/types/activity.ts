import type { DataSource } from "./service";

export type ActivityKind =
  | "service_started"
  | "service_stopped"
  | "agent_run"
  | "automation_completed"
  | "project_updated"
  | "deploy"
  | "error_detected"
  | "integration_added"
  | "document_updated";

export type ActivitySeverity = "info" | "warning" | "critical";

export type ActivityScope = "infrastructure" | "ai" | "projects" | "deploys" | "alerts";

export interface Activity {
  id: string;
  kind: ActivityKind;
  /** Título curto. */
  title: string;
  /** Descrição curta sanitizada. */
  description: string;
  /** ISO 8601. */
  occurredAt: string;
  /** Origem (ex.: "agents", "scheduler", "monitor"). */
  origin: string;
  severity: ActivitySeverity;
  scope: ActivityScope;
  source: DataSource;
  /** Agente ou serviço responsável pela ação. */
  actor?: string;
  /** Ação objetiva realizada. */
  action?: string;
  /** Projeto relacionado, quando existir. */
  project?: string;
  /** Resultado humano e curto. */
  result?: string;
  /** Duração da atividade, quando medida. */
  durationMs?: number;
  /** Estado visual operacional. */
  state?: "success" | "running" | "warning" | "error";
}
