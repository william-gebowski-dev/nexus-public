import type { AvailabilityRecord, AvailabilityState, InfrastructureService } from "@/types";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusIconLegend } from "@/components/shared/StatusIconLegend";
import { formatPercent, formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATE_BG: Record<AvailabilityState, string> = {
  operational: "bg-green",
  instability: "bg-amber",
  unavailable: "bg-red",
  no_data: "bg-text-faint",
};

export function AvailabilitySection({
  availability,
  services,
}: {
  availability: Record<string, AvailabilityRecord[]> | undefined;
  services: InfrastructureService[] | undefined;
}) {
  if (!availability || !services) return <CardSkeleton />;
  return (
    <section className="nx-card p-5 space-y-4">
      <h2 className="font-mono text-lg font-semibold">Disponibilidade</h2>
      {services.map((s) => {
        const checks = availability[s.id] ?? [];
        const lastCheck = s.lastCheckedAt;
        return (
          <div key={s.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-sm text-text">{s.name}</h3>
              <div className="text-[11px] text-text-dim">
                <span className="font-mono">{formatPercent(s.availabilityPct)} últimas 24h</span>
                {" · "}
                <span>verificado {formatRelative(lastCheck, Date.now())}</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {checks.length > 0 ? (
                checks.map((r) => (
                  <span
                    key={r.id}
                    title={r.state}
                    aria-label={r.state}
                    className={cn("h-4 w-3 rounded-sm", STATE_BG[r.state] ?? "bg-text-faint")}
                  />
                ))
              ) : (
                <span className="text-[11px] text-text-faint">Sem verificações registradas</span>
              )}
            </div>
          </div>
        );
      })}
      <StatusIconLegend className="pt-2 border-t border-border" />
    </section>
  );
}