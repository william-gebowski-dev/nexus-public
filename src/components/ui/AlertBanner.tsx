import type { Alert } from "@/types";
import { cn } from "@/lib/cn";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { formatRelative } from "@/lib/format";

const SEVERITY_TONE: Record<Alert["severity"], { tone: string; bg: string; icon: typeof AlertTriangle }> = {
  info: { tone: "text-text-dim", bg: "bg-surface-hover border-border-strong", icon: Info },
  warning: { tone: "text-amber", bg: "bg-amber-soft border-amber/40", icon: AlertCircle },
  critical: { tone: "text-red", bg: "bg-red-soft border-red/40", icon: AlertTriangle },
};

const SEVERITY_LABEL: Record<Alert["severity"], string> = {
  info: "Informação",
  warning: "Atenção",
  critical: "Crítico",
};

export function AlertBanner({ alert }: { alert: Alert }) {
  const sev = SEVERITY_TONE[alert.severity];
  const Icon = sev.icon;
  return (
    <div className={cn("nx-card flex items-start gap-3 border p-4", sev.bg)}>
      <Icon className={cn("h-5 w-5 shrink-0", sev.tone)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("font-mono text-[10px] uppercase tracking-wider", sev.tone)}>
            {SEVERITY_LABEL[alert.severity]}
          </span>
          <span className="text-[11px] text-text-faint">
            {formatRelative(alert.raisedAt)}
          </span>
        </div>
        <h3 className="mt-0.5 text-sm text-text">{alert.title}</h3>
        <p className="mt-0.5 text-xs text-text-dim">{alert.description}</p>
      </div>
    </div>
  );
}
