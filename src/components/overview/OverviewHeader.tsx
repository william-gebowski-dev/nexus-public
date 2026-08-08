import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { cn } from "@/lib/cn";
import type { CronStatus, NexusSystemStatus } from "@/types";

export function OverviewHeader({
  cron,
  status,
  onRefresh,
  isRefreshing,
}: {
  cron: CronStatus | undefined;
  status: NexusSystemStatus | undefined;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const clock = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const freshnessIso = status?.generatedAt ?? cron?.nextRunAt ?? null;

  return (
    <header className="nx-card overflow-hidden">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr,auto] lg:items-center">
        <div className="flex items-start gap-4">
          <div
            className="relative h-8 w-8 shrink-0 rounded-xl border border-primary/30 bg-primary-soft"
            aria-hidden
          >
            <div className="absolute inset-1 rounded-lg border border-primary/35 bg-surface" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold leading-none tracking-tight">Nexus Dashboard</div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-dim">
              Centro operacional do ecossistema
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:items-end">
          <div className="flex flex-col items-start gap-2 sm:items-center lg:items-end">
            <span
              className="font-mono text-2xl font-semibold tracking-tight text-text"
              aria-label={`Hora atual ${clock}`}
            >
              {clock}
            </span>
            {freshnessIso && <DataFreshnessBadge iso={freshnessIso} />}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="nx-btn nx-btn-primary"
            aria-busy={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              aria-hidden
            />
            Atualizar
          </button>
        </div>
      </div>
    </header>
  );
}