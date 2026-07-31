import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/Pill";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { REFRESH_MS } from "@/lib/queryClient";

export function Skills() {
  const q = useQuery({ queryKey: ["skills"], queryFn: api.skills, refetchInterval: REFRESH_MS });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        subtitle="Capacidades disponíveis para automações e agentes."
        actions={<DataFreshnessBadge iso={q.dataUpdatedAt ? new Date(q.dataUpdatedAt).toISOString() : null} />}
      />

      {q.isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="Nenhuma skill ativa" description="As skills aparecerão aqui quando forem sincronizadas." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((skill) => (
            <article key={skill.id} className="nx-card nx-card-hover flex min-h-32 flex-col justify-between p-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-mono text-base text-text">{skill.name}</h2>
                  <Pill tone={skill.active ? "green" : "neutral"} size="xs">{skill.active ? "Ativa" : "Inativa"}</Pill>
                </div>
                <p className="mt-2 text-xs leading-5 text-text-dim">{skill.purpose}</p>
              </div>
              <div className="mt-4"><SourceBadge source={skill.source} /></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
