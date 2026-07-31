import type { Execution } from "@/types";
import type { PillTone } from "@/lib/tones";

export const EXECUTION_STATUS: Record<Execution["status"], { label: string; tone: PillTone }> = {
  success: { label: "Sucesso", tone: "green" },
  running: { label: "Em execução", tone: "accent" },
  failed: { label: "Erro", tone: "red" },
  cancelled: { label: "Cancelada", tone: "neutral" },
  queued: { label: "Na fila", tone: "geb" },
};
