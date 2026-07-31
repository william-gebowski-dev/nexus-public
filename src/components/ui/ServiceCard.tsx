import type { Service } from "@/types";
import { formatPercent, formatDuration } from "@/lib/format";
import { Sparkline } from "@/components/charts/Sparkline";
import { UptimeBar } from "@/components/charts/UptimeBar";
import { SourceBadge } from "./SourceBadge";
import { Pill } from "./Pill";
import type { PillTone } from "@/lib/tones";

const STATUS_LABEL: Record<Service["status"], { label: string; tone: PillTone }> = {
  healthy: { label: "Operacional", tone: "green" },
  attention: { label: "Atenção", tone: "amber" },
  down: { label: "Indisponível", tone: "red" },
};

const CATEGORY_LABEL: Record<Service["category"], string> = {
  vps: "VPS",
  cloud: "Cloud",
  docker: "Docker",
  containers: "Containers",
  tailscale: "Rede privada",
  "rede-privada": "Rede privada",
  web: "Web",
  database: "Banco de dados",
  api: "API",
  bot: "Bot",
  automation: "Automação",
  ai: "IA",
};

export function ServiceCard({ service }: { service: Service }) {
  const status = STATUS_LABEL[service.status];
  return (
    <div className="nx-card nx-card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-faint">
            <span>{CATEGORY_LABEL[service.category]}</span>
            <span aria-hidden>·</span>
            <Pill tone={status.tone} size="xs">{status.label}</Pill>
          </div>
          <h3 className="mt-1 truncate font-mono text-base text-text">{service.name}</h3>
          <p className="mt-1 text-xs text-text-dim">{service.description}</p>
        </div>
        <SourceBadge source={service.source} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-text-faint">Latência</div>
          <div className="mt-0.5 font-mono text-sm text-text">{formatDuration(service.latencyMs)}</div>
        </div>
        <div>
          <div className="text-text-faint">Disponibilidade</div>
          <div className="mt-0.5 font-mono text-sm text-text">{formatPercent(service.availabilityPct)}</div>
        </div>
        <div>
          <div className="text-text-faint">7d</div>
          <div className="mt-0.5">
            <UptimeBar days={service.uptime7d} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-text-faint">
          Última verificação: {new Date(service.lastCheckedAt).toLocaleTimeString("pt-BR")}
        </div>
        <Sparkline
          values={service.sparkline24h}
          tone={
            service.status === "healthy"
              ? "green"
              : service.status === "attention"
                ? "amber"
                : "red"
          }
        />
      </div>
    </div>
  );
}
