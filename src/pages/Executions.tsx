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
  // Pilha de cursors: cursorStack[i] é o cursor usado para a página i.
  // A página 0 sempre usa cursor=null. Avançar guarda o nextCursor
  // retornado pela API; voltar volta um nível na pilha.
  const [cursorStack, setCursorStack] = useState<Array<number | null>>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState<ExecutionFilters>({});

  const cursor = cursorStack[pageIndex] ?? null;
  const recent = useRecentExecutions(PAGE_SIZE, cursor);

  const filtered = useMemo(() => {
    if (!recent.data) return [];
    return applyExecutionFilters(recent.data.items, filters);
  }, [recent.data, filters]);

  if (recent.isLoading) return <CardSkeleton />;
  if (recent.isError)
    return <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />;

  // Total reportado pelo backend, ou fallback para o tamanho da página
  // (modo mock com totalItems explícito).
  const total = recent.data?.totalItems ?? recent.data?.items.length ?? 0;
  const nextCursor = recent.data?.nextCursor ?? null;
  const canGoNext = nextCursor !== null;

  const goNext = () => {
    if (nextCursor === null) return;
    const nextIdx = pageIndex + 1;
    setCursorStack((stack) => {
      const out = stack.slice(0, nextIdx);
      out[nextIdx] = nextCursor;
      return out;
    });
    setPageIndex(nextIdx);
  };
  const goPrev = () => {
    if (pageIndex === 0) return;
    setPageIndex((p) => p - 1);
  };

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
            page={pageIndex}
            pageSize={PAGE_SIZE}
            total={total}
            canPrev={pageIndex > 0}
            canNext={canGoNext}
            onPrev={goPrev}
            onNext={goNext}
          />
        </>
      )}
   </div>
  );
}
