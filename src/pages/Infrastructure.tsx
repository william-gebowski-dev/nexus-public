import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import type { Service } from "@/types";
import { cn } from "@/lib/cn";

const CATEGORIES: { key: Service["category"] | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "database", label: "Bancos" },
  { key: "api", label: "APIs" },
  { key: "automation", label: "Automação" },
  { key: "ai", label: "IA" },
  { key: "bot", label: "Bots" },
  { key: "docker", label: "Docker" },
  { key: "tailscale", label: "Tailscale" },
  { key: "web", label: "Web" },
  { key: "vps", label: "VPS" },
];

export function Infrastructure() {
  const q = useQuery({ queryKey: ["services"], queryFn: api.services });
  const [cat, setCat] = useState<Service["category"] | "all">("all");

  const filtered = useMemo(
    () => (q.data ?? []).filter((s) => cat === "all" || s.category === cat),
    [q.data, cat],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Infraestrutura</h1>
          <p className="mt-1 text-sm text-text-dim">
            Estado dos serviços monitorados do ecossistema.
          </p>
        </div>
        <DataFreshnessBadge iso={q.dataUpdatedAt ? new Date(q.dataUpdatedAt).toISOString() : null} />
      </header>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            className={cn(
              "nx-pill border-border-strong text-xs",
              cat === c.key ? "text-accent border-accent/40 bg-accent-soft" : "text-text-dim",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum serviço nesta categoria"
          description="Selecione outra categoria ou aguarde nova sincronização."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
