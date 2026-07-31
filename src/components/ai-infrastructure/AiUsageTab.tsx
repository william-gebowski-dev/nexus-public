import type { AiUsagePeriod } from "@/types/ai-infrastructure";
import { useAiModels, useAiProviders } from "@/hooks/useAiInfrastructure";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export function AiUsageTab({ period }: { period: AiUsagePeriod }) {
  const models = useAiModels(period);
  const providers = useAiProviders(period);

  if (models.isLoading || providers.isLoading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="nx-card p-5">
        <h3 className="font-mono text-sm font-semibold mb-3">Distribuição de Custo por Provedor</h3>
        <div className="space-y-3">
          {providers.data?.map((p) => (
            <div key={p.providerId} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>{p.publicName}</span>
                <span>~US$ {p.estimatedCostUsd?.toFixed(2) ?? "0.00"} ({(p.totalTokens / 1_000_000).toFixed(1)}M tokens)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, ((p.estimatedCostUsd ?? 0) / 63.04) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="nx-card p-5">
        <h3 className="font-mono text-sm font-semibold mb-3">Consumo de Tokens por Modelo</h3>
        <div className="space-y-3">
          {models.data?.map((m) => (
            <div key={m.modelId} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>{m.publicName} ({m.providerName})</span>
                <span>{((m.inputTokens + m.outputTokens) / 1_000_000).toFixed(1)}M tokens</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, (m.inputTokens / 200_000_000) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
