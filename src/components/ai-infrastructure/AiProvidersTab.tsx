import type { AiProviderStatus, AiUsagePeriod } from "@/types/ai-infrastructure";
import { useAiProviders } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ShieldCheck } from "lucide-react";

export function AiProvidersTab({ period }: { period: AiUsagePeriod }) {
  const { data: providers, isLoading } = useAiProviders(period);

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {providers?.map((p) => (
        <div key={p.providerId} className="nx-card flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-mono text-base font-semibold">{p.publicName}</h3>
            </div>
            <Pill tone={p.status === "operational" ? "green" : p.status === "near_limit" ? "amber" : "neutral"}>
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
              <span className="font-bold text-text">~US$ {p.estimatedCostUsd?.toFixed(2) ?? "0.00"}</span>
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
