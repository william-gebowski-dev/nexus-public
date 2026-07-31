import { cn } from "@/lib/cn";
import type { BlockExecutionState } from "@/types";

const STATE_COPY: Record<BlockExecutionState, { label: string; className: string }> = {
  scheduled:  { label: "Agendado",   className: "bg-surface border border-dashed border-border" },
  running:    { label: "Em execução", className: "bg-secondary animate-pulse" },
  completed:  { label: "Concluído",   className: "bg-green" },
  partial:    { label: "Parcial",     className: "bg-amber" },
  failed:     { label: "Falhou",      className: "bg-red" },
  cancelled:  { label: "Cancelado",   className: "bg-text-faint opacity-50" },
  skipped:    { label: "Ignorado",    className: "bg-text-faint opacity-50" },
  unknown:    { label: "Sem dados",   className: "bg-bg" },
};

export function StatusIconLegend({ className }: { className?: string } = {}) {
  return (
    <div className={cn("flex flex-wrap gap-3 text-[11px] text-text-dim", className)}>
      {(Object.entries(STATE_COPY) as Array<[BlockExecutionState, typeof STATE_COPY[BlockExecutionState]]>).map(([state, copy]) => (
        <span key={state} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", copy.className)} aria-hidden />
          <span>{copy.label}</span>
        </span>
      ))}
    </div>
  );
}