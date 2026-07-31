import { Link } from "react-router-dom";
import type { InfrastructureService, Service } from "@/types";
import { formatDateTime, formatPercent } from "@/lib/format";
import { AvailabilityStrip } from "@/components/availability/AvailabilityStrip";
import { Pill } from "@/components/ui/Pill";
import type { PillTone } from "@/lib/tones";

const STATUS_COPY: Record<Service["status"], { label: string; tone: PillTone }> = {
  healthy: { label: "Operacional", tone: "green" },
  attention: { label: "Atenção necessária", tone: "amber" },
  down: { label: "Indisponível", tone: "red" },
};

export function InfrastructureServiceCard({ service }: { service: InfrastructureService }) {
  const status = STATUS_COPY[service.status];
  const label = service.publicLabel ?? service.name;

  return (
    <article className="nx-card nx-card-hover min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-base text-text">{label}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-dim">{service.description}</p>
        </div>
        <Pill tone={status.tone} size="xs">{status.label}</Pill>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-text-faint">Última verificação</dt>
          <dd className="mt-0.5 font-mono text-text">{formatDateTime(service.lastCheckedAt)}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Versão</dt>
          <dd className="mt-0.5 font-mono text-text">{service.version ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Uso</dt>
          <dd className="mt-0.5 font-mono text-text">{service.usageLabel ?? `${service.latencyMs}ms`}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Disponibilidade</dt>
          <dd className="mt-0.5 font-mono text-text">{formatPercent(service.availabilityPct)}</dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-[11px] text-text-faint">
          <span>Verificações recentes</span>
          <span>7d {formatPercent(service.availability7dPct ?? service.availabilityPct)}</span>
        </div>
        <AvailabilityStrip records={service.availabilityChecks} label={label} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-text-faint">
          Última falha: {service.lastFailureAt ? formatDateTime(service.lastFailureAt) : "sem registro recente"}
        </span>
        <Link to={service.detailsHref ?? "/infraestrutura"} className="font-medium text-link hover:underline">
          Detalhes
        </Link>
      </div>
    </article>
  );
}
