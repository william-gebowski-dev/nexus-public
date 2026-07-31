import type { DataSource } from "./service";

export type ProjectStatus =
  | "planning"
  | "development"
  | "validation"
  | "operational"
  | "paused"
  | "archived";

export type Priority = "critical" | "high" | "medium" | "low";

export interface Project {
  id: string;
  name: string;
  /** Descrição curta (≤140 chars), sanitizada. */
  description: string;
  /** Categoria livre (ex.: "IA", "Infra", "Conteúdo"). */
  category: string;
  status: ProjectStatus;
  priority: Priority;
  /** Progresso 0..100. */
  progress: number;
  /** Fase atual em texto curto. */
  currentPhase: string;
  /** Próxima ação. */
  nextAction: string;
  /** ISO 8601 — última atualização. */
  updatedAt: string;
  /** Tags de tecnologia (ex.: ["React", "Postgres"]). */
  tech: string[];
  /** Link público, se houver. */
  publicUrl?: string;
  source: DataSource;
}
