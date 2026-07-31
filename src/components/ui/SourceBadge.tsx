import type { DataSource } from "@/types";
import { Pill } from "./Pill";
import type { PillTone } from "@/lib/tones";
import { REFRESH_LABEL } from "@/lib/queryClient";

const COPY: Record<DataSource, { label: string; tone: PillTone }> = {
  live: { label: "Ao vivo", tone: "green" },
  periodic: { label: `Atualizado a cada ${REFRESH_LABEL}`, tone: "accent" },
  manual: { label: "Manual", tone: "geb" },
  simulated: { label: "Simulado", tone: "amber" },
};

export function SourceBadge({ source }: { source: DataSource }) {
  const c = COPY[source];
  return (
    <Pill tone={c.tone} size="xs" className="font-mono uppercase tracking-wider">
      {c.label}
    </Pill>
  );
}