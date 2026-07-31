import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { BlockLane } from "./BlockLane";
import type { RoutineDay } from "@/types";

export function DailyRoutineTimeline({ routine }: { routine: RoutineDay | undefined }) {
  if (!routine) {
    return (
      <>
        <div className="space-y-3 lg:hidden">
          <div className="overflow-x-auto nx-timeline-scroll">
            <div className="flex min-w-max gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="min-w-32">
                  <CardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden grid-cols-12 gap-3 lg:grid">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="col-span-1">
              <CardSkeleton />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <section className="space-y-3" aria-label="Rotina diária em 12 blocos">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-mono text-base font-semibold text-text">Rotina do dia</h2>
          <p className="mt-1 text-xs text-text-dim">
            12 blocos × 4 tarefas — cada bloco segue Coletar → Analisar → Produzir → Consolidar.
          </p>
        </div>
      </header>

      <div className="overflow-x-auto nx-timeline-scroll lg:hidden">
        <div className="flex min-w-max gap-3">
          {routine.blocks.map((block) => (
            <BlockLane key={block.id} block={block} />
          ))}
        </div>
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-12">
        {routine.blocks.map((block) => (
          <div key={block.id} className="col-span-1 min-w-0">
            <BlockLane block={block} />
          </div>
        ))}
      </div>
    </section>
  );
}