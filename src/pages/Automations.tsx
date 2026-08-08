import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AutomationCard } from "@/components/automations/AutomationCard";
import { REFRESH_MS } from "@/lib/queryClient";

export function Automations() {
  const q = useQuery({ queryKey: ["automations"], queryFn: api.automations, refetchInterval: REFRESH_MS });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        subtitle="Rotinas em execução, agendadas e observadas pelo Nexus Dashboard."
        actions={<DataFreshnessBadge iso={q.dataUpdatedAt ? new Date(q.dataUpdatedAt).toISOString() : null} />}
      />

      {q.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="Nenhuma automação ativa" description="As rotinas aparecerão aqui após a próxima sincronização." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((automation) => <AutomationCard key={automation.id} automation={automation} />)}
        </div>
      )}
    </div>
  );
}
