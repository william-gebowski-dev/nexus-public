import { useState } from "react";
import type { AiModelUsage, AiUsagePeriod } from "@/types/ai-infrastructure";
import type { PillTone } from "@/lib/tones";
import { useAiModels } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Search } from "lucide-react";

export function AiModelsTab({ period }: { period: AiUsagePeriod }) {
  const { data: models, isLoading, isError, error, refetch } = useAiModels(period);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"requests" | "cost" | "tokens" | "errors" | "latency">("requests");

  if (isLoading) return <CardSkeleton />;

  if (isError || !models) {
    return (
      <ErrorState
        title="Não foi possível carregar os modelos de IA."
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const filtered = (models ?? []).filter(
    (m) =>
      m.publicName.toLowerCase().includes(search.toLowerCase()) ||
      m.providerName.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "requests") return b.requests - a.requests;
    if (sortKey === "cost") return (b.estimatedCostUsd ?? 0) - (a.estimatedCostUsd ?? 0);
    if (sortKey === "tokens") return (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens);
    if (sortKey === "errors") return b.errorCount - a.errorCount;
    if (sortKey === "latency") return (b.averageLatencyMs ?? 0) - (a.averageLatencyMs ?? 0);
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            type="text"
            placeholder="Buscar modelo ou provedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-text-faint">Ordenar por:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-mono text-text focus:outline-none"
          >
            <option value="requests">Mais utilizado</option>
            <option value="cost">Maior custo</option>
            <option value="tokens">Maior consumo</option>
            <option value="errors">Mais erros</option>
            <option value="latency">Maior latência</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="Nenhum modelo encontrado"
          description="Ajuste a busca ou selecione outro período de uso."
        />
      ) : (
        <div className="nx-card overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="border-b border-border/50 bg-surface/40 text-text-faint uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Modelo</th>
              <th className="p-3">Provedor</th>
              <th className="p-3 text-right">Requisições</th>
              <th className="p-3 text-right">Entrada</th>
              <th className="p-3 text-right">Cache</th>
              <th className="p-3 text-right">Saída</th>
              <th className="p-3 text-right">Custo Est.</th>
              <th className="p-3 text-right">Erros</th>
              <th className="p-3 text-right">Latência</th>
              <th className="p-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sorted.map((m) => (
              <tr key={m.modelId} className="hover:bg-surface-hover/50">
                <td className="p-3 font-semibold text-text">{m.publicName}</td>
                <td className="p-3 text-text-dim">{m.providerName}</td>
                <td className="p-3 text-right">{m.requests.toLocaleString("pt-BR")}</td>
                <td className="p-3 text-right">{(m.inputTokens / 1_000_000).toFixed(1)}M</td>
                <td className="p-3 text-right text-emerald-400">{(m.cachedTokens / 1_000_000).toFixed(1)}M</td>
                <td className="p-3 text-right">{(m.outputTokens / 1_000).toFixed(1)}k</td>
                <td className="p-3 text-right">~US$ {m.estimatedCostUsd?.toFixed(2) ?? "0.00"}</td>
                <td className={`p-3 text-right ${m.errorCount > 0 ? "text-amber-400 font-bold" : "text-text-faint"}`}>
                  {m.errorCount}
                </td>
                <td className="p-3 text-right">{m.averageLatencyMs ?? 0} ms</td>
                <td className="p-3 text-center">
                  <Pill tone={modelStatusTone(m.status)}>
                    {modelStatusLabel(m.status)}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

function modelStatusTone(status: AiModelUsage["status"]): PillTone {
  if (status === "operational") return "green";
  if (status === "attention") return "amber";
  if (status === "unavailable") return "red";
  return "neutral";
}

function modelStatusLabel(status: AiModelUsage["status"]): string {
  switch (status) {
    case "operational":
      return "Disponível";
    case "attention":
      return "Atenção";
    case "unavailable":
      return "Indisponível";
    default:
      return "Sem dados";
  }
}
