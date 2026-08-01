import type { DataSource } from "./service";

/**
 * Estado geral do ecossistema (decisão de copy do plano):
 *  - 'operational'  → Operacional
 *  - 'attention'    → Requer atenção
 *  - 'unstable'     → Instabilidade detectada
 *  - 'unavailable'  → Indisponível
 *  - 'no_recent_data' → Sem dados recentes
 */
export type OverallState =
  | "operational"
  | "attention"
  | "attention_required"
  | "maintenance"
  | "unstable"
  | "unavailable"
  | "no_recent_data";

export interface SystemSummary {
  overall: OverallState;
  /** ISO 8601 — geração. `null` quando sem fonte operacional. */
  generatedAt: string | null;
  counts: {
    servicesUp: number;
    servicesAttention: number;
    servicesDown: number;
    agentsActive: number;
    mcpsActive: number;
    skillsActive: number;
    automationsActive: number;
    projectsActive: number;
    executionsLast24h: number;
  };
  /** Próxima atualização automática prevista (ISO 8601) ou `null` se
   *  sem fonte operacional configurada. */
  nextRefreshAt: string | null;
  source: DataSource;
}
