import type { AiUsagePeriod } from "@/types/ai-infrastructure";
import { useAiModels, useAiProviders } from "@/hooks/useAiInfrastructure";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export function AiUsageTab({ period }: { period: AiUsagePeriod }) {
  const models = useAiModels(period);
  const providers = useAiProviders(period);

  if (models.isLoading || providers.isLoading) return <CardSkeleton />;

  if (models.isError || providers.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar o uso de IA."
        error={models.error ?? providers.error}
        onRetry={() => {
          void models.refetch();
          void providers.refetch();
        }}
      />
    );
  }

  const providerRows = providers.data?.items ?? [];
  const modelRows = models.data?.items ?? [];
  const totalProviderCost = providerRows.reduce((sum, p) => sum + (p.estimatedCostUsd ?? 0), 0);
  const maxModelTokens = Math.max(0, ...modelRows.map((m) => m.inputTokens + m.outputTokens));

  return (
    <div className="space-y-6">
      <div className="nx-card p-5">
        <h3 className="font-mono text-sm font-semibold mb-3">Distribuição de Custo por Provedor</h3>
        <div className="space-y-3">
          {providerRows.length === 0 && (
            <EmptyState title="Sem custos por provedor" description="Nenhum provedor reportou uso para este período." />
          )}
          {providerRows.map((p) => {
            const costPct = totalProviderCost > 0 ? ((p.estimatedCostUsd ?? 0) / totalProviderCost) * 100 : 0;
            return (
              <div key={p.providerId} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>{p.publicName}</span>
                  <span>~US$ {p.estimatedCostUsd?.toFixed(2) ?? "0.00"} ({(p.totalTokens / 1_000_000).toFixed(1)}M tokens)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, costPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nx-card p-5">
        <h3 className="font-mono text-sm font-semibold mb-3">Consumo de Tokens por Modelo</h3>
        <div className="space-y-3">
          {modelRows.length === 0 && (
            <EmptyState title="Sem consumo por modelo" description="Nenhum modelo reportou tokens para este período." />
          )}
          {modelRows.map((m) => {
            const totalTokens = m.inputTokens + m.outputTokens;
            const tokenPct = maxModelTokens > 0 ? (totalTokens / maxModelTokens) * 100 : 0;
            return (
              <div key={m.modelId} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>{m.publicName} ({m.providerName})</span>
                  <span>{(totalTokens / 1_000_000).toFixed(1)}M tokens</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.min(100, tokenPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
