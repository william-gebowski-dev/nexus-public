import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AiUsagePeriod } from "@/types/ai-infrastructure";
import { useAiSummary, useAiTimeseries } from "@/hooks/useAiInfrastructure";
import { TopologyDiagram } from "./TopologyDiagram";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatCostUsd, formatLatencyMs } from "@/lib/format";

export function AiOverviewTab({ period }: { period: AiUsagePeriod }) {
  const [metric, setMetric] = useState<"tokens" | "cost" | "requests" | "latency" | "errors" | "cache">("tokens");
  const summary = useAiSummary(period);
  const timeseries = useAiTimeseries(metric, period);

  if (summary.isLoading || timeseries.isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (summary.isError || !summary.data) {
    return <ErrorState title="Não foi possível carregar a visão geral da infraestrutura de IA." error={summary.error} />;
  }

  const s = summary.data;

  return (
    <div className="space-y-6">
      {/* Indicator Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <MetricCard label="Total de Requisições" value={s.totalRequests.toLocaleString("pt-BR")} />
        <MetricCard label="Tokens de Entrada" value={`${(s.inputTokens / 1_000_000).toFixed(1)}M`} />
        <MetricCard label="Tokens em Cache" value={`${(s.cachedInputTokens / 1_000_000).toFixed(1)}M`} highlight />
        <MetricCard label="Tokens de Saída" value={`${(s.outputTokens / 1_000).toFixed(1)}k`} />
        <MetricCard label="Total de Tokens" value={`${(s.totalTokens / 1_000_000).toFixed(1)}M`} />
        <MetricCard label="Custo Estimado" value={formatCostUsd(s.estimatedCostUsd)} />
        <MetricCard label="Taxa de Erro" value={`${s.errorRatePct.toFixed(2)}%`} tone={s.errorRatePct > 1 ? "warning" : "neutral"} />
        <MetricCard label="Latência Média" value={formatLatencyMs(s.averageLatencyMs)} />
        <MetricCard label="Provedores Ativos" value={s.activeProviders.toString()} />
        <MetricCard label="Modelos Ativos" value={s.activeModels.toString()} />
      </div>

      {/* Main Chart */}
      <div className="nx-card flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div>
            <h3 className="font-mono text-sm font-semibold">Consumo e Desempenho no Período</h3>
            <p className="text-xs text-text-dim">Selecione a métrica para visualizar o histórico agregando snapshots</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-surface-hover/50 p-1 rounded-lg border border-border/50">
            {(["tokens", "cost", "requests", "latency", "errors", "cache"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors ${
                  metric === m
                    ? "bg-primary text-primary-contrast font-semibold shadow-sm"
                    : "text-text-dim hover:text-text hover:bg-surface"
                }`}
              >
                {m === "tokens"
                  ? "Tokens"
                  : m === "cost"
                  ? "Custo"
                  : m === "requests"
                  ? "Requisições"
                  : m === "latency"
                  ? "Latência"
                  : m === "errors"
                  ? "Erros"
                  : "Cache"}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area */}
        <div className="h-64 w-full">
          {timeseries.data?.points && timeseries.data.points.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries.data.points}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="bucket" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#metricGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-dim font-mono">
              Sem dados temporais disponíveis para o período selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Topologia de Roteamento */}
      <TopologyDiagram />
    </div>
  );
}

function MetricCard({
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
    <div className="nx-card flex flex-col gap-1 p-3">
      <span className="text-[11px] font-mono uppercase tracking-wider text-text-faint truncate">{label}</span>
      <span
        className={`font-mono text-lg font-bold ${
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
