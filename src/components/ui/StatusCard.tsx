import type { ReactNode } from "react";
import type { OverallState } from "@/types";
import { cn } from "@/lib/cn";

const STATE_COPY: Record<OverallState, { label: string; tone: "green" | "amber" | "red" | "geb" }> = {
  operational: { label: "Operacional", tone: "green" },
  attention: { label: "Requer atenção", tone: "amber" },
  unstable: { label: "Instabilidade detectada", tone: "amber" },
  unavailable: { label: "Indisponível", tone: "red" },
  no_recent_data: { label: "Sem dados recentes", tone: "geb" },
};

const TONE_STYLES: Record<"green" | "amber" | "red" | "geb", { dot: string; text: string; bg: string }> = {
  green: { dot: "bg-green", text: "text-green", bg: "bg-green-soft" },
  amber: { dot: "bg-amber", text: "text-amber", bg: "bg-amber-soft" },
  red: { dot: "bg-red", text: "text-red", bg: "bg-red-soft" },
  geb: { dot: "bg-geb", text: "text-geb", bg: "bg-geb-soft" },
};

export function StatusCard({
  state,
  description,
  right,
}: {
  state: OverallState;
  description?: string;
  right?: ReactNode;
}) {
  const copy = STATE_COPY[state];
  const tone = TONE_STYLES[copy.tone];
  return (
    <div className="nx-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-faint">Estado geral</div>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", tone.dot)} aria-hidden />
            <h2 className={cn("text-2xl font-semibold font-mono", tone.text)}>{copy.label}</h2>
          </div>
          {description && (
            <p className="mt-2 text-sm text-text-dim max-w-prose">{description}</p>
          )}
        </div>
        {right && <div className={cn("rounded-lg px-3 py-2", tone.bg)}>{right}</div>}
      </div>
    </div>
  );
}
