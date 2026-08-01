import { useAiTopology } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export function TopologyDiagram() {
  const { data: topology, isLoading, isError } = useAiTopology();

  if (isLoading) return <CardSkeleton />;
  if (isError || !topology) return null;

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
              <Pill tone="green">Ativo</Pill>
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
              <Pill tone="green">Operacional</Pill>
            </div>
          )}
        </div>

        {/* Step 3: Providers */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint">3. Provedores</span>
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/60 p-2.5 text-xs font-mono">
              <span>{p.name}</span>
              <Pill tone={p.status === "operational" ? "green" : "amber"}>
                {p.status === "operational" ? "Ativo" : "Atenção"}
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
              <Pill tone="neutral">OK</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
