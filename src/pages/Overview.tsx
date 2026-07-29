import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatusCard } from "@/components/ui/StatusCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { ExecutionRow } from "@/components/ui/ExecutionRow";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { Bot, FolderKanban, Plug, Server, Sparkles, Wrench, Activity as ActivityIcon, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

const REFRESH_MS = 15 * 60 * 1000;

export function Overview() {
  const statusQ = useQuery({ queryKey: ["status"], queryFn: api.status, refetchInterval: REFRESH_MS });
  const actsQ = useQuery({ queryKey: ["activities", 10, 0], queryFn: () => api.activities(10, 0), refetchInterval: REFRESH_MS });
  const execsQ = useQuery({ queryKey: ["executions", 10, 0], queryFn: () => api.executions(10, 0), refetchInterval: REFRESH_MS });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-text-dim">
            Resumo operacional do ecossistema Nexus.
          </p>
        </div>
        <DataFreshnessBadge iso={statusQ.data?.generatedAt ?? null} />
      </header>

      {statusQ.isLoading ? (
        <CardSkeleton />
      ) : statusQ.isError ? (
        <ErrorState onRetry={() => statusQ.refetch()} />
      ) : statusQ.data ? (
        <StatusCard
          state={statusQ.data.overall}
          description={`${statusQ.data.counts.servicesUp} serviços operacionais, ${statusQ.data.counts.servicesAttention} com atenção.`}
          right={
            <div className="text-right font-mono text-xs">
              <div className="text-text-faint">Próxima sinc.</div>
              <div className="text-text">15 min</div>
            </div>
          }
        />
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
        {statusQ.isLoading || !statusQ.data ? (
          Array.from({ length: 7 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              label="Serviços operacionais"
              value={statusQ.data.counts.servicesUp}
              hint={`${statusQ.data.counts.servicesAttention} atenção`}
              icon={<Server className="h-4 w-4" />}
            />
            <MetricCard
              label="Agentes ativos"
              value={statusQ.data.counts.agentsActive}
              icon={<Bot className="h-4 w-4" />}
            />
            <MetricCard
              label="MCPs ativos"
              value={statusQ.data.counts.mcpsActive}
              icon={<Plug className="h-4 w-4" />}
            />
            <MetricCard
              label="Skills ativas"
              value={statusQ.data.counts.skillsActive}
              icon={<Sparkles className="h-4 w-4" />}
            />
            <MetricCard
              label="Automações ativas"
              value={statusQ.data.counts.automationsActive}
              icon={<Wrench className="h-4 w-4" />}
            />
            <MetricCard
              label="Projetos ativos"
              value={statusQ.data.counts.projectsActive}
              icon={<FolderKanban className="h-4 w-4" />}
            />
            <MetricCard
              label="Execuções (24h)"
              value={statusQ.data.counts.executionsLast24h}
              icon={<PlayCircle className="h-4 w-4" />}
            />
            <MetricCard
              label="Próxima atualização"
              value="15 min"
              hint="sincronização automática"
            />
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <header className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-base">
              <ActivityIcon className="h-4 w-4 text-text-dim" /> Atividades recentes
            </h2>
            <Link to="/atividades" className="text-xs text-accent hover:underline">
              Ver todas →
            </Link>
          </header>
          <div className="space-y-2">
            {actsQ.isLoading ? (
              <CardSkeleton />
            ) : actsQ.isError ? (
              <ErrorState onRetry={() => actsQ.refetch()} />
            ) : !actsQ.data || actsQ.data.items.length === 0 ? (
              <EmptyState title="Nenhuma atividade registrada" description="Os eventos aparecerão aqui quando forem gerados." />
            ) : (
              actsQ.data.items.slice(0, 10).map((a) => <ActivityItem key={a.id} activity={a} />)
            )}
          </div>
        </div>

        <div>
          <header className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-base">
              <PlayCircle className="h-4 w-4 text-text-dim" /> Execuções recentes
            </h2>
            <Link to="/execucoes" className="text-xs text-accent hover:underline">
              Ver todas →
            </Link>
          </header>
          <div className="nx-card overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
                  <th className="py-2 pr-4">Execução</th>
                  <th className="py-2 pr-4">Runner</th>
                  <th className="py-2 pr-4">Início</th>
                  <th className="py-2 pr-4">Duração</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {execsQ.isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-xs text-text-faint">
                      Carregando…
                    </td>
                  </tr>
                ) : execsQ.isError ? (
                  <tr>
                    <td colSpan={5} className="py-4">
                      <ErrorState onRetry={() => execsQ.refetch()} />
                    </td>
                  </tr>
                ) : !execsQ.data || execsQ.data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6">
                      <EmptyState title="Nenhuma execução encontrada" />
                    </td>
                  </tr>
                ) : (
                  execsQ.data.items.slice(0, 10).map((e) => <ExecutionRow key={e.id} execution={e} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
