import type { CronStatus } from "@/types";
import { formatDateTime } from "@/lib/format";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/cn";

export function CronHealthSection({ cron }: { cron: CronStatus | undefined }) {
  if (!cron) return <CardSkeleton />;
  const formatSeconds = (s: number) =>
    s < 60 ? `${s}s atrás` : `${Math.floor(s / 60)} min atrás`;
  return (
    <section className="nx-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn("h-2 w-2 rounded-full", cron.gatewayRunning ? "bg-green" : "bg-red")}
          aria-hidden
        />
        <h2 className="font-mono text-lg font-semibold">Hermes Cron</h2>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
        <Pair label="Gateway" value={cron.gatewayRunning ? `ativo (PID ${cron.gatewayPid ?? "—"})` : "parado"} />
        <Pair label="Jobs ativos" value={`${cron.activeJobs} de ${cron.totalJobs}`} />
        <Pair label="Próxima execução" value={formatDateTime(cron.nextRunAt)} />
        <Pair label="Heartbeat" value={formatSeconds(cron.heartbeatSecondsAgo)} />
        <Pair label="Última execução" value={cron.lastRunAt ? formatDateTime(cron.lastRunAt) : "—"} />
        <Pair label="Última falha" value={cron.lastFailureAt ? formatDateTime(cron.lastFailureAt) : "—"} />
        <Pair label="Provider" value={cron.provider} />
        <Pair label="Modelo" value={cron.model} />
        <Pair label="Delivery" value={cron.delivery} />
      </dl>
    </section>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-faint text-[10px] uppercase tracking-wider">{label}</dt>
      <dd className="font-mono mt-0.5 text-text">{value}</dd>
    </div>
  );
}