import type { Agent } from "@/types";
import { formatDuration, formatRelative } from "@/lib/format";
import { SourceBadge } from "./SourceBadge";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<Agent["status"], { label: string; tone: string }> = {
  active: { label: "Ativo", tone: "text-green bg-green-soft border-green/40" },
  paused: { label: "Pausado", tone: "text-amber bg-amber-soft border-amber/40" },
  disabled: { label: "Desabilitado", tone: "text-text-faint bg-surface-hover border-border-strong" },
};

export function AgentCard({ agent }: { agent: Agent }) {
  const status = STATUS_TONE[agent.status];
  const successRate =
    agent.completedCount + agent.errorCount > 0
      ? Math.round((agent.completedCount / (agent.completedCount + agent.errorCount)) * 100)
      : null;
  return (
    <div className="nx-card nx-card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-faint">
            <span className={cn("nx-pill text-[10px] py-0", status.tone)}>{status.label}</span>
            <span aria-hidden>·</span>
            <span>modelo {agent.model}</span>
          </div>
          <h3 className="mt-1 truncate font-mono text-base text-text">{agent.name}</h3>
          <p className="mt-1 text-xs text-text-dim">{agent.role}</p>
        </div>
        <SourceBadge source={agent.source} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-text-faint">Concluídas</div>
          <div className="mt-0.5 font-mono text-sm text-text">{agent.completedCount}</div>
        </div>
        <div>
          <div className="text-text-faint">Erros</div>
          <div className="mt-0.5 font-mono text-sm text-text">{agent.errorCount}</div>
        </div>
        <div>
          <div className="text-text-faint">Duração méd.</div>
          <div className="mt-0.5 font-mono text-sm text-text">{formatDuration(agent.avgDurationMs)}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-text-faint">
        <span>Última atividade: {formatRelative(agent.lastActivityAt)}</span>
        {successRate !== null && (
          <span className="font-mono">
            taxa {successRate}%
          </span>
        )}
      </div>
    </div>
  );
}
