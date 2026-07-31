import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import type { RoutineDay } from "@/types";

export function NextExecutionCard({ routine }: { routine: RoutineDay }) {
  const flat = routine.blocks.flatMap((b) => b.tasks);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const upcoming = flat
    .filter((t) => {
      if (t.status !== "scheduled") return false;
      const iso = `${today}T${t.scheduledTime}:00-03:00`;
      return new Date(iso).getTime() > now.getTime();
    })
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const next = upcoming[0];

  if (!next) {
    return (
      <article className="nx-card flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Clock className="h-5 w-5 text-text-faint" aria-hidden />
        <h3 className="font-mono text-sm text-text">Sem próximas tarefas hoje</h3>
        <p className="text-xs text-text-dim">A rotina do dia foi concluída.</p>
      </article>
    );
  }

  return (
    <article className="nx-card flex h-full flex-col gap-4 p-5">
      <header className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="font-mono text-sm font-semibold text-text">Próxima execução</h2>
      </header>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-2xl font-semibold text-text">{next.scheduledTime}</span>
          <Pill tone="neutral" size="xs">
            Bloco {next.blockId}
          </Pill>
        </div>
        <h3 className="font-mono text-base font-semibold text-text">{next.title}</h3>
        {next.description && (
          <p className="text-xs text-text-dim">{next.description}</p>
        )}
      </div>

      <Link
        to="/routine"
        className={cn("nx-btn nx-btn-primary mt-auto justify-between", "no-underline")}
      >
        Ver rotina completa
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}