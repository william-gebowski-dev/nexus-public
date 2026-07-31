import type { RoutineDay, DailyActivity } from "@/types";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

const STATE_DOT: Record<DailyActivity["state"], string> = {
  success: "bg-green",
  running: "bg-secondary animate-pulse",
  warning: "bg-amber",
  error: "bg-red",
};

export function ActivitiesTimeline({ routine }: { routine: RoutineDay | undefined }) {
  if (!routine) return <CardSkeleton />;
  const items = routine.recentActivities ?? [];
  if (items.length === 0)
    return <p className="text-xs text-text-faint">Sem atividades registradas hoje.</p>;
  return (
    <section className="nx-card p-5 space-y-3">
      <h2 className="font-mono text-lg font-semibold">Atividades recentes</h2>
      <ol className="space-y-3">
        {items.map((act) => (
          <li key={act.id} className="flex items-start gap-3 text-sm">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", STATE_DOT[act.state])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-text-dim leading-relaxed">{act.text}</p>
              <p className="mt-0.5 text-[11px] text-text-faint">{formatRelative(act.at, Date.now())}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}