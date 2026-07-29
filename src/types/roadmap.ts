import type { DataSource } from "./service";
import type { Priority } from "./project";

export type RoadmapPhase = "now" | "next" | "future" | "done";

export interface RoadmapItem {
  id: string;
  title: string;
  /** Objetivo em uma frase. */
  objective: string;
  /** Projeto relacionado (slug), se aplicável. */
  projectSlug?: string;
  priority: Priority;
  /** Estado: 'pending' | 'in_progress' | 'blocked' | 'done'. */
  state: "pending" | "in_progress" | "blocked" | "done";
  /** Progresso 0..100. */
  progress: number;
  /** ISO 8601 (YYYY-MM-DD) ou null se sem data. */
  dueDate: string | null;
  /** Dependências (ids). */
  dependencies: string[];
  /** Critério de conclusão em uma frase. */
  doneCriteria: string;
  /** Fase do roadmap. */
  phase: RoadmapPhase;
  source: DataSource;
}
