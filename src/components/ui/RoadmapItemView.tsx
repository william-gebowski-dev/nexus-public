import type { RoadmapItem } from "@/types";
import { cn } from "@/lib/cn";

const STATE_LABEL: Record<RoadmapItem["state"], string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  blocked: "Bloqueado",
  done: "Concluído",
};

const STATE_TONE: Record<RoadmapItem["state"], string> = {
  pending: "text-text-dim border-border-strong bg-surface-hover",
  in_progress: "text-accent border-accent/40 bg-accent-soft",
  blocked: "text-red border-red/40 bg-red-soft",
  done: "text-green border-green/40 bg-green-soft",
};

const PRIORITY_TONE: Record<RoadmapItem["priority"], string> = {
  critical: "text-red",
  high: "text-amber",
  medium: "text-text-dim",
  low: "text-text-faint",
};

export function RoadmapItemView({ item }: { item: RoadmapItem }) {
  return (
    <div className="nx-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-sm text-text">{item.title}</h3>
        <span className={cn("nx-pill text-[10px] py-0 border", STATE_TONE[item.state])}>
          {STATE_LABEL[item.state]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-dim">{item.objective}</p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-text-faint">
        <span>
          {item.dueDate ? `Previsão: ${item.dueDate}` : "Sem data definida"}
        </span>
        <span className={cn("font-mono uppercase tracking-wider", PRIORITY_TONE[item.priority])}>
          {item.priority}
        </span>
      </div>

      {item.state !== "done" && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-text-faint">
            <span>Progresso</span>
            <span className="font-mono text-text">{item.progress}%</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {item.doneCriteria && (
        <p className="mt-3 text-[11px] text-text-faint italic">Critério: {item.doneCriteria}</p>
      )}
    </div>
  );
}
