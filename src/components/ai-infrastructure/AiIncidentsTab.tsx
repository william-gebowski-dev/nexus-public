import { useAiIncidents } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

export function AiIncidentsTab() {
  const { data: incidents, isLoading, isError, error, refetch } = useAiIncidents();

  if (isLoading) return <CardSkeleton />;

  if (isError || !incidents) {
    return (
      <ErrorState
        title="Não foi possível carregar os incidentes de IA."
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs font-mono text-amber-300">
        📌 <strong>Nota de segurança:</strong> A visualização de incidentes nesta versão pública é somente leitura.
      </div>

      <div className="space-y-3">
        {incidents.length === 0 && (
          <EmptyState title="Sem incidentes" description="Nenhum incidente foi reportado para a infraestrutura de IA." />
        )}
        {incidents.map((inc) => (
          <div key={inc.id} className="nx-card flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                {inc.severity === "critical" ? (
                  <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
                ) : inc.severity === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                ) : (
                  <Info className="h-5 w-5 text-blue-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-mono text-sm font-semibold">{inc.title}</h3>
                  <span className="text-xs text-text-dim font-mono">
                    Primeira ocorrência: {new Date(inc.firstSeenAt).toLocaleString("pt-BR")} · Ocorrências: {inc.occurrences}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Pill tone={inc.severity === "critical" ? "red" : "neutral"}>
                  {inc.severity.toUpperCase()}
                </Pill>
                <Pill tone={inc.status === "open" ? "amber" : "green"}>
                  {inc.status === "open" ? "Aberto" : "Resolvido"}
                </Pill>
              </div>
            </div>

            <p className="text-xs font-mono text-text">{inc.summary}</p>

            {inc.suggestedAction && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs font-mono text-primary">
                <strong>Próxima ação sugerida:</strong> {inc.suggestedAction}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
