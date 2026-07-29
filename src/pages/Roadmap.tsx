import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RoadmapItemView } from "@/components/ui/RoadmapItemView";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import type { RoadmapItem, RoadmapPhase } from "@/types";

const PHASES: { key: RoadmapPhase; label: string }[] = [
  { key: "now", label: "Agora" },
  { key: "next", label: "Próximo" },
  { key: "future", label: "Futuro" },
  { key: "done", label: "Concluído" },
];

type View = "columns" | "timeline" | "quarter" | "list";

const VIEW_LABEL: Record<View, string> = {
  columns: "Etapas",
  timeline: "Linha do tempo",
  quarter: "Trimestres",
  list: "Lista",
};

/**
 * Agrupa itens por trimestre (AAAA-Q#) com base em `dueDate`.
 * Itens sem data vão para um bucket "Sem data definida" — nunca inventamos
 * uma data para preencher a UI.
 */
function bucketByQuarter(items: RoadmapItem[]): Array<{ key: string; label: string; items: RoadmapItem[] }> {
  const map = new Map<string, RoadmapItem[]>();
  const nodate: RoadmapItem[] = [];
  for (const it of items) {
    if (!it.dueDate) {
      nodate.push(it);
      continue;
    }
    const d = new Date(it.dueDate);
    if (Number.isNaN(d.getTime())) {
      nodate.push(it);
      continue;
    }
    const y = d.getUTCFullYear();
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    const key = `${y}-Q${q}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  const sortedKeys = Array.from(map.keys()).sort();
  const buckets = sortedKeys.map((k) => ({
    key: k,
    label: k.replace("-", " "),
    items: (map.get(k) ?? []).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
  }));
  if (nodate.length > 0) buckets.push({ key: "nodate", label: "Sem data definida", items: nodate });
  return buckets;
}

export function Roadmap() {
  const q = useQuery({ queryKey: ["roadmap"], queryFn: api.roadmap });
  const [view, setView] = useState<View>("columns");

  const grouped: Record<RoadmapPhase, RoadmapItem[]> = useMemo(() => {
    const acc: Record<RoadmapPhase, RoadmapItem[]> = {
      now: [],
      next: [],
      future: [],
      done: [],
    };
    (q.data ?? []).forEach((it) => acc[it.phase].push(it));
    return acc;
  }, [q.data]);

  const timeline = useMemo(() => {
    return (q.data ?? [])
      .filter((it) => it.dueDate !== null)
      .slice()
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  }, [q.data]);

  const noDate = useMemo(() => (q.data ?? []).filter((it) => it.dueDate === null), [q.data]);

  const quarters = useMemo(() => bucketByQuarter(q.data ?? []), [q.data]);

  const progress = useMemo(() => {
    const items = q.data ?? [];
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, it) => acc + it.progress, 0);
    return Math.round(sum / items.length);
  }, [q.data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Roadmap</h1>
          <p className="mt-1 text-sm text-text-dim">
            Planejamento visual por fases, do agora ao concluído.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle current={view} onChange={setView} />
        </div>
      </header>

      <div className="nx-card p-4">
        <div className="flex items-center justify-between text-[11px] text-text-faint">
          <span>Progresso global do roadmap</span>
          <span className="font-mono text-text">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : view === "columns" ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {PHASES.map((p) => {
            const items = grouped[p.key];
            return (
              <div key={p.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
                    {p.label}
                  </h2>
                  <span className="text-[11px] text-text-faint">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <EmptyState
                    title="Sem itens nesta fase"
                    description="Adicione um item ao roadmap para começar."
                  />
                ) : (
                  items.map((it) => <RoadmapItemView key={it.id} item={it} />)
                )}
              </div>
            );
          })}
        </div>
      ) : view === "timeline" ? (
        <TimelineView items={timeline} noDateItems={noDate} />
      ) : view === "quarter" ? (
        <QuarterView buckets={quarters} />
      ) : (
        <div className="space-y-4">
          {PHASES.map((p) => {
            const items = grouped[p.key];
            if (items.length === 0) return null;
            return (
              <div key={p.key} className="space-y-2">
                <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
                  {p.label}
                </h2>
                {items.map((it) => (
                  <RoadmapItemView key={it.id} item={it} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimelineView({ items, noDateItems }: { items: RoadmapItem[]; noDateItems: RoadmapItem[] }) {
  if (items.length === 0 && noDateItems.length === 0) {
    return <EmptyState title="Sem itens para mostrar" description="Adicione um item ao roadmap." />;
  }
  return (
    <div className="space-y-3">
      <ol className="relative space-y-3 border-l border-border-strong pl-4">
        {items.map((it) => (
          <li key={it.id} className="relative">
            <span className="absolute -left-[1.4rem] top-3 h-2 w-2 rounded-full bg-accent" aria-hidden />
            <div className="text-[10px] font-mono uppercase tracking-wider text-text-faint">
              {it.dueDate}
            </div>
            <RoadmapItemView item={it} />
          </li>
        ))}
      </ol>
      {noDateItems.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
            Sem data definida
          </h2>
          {noDateItems.map((it) => (
            <RoadmapItemView key={it.id} item={it} />
          ))}
        </section>
      )}
    </div>
  );
}

function QuarterView({ buckets }: { buckets: Array<{ key: string; label: string; items: RoadmapItem[] }> }) {
  if (buckets.length === 0) {
    return <EmptyState title="Sem itens para mostrar" description="Adicione um item ao roadmap." />;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {buckets.map((b) => (
        <div key={b.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">{b.label}</h2>
            <span className="text-[11px] text-text-faint">{b.items.length}</span>
          </div>
          {b.items.map((it) => (
            <RoadmapItemView key={it.id} item={it} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ViewToggle({ current, onChange }: { current: View; onChange: (v: View) => void }) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-border p-0.5 text-xs">
      {(["columns", "timeline", "quarter", "list"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono uppercase tracking-wider",
            current === v ? "bg-accent-soft text-accent" : "text-text-dim",
          )}
        >
          {VIEW_LABEL[v]}
        </button>
      ))}
    </div>
  );
}
