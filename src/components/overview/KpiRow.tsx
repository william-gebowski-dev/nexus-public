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
  const totalJobs = cron?.totalJobs ?? 48;
  const activeJobs = cron?.activeJobs ?? 48;
  const completedJobs = routine?.completedJobs ?? 0;
  const failedJobs = routine?.failedJobs ?? 0;
  const completeBlocks = routine ? Math.floor(completedJobs / 4) : 0;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      <KpiSlot>
        <KpiCard
          label="Jobs ativos"
          value={`${activeJobs} de ${totalJobs}`}
          description="Rotinas agendadas em execução."
          href="/routine"
          icon={<ListChecks className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Execuções hoje"
          value={`${completedJobs} de ${totalJobs}`}
          description="Tarefas concluídas até agora."
          href="/executions"
          icon={<ListChecks className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Falhas hoje"
          value={failedJobs}
          description="Tarefas que terminaram com erro."
          href="/executions?state=failed"
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </KpiSlot>
      <KpiSlot>
        <KpiCard
          label="Blocos concluídos"
          value={`${completeBlocks} de 12`}
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