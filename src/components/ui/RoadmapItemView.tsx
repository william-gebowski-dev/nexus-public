import type { RoadmapItem } from "@/types";
import { cn } from "@/lib/cn";
import { Pill } from "./Pill";
import { TEXT_TONES, type PillTone } from "@/lib/tones";

const STATE_LABEL: Record<RoadmapItem["state"], string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  blocked: "Bloqueado",
  done: "Concluído",
};

const STATE_TONE: Record<RoadmapItem["state"], PillTone> = {
  pending: "neutral",
  in_progress: "accent",
  blocked: "red",
  done: "green",
};

const PRIORITY_TONE: Record<RoadmapItem["priority"], PillTone> = {
  critical: "red",
  high: "amber",
  medium: "neutral",
  low: "neutral",
};

const PRIORITY_LABEL: Record<RoadmapItem["priority"], string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export function RoadmapItemView({ item }: { item: RoadmapItem }) {
  return (
    <div className="nx-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-sm text-text">{item.title}</h3>
        <Pill tone={STATE_TONE[item.state]} size="xs">{STATE_LABEL[item.state]}</Pill>
      </div>
      <p className="mt-1 text-xs text-text-dim">{item.objective}</p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-text-faint">
        <span>
          {item.dueDate ? `Previsão: ${item.dueDate}` : "Sem data definida"}
        </span>
        <span className={cn("font-mono uppercase tracking-wider", TEXT_TONES[PRIORITY_TONE[item.priority]])}>
          {PRIORITY_LABEL[item.priority]}
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