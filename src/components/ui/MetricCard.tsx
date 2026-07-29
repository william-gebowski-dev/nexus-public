import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  trend,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { direction: "up" | "down" | "flat"; label?: string };
  icon?: ReactNode;
}) {
  const trendColor =
    trend?.direction === "up"
      ? "text-green"
      : trend?.direction === "down"
        ? "text-amber"
        : "text-text-faint";

  return (
    <div className="nx-card nx-card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-text-faint">{label}</div>
        {icon && <div className="text-text-dim">{icon}</div>}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold text-text">{value}</div>
      <div className={cn("mt-1 flex items-center gap-2 text-xs", trendColor)}>
        {trend?.direction && (
          <span aria-hidden>
            {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "—"}
          </span>
        )}
        {(trend?.label || hint) && (
          <span className="text-text-dim">{trend?.label ?? hint}</span>
        )}
      </div>
    </div>
  );
}
