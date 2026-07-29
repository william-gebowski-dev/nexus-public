import { cn } from "@/lib/cn";
import type { DataSource } from "@/types";

const COPY: Record<DataSource, { label: string; tone: string }> = {
  live: { label: "Ao vivo", tone: "text-green border-green/40" },
  periodic: { label: "Atualizado a cada 15 min", tone: "text-accent border-accent/40" },
  manual: { label: "Manual", tone: "text-geb border-geb/40" },
  simulated: { label: "Simulado", tone: "text-amber border-amber/40" },
};

export function SourceBadge({ source }: { source: DataSource }) {
  const c = COPY[source];
  return (
    <span
      className={cn(
        "nx-pill font-mono text-[10px] uppercase tracking-wider",
        c.tone,
      )}
    >
      {c.label}
    </span>
  );
}
