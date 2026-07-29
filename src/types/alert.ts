import type { ActivitySeverity } from "./activity";
import type { DataSource } from "./service";

export type AlertCategory =
  | "service_down"
  | "data_stale"
  | "automation_error"
  | "agent_idle"
  | "deploy_failed"
  | "limit_near"
  | "integration_offline";

export interface Alert {
  id: string;
  category: AlertCategory;
  /** Severidade. */
  severity: ActivitySeverity;
  title: string;
  /** Descrição curta, sanitizada. */
  description: string;
  /** ISO 8601. */
  raisedAt: string;
  /** Se está marcado como lido. */
  read: boolean;
  /** Se foi ignorado. */
  ignored: boolean;
  source: DataSource;
}
