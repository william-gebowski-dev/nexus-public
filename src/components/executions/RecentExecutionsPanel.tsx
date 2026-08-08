import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Execution } from "@/types";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ExecutionRow } from "@/components/ui/ExecutionRow";
import { ExecutionCard } from "./ExecutionCard";
import { ExecutionFilters, filterExecutions, type ExecutionFilterValue } from "./ExecutionFilters";

const EMPTY_FILTERS: ExecutionFilterValue = { status: "", agent: "", project: "" };

export function RecentExecutionsPanel({
  executions,
  isLoading,
  error,
  onRetry,
}: {
  executions?: Execution[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  const [filters, setFilters] = useState<ExecutionFilterValue>(EMPTY_FILTERS);
  const limited = useMemo(() => (executions ?? []).slice(0, 10), [executions]);
  const filtered = useMemo(() => filterExecutions(limited, filters), [limited, filters]);

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!limited.length) return <EmptyState title="Nenhuma execução encontrada" description="As 10 execuções mais recentes aparecerão aqui." />;

  return (
    <div className="space-y-4">
      <ExecutionFilters value={filters} executions={limited} onChange={setFilters} />

      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface md:block">
        <table className="w-full text-left">
          <caption className="sr-only">10 execuções mais recentes do Nexus Dashboard</caption>
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="py-3 pl-4 pr-4">Execução</th>
              <th className="py-3 pr-4">Agente</th>
              <th className="py-3 pr-4">Projeto</th>
              <th className="py-3 pr-4">Início</th>
              <th className="py-3 pr-4">Duração</th>
              <th className="py-3 pr-4">Estado</th>
              <th className="py-3 pr-4">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((execution) => <ExecutionRow key={execution.id} execution={execution} />)}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {filtered.map((execution) => <ExecutionCard key={execution.id} execution={execution} />)}
      </div>

      {filtered.length === 0 && <EmptyState title="Nenhuma execução nesse filtro" />}

      <Link to="/execucoes" className="nx-btn w-full sm:w-auto">
        Ver todas as execuções
      </Link>
    </div>
  );
}
