import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AgentCard } from "@/components/ui/AgentCard";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { REFRESH_MS } from "@/lib/queryClient";

export function Agents() {
  const q = useQuery({ queryKey: ["agents"], queryFn: api.agents, refetchInterval: REFRESH_MS });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agentes"
        subtitle="Agentes ativos e responsabilidades operacionais do ecossistema."
        actions={<DataFreshnessBadge iso={q.dataUpdatedAt ? new Date(q.dataUpdatedAt).toISOString() : null} />}
      />

      {q.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="Nenhum agente ativo" description="Os agentes aparecerão aqui após a próxima sincronização." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      )}
    </div>
  );
}
