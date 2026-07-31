import { useParams, Link } from "react-router-dom";
import { useExecutionById } from "@/hooks/useExecutionById";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { EXECUTION_STATUS } from "@/components/executions/ExecutionStatus";
import { formatDateTime, formatDuration } from "@/lib/format";

export function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const exec = useExecutionById(id ?? "");

  if (!id) return <EmptyState title="Sem id" description="A rota precisa de /:id." />;
  if (exec.isLoading) return <CardSkeleton />;
  if (exec.isError)
    return <ErrorState error={exec.error} onRetry={() => void exec.refetch()} />;
  if (!exec.data)
    return (
      <EmptyState
        title="Execução não encontrada"
        description={`Nenhum dado para '${id}'.`}
      />
    );

  const status = EXECUTION_STATUS[exec.data.status];
  return (
    <div className="space-y-6">
      <Link to="/executions" className="text-xs text-link hover:underline">
        ← Voltar às execuções
      </Link>
      <PageHeader
        title={exec.data.name}
        subtitle={exec.data.summary}
        actions={<Pill tone={status.tone}>{status.label}</Pill>}
      />

      <dl className="nx-card grid gap-3 sm:grid-cols-2 md:grid-cols-3 p-5 text-sm">
        <Field label="Job" value={exec.data.runner} />
        <Field label="Projeto" value={exec.data.project ?? "—"} />
        <Field label="Agente" value={exec.data.agent ?? "—"} />
        <Field label="Início" value={formatDateTime(exec.data.startedAt)} />
        <Field label="Duração" value={formatDuration(exec.data.durationMs)} />
        <Field label="Estado" value={exec.data.status} />
      </dl>

      <p className="nx-card p-5 text-sm text-text-dim">
        Logs detalhados e conteúdo integral ficam disponíveis em uma
        versão futura; esta página mostra apenas o resumo operacional.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-faint text-[10px] uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 font-mono text-xs text-text">{value}</dd>
    </div>
  );
}
