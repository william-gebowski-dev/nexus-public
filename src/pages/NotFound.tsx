import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Construction } from "lucide-react";

export function NotFound() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="404 — Página não encontrada"
        subtitle="Esta rota não existe no Nexus Dashboard."
      />
      <EmptyState
        title="Destino desconhecido"
        description="O link que você abriu não corresponde a nenhuma seção do painel operacional. Volte para a visão geral."
        icon={<Construction className="h-5 w-5" />}
      />
      <div className="flex justify-center">
        <Link to="/" className="nx-btn nx-btn-primary">Voltar à visão geral</Link>
      </div>
    </div>
  );
}