import type { InfrastructureService } from "@/types";
import { Pill } from "@/components/ui/Pill";
import type { PillTone } from "@/lib/tones";
import { formatPercent, formatRelative, formatDateTime } from "@/lib/format";

const STATUS_TONE: Record<InfrastructureService["status"], PillTone> = {
  healthy: "green",
  attention: "amber",
  down: "red",
};

const STATUS_LABEL: Record<InfrastructureService["status"], string> = {
  healthy: "Operacional",
  attention: "Atenção",
  down: "Indisponível",
};

export function ServiceCard({ service }: { service: InfrastructureService }) {
  return (
    <article className="nx-card p-4 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-sm text-text">{service.name}</h3>
          <p className="mt-0.5 text-[11px] text-text-dim">{service.description}</p>
        </div>
        <Pill tone={STATUS_TONE[service.status]} size="xs">{STATUS_LABEL[service.status]}</Pill>
      </header>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <dt className="text-text-faint">Disponibilidade</dt>
        <dd className="font-mono text-text-dim">{formatPercent(service.availabilityPct)}</dd>
        <dt className="text-text-faint">Latência mediana</dt>
        <dd className="font-mono text-text-dim">{service.latencyMs} ms</dd>
        {service.version && (
          <>
            <dt className="text-text-faint">Versão</dt>
            <dd className="font-mono text-text-dim">{service.version}</dd>
          </>
        )}
        <dt className="text-text-faint">Última verificação</dt>
        <dd className="font-mono text-text-dim">{formatRelative(service.lastCheckedAt, Date.now())}</dd>
        {service.usageLabel && (
          <>
            <dt className="text-text-faint">Recursos</dt>
            <dd className="font-mono text-text-dim">{service.usageLabel}</dd>
          </>
        )}
        {service.lastFailureAt && (
          <>
            <dt className="text-text-faint">Última falha</dt>
            <dd className="font-mono text-text-dim">{formatDateTime(service.lastFailureAt)}</dd>
          </>
        )}
      </dl>
    </article>
  );
}
