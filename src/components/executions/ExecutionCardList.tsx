import { Link } from "react-router-dom";
import type { Execution } from "@/types";
import { Pill } from "@/components/ui/Pill";
import { EXECUTION_STATUS } from "./ExecutionStatus";
import { formatRelative, formatDuration } from "@/lib/format";

export function ExecutionCardList({ items }: { items: readonly Execution[] }) {
  return (
    <ul className="space-y-3">
      {items.map((exec) => {
        const status = EXECUTION_STATUS[exec.status];
        return (
          <li key={exec.id} className="nx-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <Link
                to={`/executions/${exec.id}`}
                className="font-mono text-sm text-text hover:underline"
              >
                {exec.name}
              </Link>
              <Pill tone={status.tone} size="xs">
                {status.label}
              </Pill>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-text-dim">
              <span className="font-mono">{exec.runner}</span>
              {exec.project && <span>· {exec.project}</span>}
              <span>· {formatDuration(exec.durationMs)}</span>
              <span>· {formatRelative(exec.startedAt, Date.now())}</span>
            </div>
            <p className="text-xs text-text-dim line-clamp-2">{exec.summary}</p>
          </li>
        );
      })}
    </ul>
  );
}
