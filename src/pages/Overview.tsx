import { useQueryClient } from "@tanstack/react-query";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useCronStatus } from "@/hooks/useCronStatus";
import { useRoutineToday } from "@/hooks/useRoutineToday";
import { OverviewHeader } from "@/components/overview/OverviewHeader";
import { SystemStateBanner } from "@/components/overview/SystemStateBanner";
import { KpiRow } from "@/components/overview/KpiRow";
import { NowCard } from "@/components/overview/NowCard";
import { NextExecutionCard } from "@/components/overview/NextExecutionCard";
import { DailyRoutineTimeline } from "@/components/overview/DailyRoutineTimeline";
import { StaleBanner } from "@/components/overview/StaleBanner";
import { MockDataBadge } from "@/components/overview/MockDataBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export function Overview() {
  const qc = useQueryClient();
  const status = useSystemStatus();
  const cron = useCronStatus();
  const routine = useRoutineToday();

  const onRefresh = () => {
    void qc.invalidateQueries({ queryKey: ["systemStatus"] });
    void qc.invalidateQueries({ queryKey: ["cronStatus"] });
    void qc.invalidateQueries({ queryKey: ["routineToday"] });
  };

  if (status.isError && !status.data) {
    return (
      <ErrorState
        title="Não foi possível atualizar os dados do Hermes."
        error={status.error}
        onRetry={() => {
          void status.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <OverviewHeader
        cron={cron.data}
        status={status.data}
        onRefresh={onRefresh}
        isRefreshing={status.isFetching || cron.isFetching || routine.isFetching}
      />

      <SystemStateBanner cron={cron.data} />

      <KpiRow cron={cron.data} routine={routine.data} status={status.data} />

      <section className="grid gap-3 lg:grid-cols-2">
        {!routine.data ? <CardSkeleton /> : <NowCard routine={routine.data} />}
        {!routine.data ? <CardSkeleton /> : <NextExecutionCard routine={routine.data} />}
      </section>

      <DailyRoutineTimeline routine={routine.data} />

      <StaleBanner lastUpdate={cron.data?.lastRunAt ?? null} />
      <MockDataBadge />
    </div>
  );
}