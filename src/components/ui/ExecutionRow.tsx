import type { Execution } from "@/types";
import { formatDateTime, formatDuration } from "@/lib/format";
import { Pill } from "./Pill";
import { EXECUTION_STATUS } from "@/components/executions/ExecutionStatus";

export function ExecutionRow({ execution }: { execution: Execution }) {
  const status = EXECUTION_STATUS[execution.status];
  return (
    <tr className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-hover">
      <td className="py-3 pr-4">
        <div className="font-mono text-sm text-text">{execution.name}</div>
        <div className="mt-0.5 text-[11px] text-text-dim">{execution.summary}</div>
      </td>
      <td className="py-3 pr-4 text-xs font-mono text-text-dim">{execution.agent ?? execution.runner}</td>
      <td className="py-3 pr-4 text-xs text-text-dim">{execution.project ?? "—"}</td>
      <td className="py-3 pr-4 text-xs text-text-dim">{formatDateTime(execution.startedAt)}</td>
      <td className="py-3 pr-4 text-xs font-mono text-text-dim">{formatDuration(execution.durationMs)}</td>
      <td className="py-3 pr-4"><Pill tone={status.tone} size="xs">{status.label}</Pill></td>
      <td className="py-3 text-xs">
        <button type="button" className="text-link hover:underline">{execution.actionLabel ?? "Abrir"}</button>
      </td>
    </tr>
  );
}
