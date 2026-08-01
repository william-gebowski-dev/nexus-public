import type { AiTopologyNode } from "@/types/ai-infrastructure";
import type { PillTone } from "@/lib/tones";
import { useAiTopology } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

type TopologyStatus = AiTopologyNode["status"];

export function TopologyDiagram() {
  const { data: topology, isLoading, isError, error, refetch } = useAiTopology();

  if (isLoading) return <CardSkeleton />;
  if (isError || !topology) {
    return (
      <ErrorState
        title="Não foi possível carregar a topologia de IA."
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (topology.nodes.length === 0) {
    return <EmptyState title="Sem topologia" description="Nenhum nó de roteamento foi reportado pelo coletor." />;
  }

  const tools = topology.nodes.filter((n) => n.type === "tool");
  const router = topology.nodes.find((n) => n.type === "router");
  const providers = topology.nodes.filter((n) => n.type === "provider");
  const models = topology.nodes.filter((n) => n.type === "model");

  return (
    <div className="nx-card flex flex-col gap-4 p-5">
      <div>
        <h3 className="font-mono text-sm font-semibold">Topologia de Roteamento</h3>
        <p className="text-xs text-text-dim">Fluxo simplificado: Ferramentas → 9Router → Provedores → Modelos</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-center">
        {/* Step 1: Tools */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint">1. Clientes / Ferramentas</span>
          {tools.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/60 p-2.5 text-xs font-mono">
              <span>{t.name}</span>
              <Pill tone={statusTone(t.status)}>{statusLabel(t.status)}</Pill>
            </div>
          ))}
        </div>

        {/* Step 2: 9Router */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint text-center">2. Engine de Roteamento</span>
          {router && (
            <div className="flex flex-col gap-1 items-center justify-center rounded-xl border-2 border-primary/40 bg-primary/10 p-4 text-center">
              <span className="font-mono text-sm font-bold text-primary">{router.name}</span>
              <span className="text-[11px] text-text-dim font-mono">Porta 20128</span>
              <Pill tone={statusTone(router.status)}>{statusLabel(router.status)}</Pill>
            </div>
          )}
        </div>

        {/* Step 3: Providers */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint">3. Provedores</span>
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/60 p-2.5 text-xs font-mono">
              <span>{p.name}</span>
              <Pill tone={statusTone(p.status)}>
                {statusLabel(p.status)}
              </Pill>
            </div>
          ))}
        </div>

        {/* Step 4: Models */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint">4. Modelos Target</span>
          {models.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/60 p-2.5 text-xs font-mono">
              <span className="truncate">{m.name}</span>
              <Pill tone={statusTone(m.status)}>{statusLabel(m.status)}</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusTone(status: TopologyStatus): PillTone {
  if (status === "operational") return "green";
  if (status === "attention" || status === "near_limit") return "amber";
  if (
    status === "exhausted" ||
    status === "authentication_error" ||
    status === "payment_required" ||
    status === "no_access" ||
    status === "unavailable"
  ) {
    return "red";
  }
  return "neutral";
}

function statusLabel(status: TopologyStatus): string {
  switch (status) {
    case "operational":
      return "Operacional";
    case "attention":
      return "Atenção";
    case "near_limit":
      return "Limite próximo";
    case "exhausted":
      return "Esgotado";
    case "authentication_error":
      return "Auth inválida";
    case "payment_required":
      return "Pagamento";
    case "no_access":
      return "Sem acesso";
    case "unavailable":
      return "Indisponível";
    default:
      return "Sem dados";
  }
}
