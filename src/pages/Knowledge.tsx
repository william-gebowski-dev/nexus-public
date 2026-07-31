import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockKeyhole } from "lucide-react";

export function Knowledge() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Conhecimento"
        subtitle="Base interna do Nexus — protegida e em curadoria."
      />
      <EmptyState
        title="Área restrita"
        description="A base de conhecimento está sendo reorganizada. O conteúdo antigo foi retirado e ficará disponível após a ativação do controle de acesso."
        icon={<LockKeyhole className="h-5 w-5" />}
      />
    </div>
  );
}