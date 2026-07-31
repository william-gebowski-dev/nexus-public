import { Link } from "react-router-dom";
import type { RoutineTask } from "@/types";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDuration } from "@/lib/format";

export function TaskDetails({ task }: { task: RoutineTask }) {
  const incompleteContext = task.dependsOn.length > 0 && task.status === "failed";

  return (
    <div className={cn("px-5 py-4 bg-bg/50 text-sm space-y-3", incompleteContext && "border-l-2 border-amber")}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Job" value={task.id} />
        <Field label="Horário" value={task.scheduledTime} />
        <Field label="Slot" value={task.slot} />
        <Field label="Status" value={task.status} />
        <Field label="Provider" value={task.provider} />
        <Field label="Modelo" value={task.model} />
        <Field label="Delivery" value={task.delivery} />
        {task.startedAt && <Field label="Início" value={formatDateTime(task.startedAt)} />}
        {task.finishedAt && <Field label="Fim" value={formatDateTime(task.finishedAt)} />}
        {task.durationSeconds !== undefined && <Field label="Duração" value={formatDuration(task.durationSeconds * 1000)} />}
      </div>
      {task.dependsOn.length > 0 && (
        <div>
          <p className="text-text-faint text-[10px] uppercase tracking-wider">Dependências</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {task.dependsOn.map((dependency) => (
              <Link key={dependency} to={`/executions/${dependency}`} className="font-mono text-[11px] text-link hover:underline border border-border rounded px-1.5 py-0.5">
                {dependency}
              </Link>
            ))}
          </div>
        </div>
      )}
      {incompleteContext && <div className="nx-card border-amber/40 bg-amber-soft px-3 py-2 text-xs text-amber">Executada com contexto incompleto.</div>}
      {task.resultSummary && (
        <div><p className="text-text-faint text-[10px] uppercase tracking-wider">Resultado</p><p className="mt-1 text-text-dim">{task.resultSummary}</p></div>
      )}
      {task.projectId && (
        <div><p className="text-text-faint text-[10px] uppercase tracking-wider">Projeto</p><p className="mt-1 text-text-dim font-mono text-xs">{task.projectId}</p></div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-text-faint text-[10px] uppercase tracking-wider">{label}</p><p className="mt-0.5 text-text font-mono text-xs">{value}</p></div>;
}
