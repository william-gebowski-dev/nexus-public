import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Hourglass } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/Pill";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { RoutineDay, RoutineTask } from "@/types";

function statusTone(status: RoutineTask["status"]) {
  if (status === "running") return "accent";
  if (status === "completed") return "green";
  if (status === "failed") return "red";
  if (status === "partial") return "amber";
  return "neutral";
}

function statusLabel(status: RoutineTask["status"]) {
  if (status === "running") return "Em execução";
  if (status === "completed") return "Concluída";
  if (status === "failed") return "Falhou";
  if (status === "partial") return "Parcial";
  if (status === "scheduled") return "Agendada";
  if (status === "cancelled") return "Cancelada";
  if (status === "skipped") return "Pulada";
  return "Desconhecida";
}

export function NowCard({ routine }: { routine: RoutineDay }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const clock = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const flat = routine.blocks.flatMap((b) => b.tasks);
  const running = flat.find((t) => t.status === "running");
  const next = flat
    .filter((t) => t.status === "scheduled")
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0];

  if (!running) {
    return (
      <EmptyState
        title="Nenhuma execução ativa no momento"
        description={next ? `A próxima tarefa inicia às ${next.scheduledTime}.` : undefined}
        icon={<Hourglass className="h-5 w-5" />}
      />
    );
  }

  const runningFor = running.startedAt
    ? formatRelative(running.startedAt, now.getTime())
    : "iniciando";

  return (
    <article className="nx-card flex h-full flex-col gap-4 p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" aria-hidden />
          <h2 className="font-mono text-sm font-semibold text-text">Agora no Hermes</h2>
        </div>
        <span className="font-mono text-sm text-text-dim">{clock}</span>
      </header>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-text-faint">{running.scheduledTime}</span>
          <Pill tone={statusTone(running.status)} size="xs">
            {statusLabel(running.status)}
          </Pill>
        </div>
        <h3 className="font-mono text-base font-semibold text-text">{running.title}</h3>
        <p className="text-xs text-text-dim">
          Bloco {running.blockId} · {running.slot}
        </p>
        {running.description && (
          <p className="text-xs text-text-dim">{running.description}</p>
        )}
      </div>

      <div className="mt-auto space-y-2 rounded-lg border border-border bg-surface-hover/30 p-3 text-xs text-text-dim">
        <div>
          Em execução há <span className="font-mono text-text">{runningFor}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-text-faint">Provider</div>
            <div className="font-mono text-text">{running.provider}</div>
          </div>
          <div>
            <div className="text-text-faint">Modelo</div>
            <div className="font-mono text-text">{running.model}</div>
          </div>
          <div>
            <div className="text-text-faint">Entrega</div>
            <div className="font-mono text-text">{running.delivery}</div>
          </div>
        </div>
      </div>

      <Link
        to={`/executions/${running.id}`}
        className={cn(
          "nx-btn nx-btn-primary justify-between",
          "no-underline",
        )}
      >
        Abrir execução
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}