import { cn } from "@/lib/cn";
import type { CronStatus } from "@/types";

const TONE_DOT: Record<"green" | "amber" | "red", string> = {
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
};

export function SystemStateBanner({
  cron,
  recentFailures,
}: {
  cron: CronStatus | undefined;
  recentFailures?: number;
}) {
  let message: string;
  let tone: "green" | "amber" | "red";
  if (!cron?.gatewayRunning) {
    message = "O gateway não respondeu à última verificação";
    tone = "red";
  } else if ((recentFailures ?? 0) > 0) {
    message =
      (recentFailures ?? 0) === 1
        ? "Uma execução falhou nas últimas 24 horas"
        : `${recentFailures} execuções falharam nas últimas 24 horas`;
    tone = "amber";
  } else {
    message = "Todos os 48 jobs estão ativos";
    tone = "green";
  }

  return (
    <section className="nx-card border-primary/20 bg-primary-soft/60 p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn("h-2.5 w-2.5 rounded-full", TONE_DOT[tone])}
          aria-hidden
        />
        <h2 className="font-mono text-base font-semibold text-text">{message}</h2>
      </div>
    </section>
  );
}