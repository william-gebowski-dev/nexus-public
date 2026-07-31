import { useQueryClient } from "@tanstack/react-query";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useCronStatus } from "@/hooks/useCronStatus";
import { useRoutineToday } from "@/hooks/useRoutineToday";
import { useRecentExecutions } from "@/hooks/useRecentExecutions";
import { useDailyReport } from "@/hooks/useDailyReport";
import { useGeneratedArtifacts } from "@/hooks/useGeneratedArtifacts";
import { useInfrastructureStatus } from "@/hooks/useInfrastructureStatus";
import { useAvailability } from "@/hooks/useAvailability";
import { OverviewHeader } from "@/components/overview/OverviewHeader";
import { SystemStateBanner } from "@/components/overview/SystemStateBanner";
import { KpiRow } from "@/components/overview/KpiRow";
import { NowCard } from "@/components/overview/NowCard";
import { NextExecutionCard } from "@/components/overview/NextExecutionCard";
import { DailyRoutineTimeline } from "@/components/overview/DailyRoutineTimeline";
import { RecentExecutionsSection } from "@/components/overview/RecentExecutionsSection";
import { CronHealthSection } from "@/components/overview/CronHealthSection";
import { AvailabilitySection } from "@/components/overview/AvailabilitySection";
import { DailyReportTeaser } from "@/components/overview/DailyReportTeaser";
import { ActivitiesTimeline } from "@/components/overview/ActivitiesTimeline";
import { ArtifactsPanel } from "@/components/overview/ArtifactsPanel";
import { StaleBanner } from "@/components/overview/StaleBanner";
import { MockDataBadge } from "@/components/overview/MockDataBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export function Overview() {
  const qc = useQueryClient();
  const status = useSystemStatus();
  const cron = useCronStatus();
  const routine = useRoutineToday();
  const recent = useRecentExecutions(10);
  const todayBRT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const daily = useDailyReport(todayBRT);
  const artifacts = useGeneratedArtifacts();
  const infrastructure = useInfrastructureStatus();
  const availability = useAvailability();

  const onRefresh = () => {
    void qc.invalidateQueries({ queryKey: ["systemStatus"] });
    void qc.invalidateQueries({ queryKey: ["cronStatus"] });
    void qc.invalidateQueries({ queryKey: ["routineToday"] });
    void qc.invalidateQueries({ queryKey: ["recentExecutions"] });
    void qc.invalidateQueries({ queryKey: ["dailyReport"] });
    void qc.invalidateQueries({ queryKey: ["generatedArtifacts"] });
    void qc.invalidateQueries({ queryKey: ["infrastructureStatus"] });
    void qc.invalidateQueries({ queryKey: ["availability"] });
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
        isRefreshing={
          status.isFetching ||
          cron.isFetching ||
          routine.isFetching ||
          recent.isFetching ||
          daily.isFetching ||
          artifacts.isFetching ||
          infrastructure.isFetching ||
          availability.isFetching
        }
      />

      <SystemStateBanner cron={cron.data} />

      <KpiRow cron={cron.data} routine={routine.data} status={status.data} />

      <section className="grid gap-3 lg:grid-cols-2">
        {!routine.data ? <CardSkeleton /> : <NowCard routine={routine.data} />}
        {!routine.data ? <CardSkeleton /> : <NextExecutionCard routine={routine.data} />}
      </section>

      <DailyRoutineTimeline routine={routine.data} />
      <RecentExecutionsSection />
      <CronHealthSection cron={cron.data} />
      <AvailabilitySection availability={availability.data} services={infrastructure.data} />
      <DailyReportTeaser daily={daily.data} />
      <ActivitiesTimeline routine={routine.data} />
      <ArtifactsPanel artifacts={artifacts.data} />

      <StaleBanner lastUpdate={cron.data?.lastRunAt ?? null} />
      <MockDataBadge />
    </div>
  );
}