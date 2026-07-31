import { useMemo, useState, type ReactNode } from "react";
import { Clock } from "lucide-react";
import { useRoutineToday } from "@/hooks/useRoutineToday";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { BlockAccordion } from "@/components/routine/BlockAccordion";
import type { RoutineBlock } from "@/types";

function blockContainsNow(block: RoutineBlock, nowHHMM: string): boolean {
  return nowHHMM >= block.windowStart && nowHHMM < block.windowEnd;
}

export function Routine() {
  const routine = useRoutineToday();
  const blocks = routine.data?.blocks ?? [];
  const nowHHMM = useMemo(() => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()), []);
  const activeBlockId = useMemo(() => blocks.find((block) => blockContainsNow(block, nowHHMM))?.id ?? null, [blocks, nowHHMM]);
  const [selectedDate] = useState("2026-07-30");
  void selectedDate;

  if (routine.isLoading) return <CardSkeleton />;
  if (routine.isError) return <ErrorState error={routine.error} onRetry={() => void routine.refetch()} />;
  if (blocks.length === 0) return <EmptyState title="Sem blocos para exibir" description="A rotina ainda não tem blocos carregados para esta data." />;

  const completedToday = blocks.filter((block) => block.completedCount === block.tasks.length).length;
  const failedToday = blocks.filter((block) => block.failedCount > 0).length;
  const runningNow = blocks.find((block) => block.status === "running");

  return <div className="space-y-6">
    <PageHeader title="Rotina 12×4" subtitle="Estrutura fixa das 24h — 12 blocos × 4 tarefas cada" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <Stat label="Blocos concluídos" value={`${completedToday} de 12`} />
      <Stat label="Com erro" value={failedToday.toString()} />
      <Stat label="Bloco ativo" value={runningNow ? `#${runningNow.id} ${runningNow.name}` : "—"} />
      <Stat label="Horário BRT" value={nowHHMM} icon={<Clock className="h-3 w-3 text-text-faint" />} />
    </div>
    <div className="space-y-3">{blocks.map((block) => <BlockAccordion key={block.id} block={block} defaultOpen={block.id === activeBlockId} />)}</div>
  </div>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="nx-card p-4"><p className="text-text-faint text-[10px] uppercase tracking-wider">{label}</p><p className="mt-1 font-mono text-text text-base flex items-center gap-2">{icon}{value}</p></div>;
}
