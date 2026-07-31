import { useState } from "react";
import { Filter, X } from "lucide-react";
import type { BlockExecutionState } from "@/types";
import type { ExecutionFilters } from "./filters";
import { cn } from "@/lib/cn";

const STATUS_OPTIONS: Array<{ value: BlockExecutionState; label: string }> = [
  { value: "scheduled", label: "Agendado" },
  { value: "running",   label: "Em execução" },
  { value: "completed", label: "Concluído" },
  { value: "partial",   label: "Parcial" },
  { value: "failed",    label: "Falhou" },
  { value: "cancelled", label: "Cancelado" },
  { value: "skipped",   label: "Ignorado" },
  { value: "unknown",   label: "Sem dados" },
];

export function ExecutionsFilters({
  initial,
  onChange,
}: {
  initial: ExecutionFilters;
  onChange: (next: ExecutionFilters) => void;
}) {
  const [filters, setFilters] = useState<ExecutionFilters>(initial);

  const update = <K extends keyof ExecutionFilters>(
    key: K,
    value: ExecutionFilters[K] | undefined,
  ) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const clear = () => {
    setFilters({});
    onChange({});
  };

  const hasFilter = Object.values(filters).some((v) => v && String(v).length > 0);

  return (
    <details open={hasFilter} className="nx-card overflow-hidden">
      <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 list-none [&::-webkit-details-marker]:hidden">
        <Filter className="h-4 w-4 text-text-dim" aria-hidden />
        <span className="font-mono text-sm">Filtros</span>
        {hasFilter && (
          <span className="ml-2 text-[10px] uppercase tracking-wider text-text-faint">
            {Object.values(filters).filter(Boolean).length} ativo(s)
          </span>
        )}
      </summary>
      <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 md:grid-cols-3">
        <Field label="Data">
          <input
            type="date"
            value={filters.date ?? ""}
            onChange={(e) => update("date", e.target.value || undefined)}
            className="nx-btn w-full text-xs"
          />
        </Field>
        <Field label="Estado">
          <select
            value={filters.status ?? ""}
            onChange={(e) => update("status", e.target.value || undefined)}
            className="nx-btn w-full text-xs"
          >
            <option value="">— qualquer —</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Bloco">
          <select
            value={filters.blockId ?? ""}
            onChange={(e) => update("blockId", e.target.value || undefined)}
            className="nx-btn w-full text-xs"
          >
            <option value="">— qualquer —</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{`#${n}`}</option>
            ))}
          </select>
        </Field>
        <Field label="Job (substring)">
          <input
            type="search"
            value={filters.job ?? ""}
            onChange={(e) => update("job", e.target.value || undefined)}
            placeholder="job-30m-..."
            className="nx-btn w-full text-xs"
          />
        </Field>
        <Field label="Projeto">
          <input
            type="search"
            value={filters.project ?? ""}
            onChange={(e) => update("project", e.target.value || undefined)}
            placeholder="Projeto..."
            className="nx-btn w-full text-xs"
          />
        </Field>
        <Field label="Agente">
          <input
            type="search"
            value={filters.agent ?? ""}
            onChange={(e) => update("agent", e.target.value || undefined)}
            placeholder="Agente..."
            className="nx-btn w-full text-xs"
          />
        </Field>
      </div>
      <div className="flex justify-end border-t border-border p-3">
        <button
          type="button"
          onClick={clear}
          disabled={!hasFilter}
          className={cn("nx-btn text-xs", !hasFilter && "opacity-50 cursor-not-allowed")}
        >
          <X className="h-3 w-3" aria-hidden />
          Limpar filtros
        </button>
      </div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-text-faint text-[10px] uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
