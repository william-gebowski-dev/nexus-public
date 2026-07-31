import type { Execution } from "@/types";

export interface ExecutionFilterValue {
  status: string;
  agent: string;
  project: string;
}

export function ExecutionFilters({
  value,
  executions,
  onChange,
}: {
  value: ExecutionFilterValue;
  executions: Execution[];
  onChange: (next: ExecutionFilterValue) => void;
}) {
  const agents = Array.from(new Set(executions.map((e) => e.agent ?? e.runner))).sort();
  const projects = Array.from(new Set(executions.map((e) => e.project).filter(Boolean) as string[])).sort();
  const statuses = Array.from(new Set(executions.map((e) => e.status))).sort();

  return (
    <div className="grid gap-2 sm:grid-cols-3" aria-label="Filtros de execuções">
      <label className="text-xs text-text-dim">
        Estado
        <select className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          <option value="">Todos</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <label className="text-xs text-text-dim">
        Agente
        <select className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" value={value.agent} onChange={(e) => onChange({ ...value, agent: e.target.value })}>
          <option value="">Todos</option>
          {agents.map((agent) => <option key={agent} value={agent}>{agent}</option>)}
        </select>
      </label>
      <label className="text-xs text-text-dim">
        Projeto
        <select className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" value={value.project} onChange={(e) => onChange({ ...value, project: e.target.value })}>
          <option value="">Todos</option>
          {projects.map((project) => <option key={project} value={project}>{project}</option>)}
        </select>
      </label>
    </div>
  );
}

export function filterExecutions(executions: Execution[], filters: ExecutionFilterValue): Execution[] {
  return executions.filter((execution) => {
    const agent = execution.agent ?? execution.runner;
    return (
      (!filters.status || execution.status === filters.status) &&
      (!filters.agent || agent === filters.agent) &&
      (!filters.project || execution.project === filters.project)
    );
  });
}
