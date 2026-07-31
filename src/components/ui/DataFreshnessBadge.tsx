import { useDataFreshness } from "@/hooks/useDataFreshness";
import { cn } from "@/lib/cn";
import { Pill } from "./Pill";
import type { PillTone } from "@/lib/tones";

const SEVERITY_TONE: Record<ReturnType<typeof useDataFreshness>["severity"], PillTone> = {
  fresh: "green",
  stale: "amber",
  outdated: "red",
  nodata: "neutral",
};

const SEVERITY_DOT: Record<ReturnType<typeof useDataFreshness>["severity"], string> = {
  fresh: "bg-green",
  stale: "bg-amber",
  outdated: "bg-red",
  nodata: "bg-text-faint",
};

export function DataFreshnessBadge({
  iso,
  variant = "default",
}: {
  iso?: string | null;
  variant?: "default" | "compact";
}) {
  const { label, severity } = useDataFreshness(iso);

  return (
    <Pill
      tone={SEVERITY_TONE[severity]}
      className={cn("font-mono", variant === "compact" && "px-2 py-0")}
      title={iso ?? "Sem timestamp"}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_DOT[severity])} aria-hidden />
      {label}
    </Pill>
  );
}
