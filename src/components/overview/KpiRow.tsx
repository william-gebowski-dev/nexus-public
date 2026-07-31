import type { ReactNode } from "react";
import {
  AlertCircle,
  Blocks,
  Bot,
  ListChecks,
  Plug,
  Sparkles,
  Workflow,
} from "lucide-react";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { KpiCard } from "@/components/dashboard/KpiCard";
import type { CronStatus, NexusSystemStatus, RoutineDay } from "@/types";

function KpiSlot({ children }: { children?: ReactNode }) {
  return children ?? <CardSkeleton />;
}

export function KpiRow({
  cron,
  routine,
  status,
}: {
  cron: CronStatus | undefined;
  routine: RoutineDay | undefined;
  status: NexusSystemStatus | undefined;
}) {
  // Sem dados: mostrar "—" em vez de defaults otimistas (audit D.8 — antes
  // o card "Jobs ativos" mostrava "48 de 48" mesmo com cron indefinido).
  const totalJobs = cron?.totalJobs;
  const activeJobs = cron?.activeJobs;
  const completedJobs = routine?.completedJobs;
  const failedJobs = routine?.failedJobs;
  // Bloco completo = bloco cujas 4 tarefas estão todas concluídas.
  // Antes: `Math.floor(completedJobs / 4)` que errava quando as 4 tarefas
  // concluídas estavam em blocos diferentes.
  const completeBlocks = routine
    ? routine.blocks.filter((b) => b.completedCount === b.tasks.length).length
    : undefined;

  const fmtPair = (a: number | undefined, b: number | undefined) =>
    a !== undefined && b !== undefined ? `${a} de ${b}` : "—";
  const fmtNum = (n: number | undefined) => (n !== undefined ? n : "—");

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      <KpiSlot>
        <KpiCard
          label="Jobs ativos"
          value={fmtPair(activeJobs, totalJobs)}
          description="Rotinas agendadas em execução."
          href="/routine"
          icon={<ListChecks className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Execuções hoje"
          value={fmtPair(completedJobs, totalJobs)}
          description="Tarefas concluídas até agora."
          href="/executions"
          icon={<ListChecks className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Falhas hoje"
          value={fmtNum(failedJobs)}
          description="Tarefas que terminaram com erro."
          href="/executions?state=failed"
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Blocos concluídos"
          value={completeBlocks !== undefined ? `${completeBlocks} de 12` : "—"}
          description="Janelas finalizadas com sucesso."
          href="/routine"
          icon={<Blocks className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Agentes ativos"
          value={status?.counts.agentsActive ?? 0}
          description="Agentes prontos para execução."
          href="/agents"
          icon={<Bot className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="MCPs ativos"
          value={status?.counts.mcpsActive ?? 0}
          description="Conectores disponíveis."
          href="/mcps"
          icon={<Plug className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Skills ativas"
          value={status?.counts.skillsActive ?? 0}
          description="Capacidades habilitadas."
          href="/skills"
          icon={<Sparkles className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Automações ativas"
          value={status?.counts.automationsActive ?? 0}
          description="Rotinas automatizadas em curso."
          href="/automations"
          icon={<Workflow className="h-4 w-4" />}
        />
      </KpiSlot>
    </section>
  );
}