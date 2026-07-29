import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ExecutionRow } from "@/components/ui/ExecutionRow";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

const PAGE_SIZE = 20;

export function Executions() {
  const [cursor, setCursor] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ["executions", PAGE_SIZE, cursor],
    queryFn: () => api.executions(PAGE_SIZE, cursor),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Execuções</h1>
        <p className="mt-1 text-sm text-text-dim">
          Histórico paginado de execuções dos agentes e automações.
        </p>
      </header>

      <div className="nx-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="py-2 pr-4">Execução</th>
              <th className="py-2 pr-4">Runner</th>
              <th className="py-2 pr-4">Início</th>
              <th className="py-2 pr-4">Duração</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr>
                <td colSpan={5} className="py-6">
                  <LoadingSkeleton rows={3} />
                </td>
              </tr>
            ) : q.isError ? (
              <tr>
                <td colSpan={5} className="py-6">
                  <ErrorState onRetry={() => q.refetch()} />
                </td>
              </tr>
            ) : !q.data || q.data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6">
                  <EmptyState title="Nenhuma execução encontrada" />
                </td>
              </tr>
            ) : (
              q.data.items.map((e) => <ExecutionRow key={e.id} execution={e} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((curr) => (curr === null ? PAGE_SIZE : curr - PAGE_SIZE))}
          disabled={cursor === null}
          className="nx-btn disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Mais recentes
        </button>
        <button
          type="button"
          onClick={() => setCursor(() => q.data?.nextCursor ?? null)}
          disabled={!q.data?.nextCursor}
          className="nx-btn disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mais antigas →
        </button>
      </div>
    </div>
  );
}
