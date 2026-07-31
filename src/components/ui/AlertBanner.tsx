import type { Alert } from "@/types";
import { cn } from "@/lib/cn";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { PILL_TONES, TEXT_TONES, type PillTone } from "@/lib/tones";

const SEVERITY_TONE_KEY: Record<Alert["severity"], PillTone> = {
  info: "neutral",
  warning: "amber",
  critical: "red",
};

const SEVERITY_ICON: Record<Alert["severity"], typeof AlertTriangle> = {
  info: Info,
  warning: AlertCircle,
  critical: AlertTriangle,
};

const SEVERITY_LABEL: Record<Alert["severity"], string> = {
  info: "Informação",
  warning: "Atenção",
  critical: "Crítico",
};

export function AlertBanner({ alert }: { alert: Alert }) {
  const tone = SEVERITY_TONE_KEY[alert.severity];
  const Icon = SEVERITY_ICON[alert.severity];
  return (
    <div className={cn("nx-card flex items-start gap-3 border p-4", PILL_TONES[tone])}>
      <Icon className={cn("h-5 w-5 shrink-0", TEXT_TONES[tone])} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("font-mono text-[10px] uppercase tracking-wider", TEXT_TONES[tone])}>
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
