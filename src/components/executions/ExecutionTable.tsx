import { Link } from "react-router-dom";
import type { Execution } from "@/types";
import { Pill } from "@/components/ui/Pill";
import { EXECUTION_STATUS } from "./ExecutionStatus";
import { formatRelative, formatDuration } from "@/lib/format";

export function ExecutionTable({ items }: { items: readonly Execution[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
            <th className="py-3 pl-4 pr-4">Início</th>
            <th className="py-3 pr-4">Job</th>
            <th className="py-3 pr-4">Tarefa</th>
            <th className="py-3 pr-4">Projeto</th>
            <th className="py-3 pr-4">Duração</th>
            <th className="py-3 pr-4">Estado</th>
            <th className="py-3 pr-4">Ação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((exec) => {
            const status = EXECUTION_STATUS[exec.status];
            return (
              <tr
                key={exec.id}
                className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors"
              >
                <td className="py-3 pl-4 pr-4 text-xs text-text-dim font-mono">
                  {formatRelative(exec.startedAt, Date.now())}
                </td>
                <td className="py-3 pr-4 text-xs font-mono text-text-dim">{exec.runner}</td>
                <td className="py-3 pr-4">
                  <Link
                    to={`/executions/${exec.id}`}
                    className="text-sm text-text hover:underline"
                  >
                    {exec.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-text-dim line-clamp-1">{exec.summary}</p>
                </td>
                <td className="py-3 pr-4 text-xs text-text-dim">{exec.project ?? "—"}</td>
                <td className="py-3 pr-4 text-xs font-mono text-text-dim">
                  {formatDuration(exec.durationMs)}
                </td>
                <td className="py-3 pr-4">
                  <Pill tone={status.tone} size="xs">
                    {status.label}
                  </Pill>
                </td>
                <td className="py-3 pr-4 text-xs">
                  <Link to={`/executions/${exec.id}`} className="text-link hover:underline">
                    Abrir
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
