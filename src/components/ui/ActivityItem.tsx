import type { Activity } from "@/types";
import { formatDateTime } from "@/lib/format";
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

const KIND_LABEL: Record<Activity["kind"], string> = {
  service_started: "Serviço iniciado",
  service_stopped: "Serviço interrompido",
  agent_run: "Agente executado",
  automation_completed: "Automação concluída",
  project_updated: "Projeto atualizado",
  deploy: "Deploy realizado",
  error_detected: "Erro detectado",
  integration_added: "Integração adicionada",
  document_updated: "Documento atualizado",
};

const SEVERITY_TONE: Record<Activity["severity"], string> = {
  info: "text-text-dim",
  warning: "text-amber",
  critical: "text-red",
};

export function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = ICONS[activity.kind];
  return (
    <div className="nx-card nx-card-hover p-4">
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg p-2 bg-surface-hover", SEVERITY_TONE[activity.severity])}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint">
              {KIND_LABEL[activity.kind]}
            </span>
            <span className="text-[11px] font-mono text-text-faint">
              {formatDateTime(activity.occurredAt)}
            </span>
          </div>
          <h3 className="mt-0.5 text-sm text-text">{activity.title}</h3>
          <p className="mt-0.5 text-xs text-text-dim">{activity.description}</p>
          <div className="mt-2 text-[11px] text-text-faint">
            origem: <span className="font-mono">{activity.origin}</span>
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

// Marca explícita para deixar claro que o módulo exporta ActivityIcon por design.
// (não é warning — apenas para o motor de busca localizar o símbolo.)
export const __activityMarker = ActivityIcon;
