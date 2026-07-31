import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Zap } from "lucide-react";
import { useAiSummary } from "@/hooks/useAiInfrastructure";
import { ROUTES } from "@/lib/routes";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export function AiInfrastructureTeaser() {
  const { data: summary, isLoading, isError } = useAiSummary("today");

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !summary) {
    return (
      <div className="nx-card border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
        Sem dados recentes da infraestrutura de IA
      </div>
    );
  }

  const isOperational = summary.failedRequests === 0 || summary.errorRatePct < 2;

  return (
    <section className="nx-card flex flex-col gap-4 p-5 transition-all hover:border-primary/40">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-semibold tracking-tight">Infraestrutura de IA</h2>
            <p className="text-xs text-text-dim">Observabilidade de roteamento e consumo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Pill tone={isOperational ? "green" : "amber"}>
            {isOperational ? "Operacional" : "Atenção necessária"}
          </Pill>
          <Link
            to={ROUTES.aiInfrastructure}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Abrir observabilidade de IA
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile
          label="Requisições hoje"
          value={summary.totalRequests.toLocaleString("pt-BR")}
        />
        <MetricTile
          label="Tokens processados"
          value={`${(summary.inputTokens / 1_000_000).toFixed(1)}M`}
        />
        <MetricTile
          label="Cache aproveitado"
          value={`${summary.cacheRatePct.toFixed(1)}%`}
          highlight
        />
        <MetricTile
          label="Tokens de saída"
          value={`${(summary.outputTokens / 1_000).toFixed(1)}k`}
        />
        <MetricTile
          label="Custo estimado"
          value={`~US$ ${summary.estimatedCostUsd?.toFixed(2) ?? "0.00"}`}
        />
        <MetricTile
          label="Erros recentes"
          value={summary.failedRequests.toString()}
          tone={summary.failedRequests > 0 ? "warning" : "neutral"}
        />
      </div>

      {/* Footer Details */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface/60 px-3 py-2 text-xs text-text-dim border border-border/40 font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Modelo mais usado: <strong className="text-text font-semibold">{summary.mostUsedModel ?? "N/A"}</strong>
          </span>
          <span>
            Provedor mais usado: <strong className="text-text font-semibold">{summary.mostUsedProvider ?? "N/A"}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-text-faint text-[11px]">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Última requisição: há 52 segundos</span>
        </div>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  highlight = false,
  tone = "neutral",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border/40 bg-surface/40 p-2.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint truncate">{label}</span>
      <span
        className={`font-mono text-base font-semibold ${
          highlight
            ? "text-emerald-400"
            : tone === "warning"
            ? "text-amber-400"
            : "text-text"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
