import type { DataSource, Service, ServiceStatus } from "./service";
import type { Activity } from "./activity";
import type { Execution } from "./execution";

export type NexusSystemState = "operational" | "attention_required" | "unavailable" | "maintenance";

export type AvailabilityState = "operational" | "instability" | "unavailable" | "no_data";

export type AutomationStatus = "running" | "paused" | "failed" | "scheduled";

export interface AvailabilityRecord {
  id: string;
  checkedAt: string;
  state: AvailabilityState;
}

export interface TechnicalSummary {
  activeMcps: number;
  activeSkills: number;
  activeAgents: number;
  runningAutomations: number;
  activeContainers: number;
  lastSyncAt: string | null;
  lastBackupAt: string | null;
  lastFailureAt: string | null;
}

export interface NexusSystemStatus {
  status: NexusSystemState;
  overall?: NexusSystemState;
  message: string;
  // Nullable quando NEXUS_STATUS_ENDPOINT ausente ou upstream falhou
  // (antes do hardening, 503 devolvia string nula e o schema quebrava).
  generatedAt: string | null;
  lastUpdate: string | null;
  uptimeSeconds: number | null;
  cpuUsage: number | null;
  memoryUsage: number | null;
  diskUsage: number | null;
  counts: {
    servicesOperational: number;
    servicesAttention: number;
    servicesUnavailable: number;
    agentsActive: number;
    mcpsActive: number;
    skillsActive: number;
    automationsActive: number;
    projectsActive: number;
    executionsLast24h: number;
  };
  technicalSummary: TechnicalSummary;
  source: DataSource;
}

export interface InfrastructureService extends Service {
  publicLabel?: string;
  version?: string;
  usageLabel?: string;
  availability24hPct?: number;
  availability7dPct?: number;
  lastFailureAt?: string | null;
  detailsHref?: string;
  availabilityChecks?: AvailabilityRecord[];
}

export interface Automation {
  id: string;
  name: string;
  purpose: string;
  status: AutomationStatus;
  project?: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  successRatePct: number;
  source: DataSource;
}

export interface ActivityEvent extends Activity {
  actor?: string;
  action?: string;
  project?: string;
  result?: string;
  durationMs?: number;
  state?: "success" | "running" | "warning" | "error";
}

export interface ExecutionRecord extends Execution {
  agent?: string;
  project?: string;
  projectId?: string;
  actionLabel?: string;
}

export const SYSTEM_STATE_LABEL: Record<NexusSystemState, string> = {
  operational: "Operacional",
  attention_required: "Atenção necessária",
  unavailable: "Indisponível",
  maintenance: "Em manutenção",
};

export const SERVICE_STATUS_TO_SYSTEM_STATE: Record<ServiceStatus, NexusSystemState> = {
  healthy: "operational",
  attention: "attention_required",
  down: "unavailable",
};
