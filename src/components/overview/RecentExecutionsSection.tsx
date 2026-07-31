import { Link } from "react-router-dom";
import { useRecentExecutions } from "@/hooks/useRecentExecutions";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EXECUTION_STATUS } from "@/components/executions/ExecutionStatus";
import { formatRelative, formatDuration } from "@/lib/format";
import { MAX_RECENT_EXECUTIONS_DISPLAY } from "./constants";

const MAX = MAX_RECENT_EXECUTIONS_DISPLAY;

export function RecentExecutionsSection() {
  const recent = useRecentExecutions(MAX);
  const items = recent.data?.items ?? [];

  if (recent.isLoading) return <CardSkeleton />;
  if (recent.isError)
    return <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />;
  if (items.length === 0)
    return (
      <EmptyState
        title="Nenhuma execução encontrada"
        description={`As ${MAX} execuções mais recentes aparecerão aqui.`}
      />
    );

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="font-mono text-lg font-semibold">Execuções recentes</h2>
        <Link to="/executions" className="text-xs text-link hover:underline">
          Ver todas as execuções
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="py-3 pl-4 pr-4">Início</th>
              <th className="py-3 pr-4">Job</th>
              <th className="py-3 pr-4">Tarefa</th>
              <th className="py-3 pr-4">Duração</th>
              <th className="py-3 pr-4">Estado</th>
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
                    <Link to={`/executions/${exec.id}`} className="text-sm text-text hover:underline">
                      {exec.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-text-dim line-clamp-1">{exec.summary}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs font-mono text-text-dim">
                    {formatDuration(exec.durationMs)}
                  </td>
                  <td className="py-3 pr-4">
                    <Pill tone={status.tone} size="xs">
                      {status.label}
                    </Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}