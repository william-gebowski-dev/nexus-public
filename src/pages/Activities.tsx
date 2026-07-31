import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const cursorParam = Number(searchParams.get("cursor") ?? "0");
  const cursor = Number.isFinite(cursorParam) && cursorParam >= 0 ? cursorParam : 0;
  const [scope, setScope] = useState<ActivityScope | "all">("all");

  const q = useQuery({
    queryKey: ["activities", PAGE_SIZE, cursor, scope],
    queryFn: () => api.activities(PAGE_SIZE, cursor),
  });

  const items = (q.data?.items ?? []).filter((a) => scope === "all" || a.scope === scope);

  const setCursor = useCallback(
    (next: number) => {
      const safe = Math.max(0, next);
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (safe === 0) updated.delete("cursor");
          else updated.set("cursor", String(safe));
          return updated;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Reset cursor sempre que o scope mudar — caso contrário o usuário
  // pode estar paginando eventos de "Projetos" enquanto vê "Todas".
  useEffect(() => {
    setCursor(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const goNewer = () => setCursor((cursor === 0 ? PAGE_SIZE : cursor) - PAGE_SIZE);
  const goOlder = () => setCursor(cursor + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader title="Atividades" subtitle="Feed cronológico do ecossistema, com filtros por escopo." />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={scope === f.key}
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
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
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
          onClick={goNewer}
          disabled={cursor === 0}
          className="nx-btn disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Mais recentes
        </button>
        <button
          type="button"
          onClick={goOlder}
          disabled={!q.data?.nextCursor}
          className="nx-btn disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mais antigas →
        </button>
      </div>
    </div>
  );
}
