import { Pill } from "@/components/ui/Pill";
import type { BlockExecutionState } from "@/types";
import type { PillTone } from "@/lib/tones";

const TONE: Record<BlockExecutionState, PillTone> = {
  scheduled: "neutral",
  running: "accent",
  completed: "green",
  partial: "amber",
  failed: "red",
  cancelled: "neutral",
  skipped: "neutral",
  unknown: "neutral",
};

const LABEL: Record<BlockExecutionState, string> = {
  scheduled: "Agendado",
  running: "Em execução",
  completed: "Concluído",
  partial: "Parcial",
  failed: "Falhou",
  cancelled: "Cancelado",
  skipped: "Ignorado",
  unknown: "Sem dados",
};

export function TaskStatusPill({ status }: { status: BlockExecutionState }) {
  return <Pill tone={TONE[status]} aria-label={`Status: ${LABEL[status]}`}>{LABEL[status]}</Pill>;
}
