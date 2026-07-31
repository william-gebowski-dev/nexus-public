import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import type { RoutineTask } from "@/types";
import { TaskStatusPill } from "@/components/shared/TaskStatusPill";
import { formatDuration } from "@/lib/format";
import { TaskDetails } from "./TaskDetails";

export function TaskRow({ task }: { task: RoutineTask }) {
  return (
    <details className="group/task">
      <summary className="flex min-h-11 cursor-pointer items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-hover list-none [&::-webkit-details-marker]:hidden" aria-label={`${task.id} ${task.scheduledTime} ${task.title}`}>
        <ChevronDown className="h-3 w-3 shrink-0 text-text-faint transition-transform group-open/task:rotate-180" aria-hidden />
        <span className="font-mono text-[11px] text-text-faint shrink-0">{task.scheduledTime}</span>
        <span className="font-mono text-xs text-text-dim shrink-0">{task.id}</span>
        <span className="truncate text-sm text-text min-w-0">{task.title}</span>
        <div className="ml-auto shrink-0 flex items-center gap-2">
          <TaskStatusPill status={task.status} />
          {task.durationSeconds !== undefined && <span className="font-mono text-[10px] text-text-faint">{formatDuration(task.durationSeconds * 1000)}</span>}
          <Link to={`/executions/${task.id}`} className="text-xs text-link hover:underline" onClick={(event) => event.stopPropagation()}>Abrir logs</Link>
        </div>
      </summary>
      <TaskDetails task={task} />
    </details>
  );
}
