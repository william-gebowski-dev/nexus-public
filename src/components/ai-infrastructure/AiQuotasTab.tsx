import { useAiQuotas } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Gauge } from "lucide-react";

export function AiQuotasTab() {
  const { data: quotas, isLoading, isError, error, refetch } = useAiQuotas();

  if (isLoading) return <CardSkeleton />;

  if (isError || !quotas) {
    return (
      <ErrorState
        title="Não foi possível carregar as cotas de IA."
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const quotaRows = quotas.items;
  if (quotaRows.length === 0) {
    return <EmptyState title="Sem cotas" description="Nenhuma cota foi reportada pelos provedores." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {quotaRows.map((q) => {
        const remaining = q.remainingPct;
        const used = q.usedPct ?? (remaining !== null ? 100 - remaining : null);
        const tone =
          remaining === null
            ? "neutral"
            : remaining > 50
            ? "green"
            : remaining >= 20
            ? "neutral"
            : remaining >= 5
            ? "amber"
            : "red";

        return (
          <div key={q.id} className="nx-card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-mono text-sm font-semibold">{q.providerName}</h3>
                  <span className="text-xs text-text-dim font-mono">{q.quotaType}</span>
                </div>
              </div>
              <Pill tone={tone}>
                {remaining !== null ? `${remaining}% restante` : "Não informada"}
              </Pill>
            </div>

            {/* Progress Bar */}
            {remaining !== null ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-text-dim">
                  <span>Utilizado: {used}%</span>
                  <span>Restante: {remaining}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className={`h-full ${
                      remaining > 50
                        ? "bg-emerald-500"
                        : remaining >= 20
                        ? "bg-blue-500"
                        : remaining >= 5
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${used ?? 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border/40 bg-surface/30 p-3 text-center text-xs font-mono text-text-faint">
                Cota não informada pelo provedor
              </div>
            )}

            <p className="text-xs text-text-dim font-mono">{q.message}</p>
          </div>
        );
      })}
    </div>
  );
}
