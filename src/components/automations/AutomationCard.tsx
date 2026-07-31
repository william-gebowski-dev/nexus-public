import type { Automation } from "@/types";
import { formatRelative } from "@/lib/format";
import { Pill } from "@/components/ui/Pill";
import { SourceBadge } from "@/components/ui/SourceBadge";
import type { PillTone } from "@/lib/tones";

const STATUS: Record<Automation["status"], { label: string; tone: PillTone }> = {
  running: { label: "Em execução", tone: "green" },
  scheduled: { label: "Agendada", tone: "accent" },
  paused: { label: "Pausada", tone: "amber" },
  failed: { label: "Erro", tone: "red" },
};

export function AutomationCard({ automation }: { automation: Automation }) {
  const status = STATUS[automation.status];
  return (
    <article className="nx-card nx-card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Pill tone={status.tone} size="xs">{status.label}</Pill>
          <h2 className="mt-2 truncate font-mono text-base text-text">{automation.name}</h2>
          <p className="mt-1 text-xs leading-5 text-text-dim">{automation.purpose}</p>
        </div>
        <SourceBadge source={automation.source} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-text-faint">Projeto</dt>
          <dd className="mt-0.5 font-mono text-text">{automation.project ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Taxa de sucesso</dt>
          <dd className="mt-0.5 font-mono text-text">{automation.successRatePct.toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-text-faint">Última execução</dt>
          <dd className="mt-0.5 font-mono text-text">
            {automation.lastRunAt ? formatRelative(automation.lastRunAt) : "Sem registro"}
          </dd>
        </div>
        <div>
          <dt className="text-text-faint">Próxima</dt>
          <dd className="mt-0.5 font-mono text-text">
            {automation.nextRunAt ? formatRelative(automation.nextRunAt) : "Sob demanda"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
