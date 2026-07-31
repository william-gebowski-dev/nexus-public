import { useInfrastructureStatus } from "@/hooks/useInfrastructureStatus";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceCard } from "@/components/infrastructure/ServiceCard";
import { ServiceUptimeHeader } from "@/components/infrastructure/ServiceUptimeHeader";

export function Infrastructure() {
  const infra = useInfrastructureStatus();
  const services = (infra.data ?? []).filter(
    (s) => s.status === "healthy" || s.status === "attention" || s.status === "down",
  );

  if (infra.isLoading) return <CardSkeleton />;
  if (infra.isError)
    return <ErrorState error={infra.error} onRetry={() => void infra.refetch()} />;
  if (services.length === 0)
    return <EmptyState title="Sem serviços cadastrados" description="A lista de infraestrutura está vazia." />;

  const healthy = services.filter((s) => s.status === "healthy").length;
  const attention = services.filter((s) => s.status === "attention").length;
  const down = services.filter((s) => s.status === "down").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infraestrutura"
        subtitle="Serviços essenciais do ecossistema Hermes."
      />

      <ServiceUptimeHeader
        total={services.length}
        healthy={healthy}
        attention={attention}
        down={down}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
