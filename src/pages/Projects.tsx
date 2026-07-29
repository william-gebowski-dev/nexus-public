import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ProjectStatus, Priority } from "@/types";

const STATUS_OPTIONS: { key: ProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "planning", label: "Planejamento" },
  { key: "development", label: "Em desenvolvimento" },
  { key: "validation", label: "Em validação" },
  { key: "operational", label: "Operacional" },
  { key: "paused", label: "Pausado" },
  { key: "archived", label: "Arquivado" },
];

const PRIORITY_OPTIONS: { key: Priority | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "critical", label: "Crítica" },
  { key: "high", label: "Alta" },
  { key: "medium", label: "Média" },
  { key: "low", label: "Baixa" },
];

export function Projects() {
  const q = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const debouncedSearch = useDebounce(search, 200);

  const categories = useMemo(() => {
    const set = new Set((q.data ?? []).map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [q.data]);

  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    return (q.data ?? []).filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (priority !== "all" && p.priority !== priority) return false;
      if (category !== "all" && p.category !== category) return false;
      if (s && !p.name.toLowerCase().includes(s) && !p.description.toLowerCase().includes(s)) {
        return false;
      }
      return true;
    });
  }, [q.data, status, priority, category, debouncedSearch]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Projetos</h1>
        <p className="mt-1 text-sm text-text-dim">Projetos ativos do ecossistema, com prioridades e fases.</p>
      </header>

      <div className="nx-card flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
          <Search className="h-4 w-4 text-text-faint" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome…"
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
          />
        </div>
        <FilterRow label="Estado">
          {STATUS_OPTIONS.map((s) => (
            <Chip key={s.key} active={status === s.key} onClick={() => setStatus(s.key)}>
              {s.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Prioridade">
          {PRIORITY_OPTIONS.map((p) => (
            <Chip key={p.key} active={priority === p.key} onClick={() => setPriority(p.key)}>
              {p.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Categoria">
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c === "all" ? "Todas" : c}
            </Chip>
          ))}
        </FilterRow>
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
          title="Nenhum projeto encontrado"
          description="Ajuste os filtros para refinar a busca."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-text-faint">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "nx-pill border-border-strong text-xs",
        active ? "text-accent border-accent/40 bg-accent-soft" : "text-text-dim",
      )}
    >
      {children}
    </button>
  );
}
