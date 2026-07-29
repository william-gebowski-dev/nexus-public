import { useDataFreshness } from "@/hooks/useDataFreshness";
import { cn } from "@/lib/cn";

export function DataFreshnessBadge({
  iso,
  variant = "default",
}: {
  iso?: string | null;
  variant?: "default" | "compact";
}) {
  const { label, severity } = useDataFreshness(iso);
  const tone =
    severity === "fresh"
      ? "text-green border-green/40"
      : severity === "stale"
        ? "text-amber border-amber/40"
        : severity === "outdated"
          ? "text-red border-red/40"
          : "text-text-dim border-border-strong";

  const dot =
    severity === "fresh"
      ? "bg-green"
      : severity === "stale"
        ? "bg-amber"
        : severity === "outdated"
          ? "bg-red"
          : "bg-text-faint";

  return (
    <span
      className={cn(
        "nx-pill font-mono text-xs",
        tone,
        variant === "compact" && "px-2 py-0",
      )}
      title={iso ?? "Sem timestamp"}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}
