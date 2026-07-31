import { useMemo, useState } from "react";
import { useRecentExecutions } from "@/hooks/useRecentExecutions";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExecutionsFilters } from "@/components/executions/ExecutionsFilters";
import { applyExecutionFilters, type ExecutionFilters } from "@/components/executions/filters";
import { ExecutionTable } from "@/components/executions/ExecutionTable";
import { ExecutionCardList } from "@/components/executions/ExecutionCardList";
import { PaginationBar } from "@/components/executions/PaginationBar";

const PAGE_SIZE = 25;

export function Executions() {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ExecutionFilters>({});
  const cursor = page === 0 ? null : page;     // mock aceita Number | null
  const recent = useRecentExecutions(PAGE_SIZE, cursor);

  const filtered = useMemo(() => {
    if (!recent.data) return [];
    return applyExecutionFilters(recent.data.items, filters);
  }, [recent.data, filters]);

  if (recent.isLoading) return <CardSkeleton />;
  if (recent.isError)
    return <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />;

  const total = recent.data?.items.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execuções"
        subtitle="Histórico operacional das 48 tarefas diárias do Hermes"
      />

      <ExecutionsFilters initial={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma execução encontrada"
          description="Tente ajustar os filtros acima ou aguarde a próxima janela de refresh (15 min)."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <ExecutionTable items={filtered} />
          </div>
          <div className="md:hidden">
            <ExecutionCardList items={filtered} />
          </div>
          <PaginationBar
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
