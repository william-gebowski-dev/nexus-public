import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AgentCard } from "@/components/ui/AgentCard";
import { CardSkeleton, LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { Plug, Sparkles, Cpu, AlertCircle } from "lucide-react";
import type { McpStatus } from "@/types";
import { cn } from "@/lib/cn";

const REFRESH_MS = 15 * 60 * 1000;

export function AI() {
  const agents = useQuery({ queryKey: ["agents"], queryFn: api.agents, refetchInterval: REFRESH_MS });
  const mcps = useQuery({ queryKey: ["mcps"], queryFn: api.mcps, refetchInterval: REFRESH_MS });
  const skills = useQuery({ queryKey: ["skills"], queryFn: api.skills, refetchInterval: REFRESH_MS });
  const models = useQuery({ queryKey: ["models"], queryFn: api.models, refetchInterval: REFRESH_MS });

  const lastTs =
    [agents.dataUpdatedAt, mcps.dataUpdatedAt, skills.dataUpdatedAt, models.dataUpdatedAt]
      .filter(Boolean)
      .sort()
      .pop();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Inteligência Artificial</h1>
          <p className="mt-1 text-sm text-text-dim">
            Agentes, MCPs, skills e modelos do ecossistema.
          </p>
        </div>
        <DataFreshnessBadge iso={lastTs ? new Date(lastTs).toISOString() : null} />
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-base">
          <Cpu className="h-4 w-4 text-text-dim" /> Agentes
        </h2>
        {agents.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : agents.isError ? (
          <ErrorState onRetry={() => agents.refetch()} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(agents.data ?? []).map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-base">
          <Plug className="h-4 w-4 text-text-dim" /> MCPs
        </h2>
        {mcps.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : mcps.isError ? (
          <ErrorState onRetry={() => mcps.refetch()} />
        ) : (mcps.data ?? []).length === 0 ? (
          <EmptyState title="Nenhum MCP conectado" />
        ) : (
          <div className="nx-card overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Categoria</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Última atividade</th>
                </tr>
              </thead>
              <tbody>
                {(mcps.data ?? []).map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                    <td className="py-2 pr-4 font-mono text-sm text-text">{m.name}</td>
                    <td className="py-2 pr-4 text-xs text-text-dim">{m.category}</td>
                    <td className="py-2 pr-4">
                      <McpStatusPill status={m.status} />
                    </td>
                    <td className="py-2 pr-4 text-xs font-mono text-text-dim">
                      {new Date(m.lastActivityAt).toLocaleTimeString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-base">
          <Sparkles className="h-4 w-4 text-text-dim" /> Skills
        </h2>
        {skills.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : skills.isError ? (
          <ErrorState onRetry={() => skills.refetch()} />
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {(skills.data ?? []).map((s) => (
              <div key={s.id} className="nx-card flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-text">{s.name}</div>
                  <div className="text-[11px] text-text-dim">{s.purpose}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "nx-pill text-[10px]",
                      s.active ? "text-green border-green/40" : "text-text-faint border-border-strong",
                    )}
                  >
                    {s.active ? "Ativa" : "Inativa"}
                  </span>
                  <SourceBadge source={s.source} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-base">
          <AlertCircle className="h-4 w-4 text-text-dim" /> Modelos
        </h2>
        {models.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : models.isError ? (
          <ErrorState onRetry={() => models.refetch()} />
        ) : (
          <div className="nx-card overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-faint">
                  <th className="py-2 pr-4">Modelo</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Chamadas (14d)</th>
                </tr>
              </thead>
              <tbody>
                {(models.data ?? []).map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                    <td className="py-2 pr-4 font-mono text-sm text-text">{m.label}</td>
                    <td className="py-2 pr-4 text-xs">
                      <ModelStatusPill status={m.status} />
                    </td>
                    <td className="py-2 pr-4 text-xs font-mono text-text-dim">{m.callsLast14d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function McpStatusPill({ status }: { status: McpStatus }) {
  return (
    <span
      className={cn(
        "nx-pill text-[10px]",
        status === "connected"
          ? "text-green border-green/40"
          : "text-red border-red/40",
      )}
    >
      {status === "connected" ? "Conectado" : "Indisponível"}
    </span>
  );
}

function ModelStatusPill({ status }: { status: "available" | "rate_limited" | "offline" }) {
  const label =
    status === "available" ? "Disponível" : status === "rate_limited" ? "Limite de taxa" : "Offline";
  const tone =
    status === "available"
      ? "text-green border-green/40"
      : status === "rate_limited"
        ? "text-amber border-amber/40"
        : "text-red border-red/40";
  return <span className={cn("nx-pill text-[10px]", tone)}>{label}</span>;
}
