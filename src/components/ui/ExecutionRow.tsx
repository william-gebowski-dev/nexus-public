import type { Execution } from "@/types";
import { formatDateTime, formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<Execution["status"], string> = {
  success: "text-green bg-green-soft border-green/40",
  running: "text-accent bg-accent-soft border-accent/40",
  failed: "text-red bg-red-soft border-red/40",
  cancelled: "text-text-faint bg-surface-hover border-border-strong",
  queued: "text-geb bg-geb-soft border-geb/40",
};

const STATUS_LABEL: Record<Execution["status"], string> = {
  success: "Concluída",
  running: "Em execução",
  failed: "Com erro",
  cancelled: "Cancelada",
  queued: "Aguardando",
};

export function ExecutionRow({ execution }: { execution: Execution }) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
      <td className="py-3 pr-4">
        <div className="font-mono text-sm text-text">{execution.name}</div>
        <div className="mt-0.5 text-[11px] text-text-dim">{execution.summary}</div>
      </td>
      <td className="py-3 pr-4 text-xs font-mono text-text-dim">{execution.runner}</td>
      <td className="py-3 pr-4 text-xs text-text-dim">{formatDateTime(execution.startedAt)}</td>
      <td className="py-3 pr-4 text-xs font-mono text-text-dim">
        {formatDuration(execution.durationMs)}
      </td>
      <td className="py-3">
        <span className={cn("nx-pill text-[10px] py-0 border", STATUS_TONE[execution.status])}>
          {STATUS_LABEL[execution.status]}
        </span>
      </td>
    </tr>
  );
}
