import type { Activity } from "@/types";
import { formatDateTime, formatDuration } from "@/lib/format";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  FileEdit,
  GitBranch,
  PlayCircle,
  Plug,
  Server,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Pill } from "./Pill";
import type { PillTone } from "@/lib/tones";

const ICONS: Record<Activity["kind"], typeof ActivityIcon> = {
  service_started: Server,
  service_stopped: CircleSlash,
  agent_run: PlayCircle,
  automation_completed: CheckCircle2,
  project_updated: FileEdit,
  deploy: GitBranch,
  error_detected: AlertTriangle,
  integration_added: Plug,
  document_updated: FileEdit,
};

const STATE: Record<NonNullable<Activity["state"]>, { label: string; tone: PillTone; icon: string }> = {
  success: { label: "Sucesso", tone: "green", icon: "●" },
  running: { label: "Em execução", tone: "accent", icon: "●" },
  warning: { label: "Aviso", tone: "amber", icon: "●" },
  error: { label: "Erro", tone: "red", icon: "●" },
};

const SEVERITY_TONE: Record<Activity["severity"], string> = {
  info: "text-secondary bg-secondary-soft",
  warning: "text-amber bg-amber-soft",
  critical: "text-red bg-red-soft",
};

export function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = ICONS[activity.kind];
  const visualState = STATE[activity.state ?? (activity.severity === "critical" ? "error" : activity.severity === "warning" ? "warning" : "success")];
  const actor = activity.actor ?? activity.origin;
  const action = activity.action ?? activity.title;

  return (
    <div className="nx-card nx-card-hover p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className={cn("rounded-xl p-2", SEVERITY_TONE[activity.severity])}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 text-sm text-text">
              <span className="font-mono font-medium">{actor}</span>{" "}
              <span className="text-text-dim">{action}</span>
            </div>
            <Pill tone={visualState.tone} size="xs" aria-label={`Resultado: ${visualState.label}`}>
              <span aria-hidden>{visualState.icon}</span> {visualState.label}
            </Pill>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-faint">
            {activity.project && <span>Projeto: <span className="font-mono text-text-dim">{activity.project}</span></span>}
            {activity.result && <span>Resultado: <span className="text-text-dim">{activity.result}</span></span>}
            {activity.durationMs !== undefined && <span>Duração: <span className="font-mono text-text-dim">{formatDuration(activity.durationMs)}</span></span>}
            <span>{formatDateTime(activity.occurredAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityIconInline({ activity }: { activity: Activity }) {
  const Icon = ICONS[activity.kind];
  return <Icon className="h-4 w-4" aria-hidden />;
}

export const ActivityIcons = ICONS;
export const __activityMarker = ActivityIcon;
