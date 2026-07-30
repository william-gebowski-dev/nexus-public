import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function Routine() {
  return (
    <div className="space-y-6">
      <PageHeader title="Rotina 12×4" subtitle="Estrutura fixa das 24h — 12 blocos × 4 tarefas" />
      <EmptyState title="Em construção" description="Esta seção será implementada na Fase 4." />
    </div>
  );
}