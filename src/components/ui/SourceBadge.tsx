import type { DataSource } from "@/types";
import { Pill } from "./Pill";
import type { PillTone } from "@/lib/tones";
import { REFRESH_LABEL } from "@/lib/queryClient";
import { isMockDataEnabled } from "@/services/nexus-api";

const COPY: Record<DataSource, { label: string; tone: PillTone }> = {
  live: { label: "Ao vivo", tone: "green" },
  partial: { label: "Parcial", tone: "amber" },
  periodic: { label: `Atualizado a cada ${REFRESH_LABEL}`, tone: "accent" },
  manual: { label: "Manual", tone: "geb" },
  simulated: { label: "Simulado", tone: "amber" },
  unavailable: { label: "Sem dados", tone: "neutral" },
};

/**
 * Em modo mock, o badge sempre mostra "Simulado" — antes declarava
 * `source: "periodic"` em arquivos JSON estáticos e o badge traduzia
 * como "Atualizado a cada 15 min", o que era enganoso (audit E.6).
 */
export function SourceBadge({ source }: { source: DataSource }) {
  const effective: DataSource = isMockDataEnabled() ? "simulated" : source;
  const c = COPY[effective];
  return (
    <Pill tone={c.tone} size="xs" className="font-mono uppercase tracking-wider">
      {c.label}
    </Pill>
  );
}