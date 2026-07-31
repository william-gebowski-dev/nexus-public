import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useCronStatus } from "@/hooks/useCronStatus";
import { useRoutineToday } from "@/hooks/useRoutineToday";
import { useRecentExecutions } from "@/hooks/useRecentExecutions";
import { useDailyReport } from "@/hooks/useDailyReport";
import { useGeneratedArtifacts } from "@/hooks/useGeneratedArtifacts";
import { useInfrastructureStatus } from "@/hooks/useInfrastructureStatus";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types";
import { OverviewHeader } from "@/components/overview/OverviewHeader";
import { SystemStateBanner } from "@/components/overview/SystemStateBanner";
import { KpiRow } from "@/components/overview/KpiRow";
import { NowCard } from "@/components/overview/NowCard";
import { NextExecutionCard } from "@/components/overview/NextExecutionCard";
import { DailyRoutineTimeline } from "@/components/overview/DailyRoutineTimeline";
import { CronHealthSection } from "@/components/overview/CronHealthSection";
import { DailyReportTeaser } from "@/components/overview/DailyReportTeaser";
import { StaleBanner } from "@/components/overview/StaleBanner";
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
  const projects = useProjects();

  const onRefresh = () => {
    void qc.invalidateQueries({ queryKey: ["systemStatus"] });
    void qc.invalidateQueries({ queryKey: ["cronStatus"] });
    void qc.invalidateQueries({ queryKey: ["routineToday"] });
    void qc.invalidateQueries({ queryKey: ["recentExecutions"] });
    void qc.invalidateQueries({ queryKey: ["dailyReport"] });
    void qc.invalidateQueries({ queryKey: ["generatedArtifacts"] });
    void qc.invalidateQueries({ queryKey: ["infrastructureStatus"] });
    void qc.invalidateQueries({ queryKey: ["projects"] });
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

  // Resumos para os cards-link da terceira camada.
  const lastExec = recent.data?.items?.[0] ?? null;
  const servicesDown =
    infrastructure.data?.filter((s) => s.status === "down").length ?? 0;
  const lastArtifact = artifacts.data?.[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Camada 1 — acima do fold: estado, KPIs e o que está rodando agora */}
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
          projects.isFetching
        }
      />

      <SystemStateBanner
        cron={cron.data}
        isLoading={cron.isLoading}
        recentFailures={routine.data?.failedJobs}
      />

      <KpiRow cron={cron.data} routine={routine.data} status={status.data} />

      <section className="grid gap-3 lg:grid-cols-2">
        {!routine.data ? <CardSkeleton /> : <NowCard routine={routine.data} />}
        {!routine.data ? <CardSkeleton /> : <NextExecutionCard routine={routine.data} />}
      </section>

      {/* Camada 2 — a timeline 12×4 é o coração do produto */}
      <DailyRoutineTimeline routine={routine.data} />

      {/* Camada 3 — atalhos para páginas dedicadas (mantém sinal, sem duplicar) */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          to="/executions"
          title="Execuções"
          metric={
            lastExec
              ? `${lastExec.name} · ${lastExec.status}`
              : "Sem execuções ainda"
          }
        />
        <QuickLink
          to="/infrastructure"
          title="Infraestrutura"
          metric={
            servicesDown > 0
              ? `${servicesDown} serviço(s) indisponíveis`
              : "Todos os serviços operacionais"
          }
        />
        <QuickLink
          to="/projects"
          title="Projetos"
          metric={projectsMetric(projects.data)}
        />
        <QuickLink
          to="/activities"
          title="Resultados gerados"
          metric={
            lastArtifact
              ? `Último: ${lastArtifact.name}`
              : "Sem artefatos hoje"
          }
        />
      </section>

      <CronHealthSection cron={cron.data} />
      <DailyReportTeaser daily={daily.data} />

      <StaleBanner lastUpdate={cron.data?.lastRunAt ?? null} />
    </div>
  );
}

function QuickLink({ to, title, metric }: { to: string; title: string; metric: string }) {
  return (
    <Link
      to={to}
      className="nx-card group flex flex-col gap-1 p-4 transition-colors hover:border-geb/40"
    >
      <span className="font-mono text-xs uppercase tracking-wider text-text-faint">
        {title}
      </span>
      <span className="text-sm text-text-dim">{metric}</span>
      <span className="mt-1 text-xs text-link group-hover:underline">Abrir →</span>
    </Link>
  );
}

/**
 * Resumo de projetos para o card-link do Overview.
 *
 * Status considerados "ativos": planning, development, validation, operational.
 * Status "pausados": paused — pausa explícita do projeto, não um bloqueio.
 * Bloqueios concretos (impedimentos) vivem no roadmap (state "blocked"), não aqui.
 * Status "arquivados" são excluídos das duas contagens.
 */
function projectsMetric(items: Project[] | undefined): string {
  if (!items || items.length === 0) return "Sem projetos cadastrados";
  const active = items.filter((p) =>
    p.status === "planning" || p.status === "development" ||
    p.status === "validation" || p.status === "operational",
  );
  const paused = items.filter((p) => p.status === "paused");
  const parts = [`${active.length} ativo${active.length === 1 ? "" : "s"}`];
  if (paused.length > 0) {
    parts.push(`${paused.length} pausado${paused.length === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}
