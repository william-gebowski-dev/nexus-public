import { cn } from "@/lib/cn";
import type { BlockExecutionState, RoutineBlock } from "@/types";

const STATUS_BG: Record<BlockExecutionState, string> = {
  completed: "bg-green",
  running: "bg-secondary animate-pulse",
  partial: "bg-amber",
  failed: "bg-red",
  scheduled: "bg-bg border border-dashed border-border",
  unknown: "bg-bg border border-dashed border-border",
  cancelled: "bg-text-faint opacity-50",
  skipped: "bg-text-faint opacity-50",
};

const STATUS_LABEL: Record<BlockExecutionState, string> = {
  completed: "Concluída",
  running: "Em execução",
  partial: "Parcial",
  failed: "Falhou",
  scheduled: "Agendada",
  unknown: "Desconhecida",
  cancelled: "Cancelada",
  skipped: "Pulada",
};

export function BlockLane({ block }: { block: RoutineBlock }) {
  const shortName = block.name.length > 24 ? `${block.name.slice(0, 24)}…` : block.name;

  return (
    <div className="nx-card nx-timeline-lane min-w-32 w-full p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
        {block.id} · {block.windowStart}–{block.windowEnd}
      </div>
      <div className="mt-1 truncate font-mono text-xs text-text" title={block.name}>
        {shortName}
      </div>

      <ul className="mt-3 space-y-2" aria-label={`Tarefas do bloco ${block.id}`}>
        {block.tasks.map((task) => (
          <li key={task.id}>
            <span
              className={cn("block h-2 w-full rounded-full", STATUS_BG[task.status])}
              title={`${task.scheduledTime} · ${task.title}`}
              aria-label={`${task.title} – ${STATUS_LABEL[task.status]}`}
            />
            <div className="mt-0.5 font-mono text-[10px] text-text-faint">
              {task.scheduledTime} · {task.slot}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-border pt-2 text-[10px] text-text-dim">
        {block.completedCount} de {block.tasks.length} concluídas · {block.failedCount} erros
      </div>
    </div>
  );
}