import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import type { ActivityScope } from "@/types";

const FILTERS: { key: ActivityScope | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "infrastructure", label: "Infraestrutura" },
  { key: "ai", label: "IA" },
  { key: "projects", label: "Projetos" },
  { key: "deploys", label: "Deploys" },
  { key: "alerts", label: "Alertas" },
];

const PAGE_SIZE = 20;

export function Activities() {
  const [scope, setScope] = useState<ActivityScope | "all">("all");
  const [cursor, setCursor] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["activities", PAGE_SIZE, cursor],
    queryFn: () => api.activities(PAGE_SIZE, cursor),
  });

  const items = (q.data?.items ?? []).filter((a) => scope === "all" || a.scope === scope);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Atividades</h1>
        <p className="mt-1 text-sm text-text-dim">
          Feed cronológico do ecossistema, com filtros por escopo.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setScope(f.key)}
            className={cn(
              "nx-pill border-border-strong text-xs",
              scope === f.key ? "text-accent border-accent/40 bg-accent-soft" : "text-text-dim",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="space-y-2">
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
        </div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="Nenhuma atividade encontrada" description="Ajuste o filtro para ver mais resultados." />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <ActivityItem key={a.id} activity={a} />
          ))}
        </div>
      )}

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
