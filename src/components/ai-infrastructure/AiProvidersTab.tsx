import type { AiProviderStatus, AiUsagePeriod } from "@/types/ai-infrastructure";
import type { PillTone } from "@/lib/tones";
import { useAiProviders } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { formatCostUsd } from "@/lib/format";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ShieldCheck } from "lucide-react";

export function AiProvidersTab({ period }: { period: AiUsagePeriod }) {
  const { data: providers, isLoading, isError, error, refetch } = useAiProviders(period);

  if (isLoading) return <CardSkeleton />;

  if (isError || !providers) {
    return (
      <ErrorState
        title="Não foi possível carregar os provedores de IA."
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const providerRows = providers.items;
  if (providerRows.length === 0) {
    return <EmptyState title="Sem provedores" description="Nenhum provedor reportou uso para este período." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {providerRows.map((p) => (
        <div key={p.providerId} className="nx-card flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-mono text-base font-semibold">{p.publicName}</h3>
            </div>
            <Pill tone={providerStatusTone(p.status)}>
              {translateProviderStatus(p.status)}
            </Pill>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded-lg bg-surface/50 p-2">
              <span className="text-[10px] text-text-faint uppercase block">Modelos Ativos</span>
              <span className="font-bold text-text">{p.activeModels}</span>
            </div>
            <div className="rounded-lg bg-surface/50 p-2">
              <span className="text-[10px] text-text-faint uppercase block">Requisições</span>
              <span className="font-bold text-text">{p.requests.toLocaleString("pt-BR")}</span>
            </div>
            <div className="rounded-lg bg-surface/50 p-2">
              <span className="text-[10px] text-text-faint uppercase block">Tokens Processados</span>
              <span className="font-bold text-text">{(p.totalTokens / 1_000_000).toFixed(1)}M</span>
            </div>
            <div className="rounded-lg bg-surface/50 p-2">
              <span className="text-[10px] text-text-faint uppercase block">Custo Estimado</span>
              <span className="font-bold text-text">{formatCostUsd(p.estimatedCostUsd)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-surface/30 p-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-text-faint">Autenticação:</span>
              <span className="text-emerald-400 font-semibold">{p.authStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-faint">Estado da Cota:</span>
              <span className="text-text-dim">{p.quotaStatus}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function providerStatusTone(status: AiProviderStatus): PillTone {
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

function translateProviderStatus(status: AiProviderStatus): string {
  switch (status) {
    case "operational":
      return "Disponível";
    case "attention":
      return "Atenção necessária";
    case "near_limit":
      return "Próximo do limite";
    case "exhausted":
      return "Cota esgotada";
    case "authentication_error":
      return "Erro de autenticação";
    case "payment_required":
      return "Pagamento necessário";
    case "no_access":
      return "Sem acesso";
    case "unavailable":
      return "Indisponível";
    default:
      return "Sem dados";
  }
}
