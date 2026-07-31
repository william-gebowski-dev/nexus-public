import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { REFRESH_MS } from "@/lib/queryClient";
import { formatRelative } from "@/lib/format";

export function Mcps() {
  const q = useQuery({ queryKey: ["mcps"], queryFn: api.mcps, refetchInterval: REFRESH_MS });

  return (
    <div className="space-y-6">
      <PageHeader
        title="MCPs"
        subtitle="Conectores disponíveis para agentes, busca e integrações autorizadas."
        actions={<DataFreshnessBadge iso={q.dataUpdatedAt ? new Date(q.dataUpdatedAt).toISOString() : null} />}
      />

      {q.isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="Nenhum MCP conectado" description="Conectores aparecerão aqui quando estiverem disponíveis." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((mcp) => (
            <article key={mcp.id} className="nx-card nx-card-hover p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-mono text-base text-text">{mcp.name}</h2>
                  <p className="mt-1 text-xs text-text-dim">{mcp.category}</p>
                </div>
                <SourceBadge source={mcp.source} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <StatusPill kind="mcp" status={mcp.status} />
                <span className="font-mono text-text-faint">{formatRelative(mcp.lastActivityAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
