import type { Execution } from "@/types";
import { formatDateTime, formatDuration } from "@/lib/format";
import { Pill } from "@/components/ui/Pill";
import { EXECUTION_STATUS } from "./ExecutionStatus";

export function ExecutionCard({ execution }: { execution: Execution }) {
  const status = EXECUTION_STATUS[execution.status];
  return (
    <article className="nx-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm text-text">{execution.name}</h3>
          <p className="mt-1 text-xs text-text-dim">{execution.summary}</p>
        </div>
        <Pill tone={status.tone} size="xs">{status.label}</Pill>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><dt className="text-text-faint">Agente</dt><dd className="font-mono text-text">{execution.agent ?? execution.runner}</dd></div>
        <div><dt className="text-text-faint">Projeto</dt><dd className="font-mono text-text">{execution.project ?? "—"}</dd></div>
        <div><dt className="text-text-faint">Início</dt><dd className="text-text-dim">{formatDateTime(execution.startedAt)}</dd></div>
        <div><dt className="text-text-faint">Duração</dt><dd className="font-mono text-text-dim">{formatDuration(execution.durationMs)}</dd></div>
      </dl>
      <button type="button" className="mt-4 text-xs font-medium text-link hover:underline">{execution.actionLabel ?? "Abrir detalhes"}</button>
    </article>
  );
}
