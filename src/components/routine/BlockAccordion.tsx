import { ChevronDown } from "lucide-react";
import type { RoutineBlock } from "@/types";
import { TaskStatusPill } from "@/components/shared/TaskStatusPill";
import { TaskRow } from "./TaskRow";

export function BlockAccordion({ block, defaultOpen }: { block: RoutineBlock; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="nx-card overflow-hidden group">
      <summary className="flex min-h-11 cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-hover list-none [&::-webkit-details-marker]:hidden" aria-label={`Bloco ${block.id} — ${block.name}`}>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-dim transition-transform group-open:rotate-180" aria-hidden />
        <div className="flex-1 min-w-0"><div className="flex items-baseline gap-2"><span className="font-mono text-sm text-text-faint">#{block.id}</span><span className="font-mono text-sm text-text">{block.name}</span></div><p className="text-[11px] text-text-dim font-mono mt-0.5">{block.windowStart}–{block.windowEnd}</p></div>
        <div className="shrink-0 text-xs text-text-dim font-mono">{block.completedCount} de {block.tasks.length} · {block.failedCount} erros</div>
        <TaskStatusPill status={block.status} />
      </summary>
      <div className="border-t border-border divide-y divide-border">{block.tasks.map((task) => <TaskRow key={task.id} task={task} />)}</div>
    </details>
  );
}
