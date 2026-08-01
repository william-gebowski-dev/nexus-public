import { useMemo, useState } from "react";
import type { AiRequestRecord } from "@/types/ai-infrastructure";
import { useAiRequests } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Search } from "lucide-react";

type RequestStatusFilter = "all" | AiRequestRecord["status"];

const PAGE_SIZE = 10;

export function AiRequestsTab() {
  const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RequestStatusFilter>("all");
  const [provider, setProvider] = useState("all");
  const cursor = cursorStack[cursorStack.length - 1] ?? null;
  const { data: page, isLoading, isError, error, isFetching, refetch } = useAiRequests(PAGE_SIZE, cursor);

  const pageItems = page?.items ?? [];
  const providerOptions = useMemo(
    () => Array.from(new Set(pageItems.map((r) => r.providerName))).sort((a, b) => a.localeCompare(b)),
    [pageItems],
  );

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pageItems.filter((r) => {
      const matchesSearch = !q ||
        r.id.toLowerCase().includes(q) ||
        r.modelName.toLowerCase().includes(q) ||
        r.providerName.toLowerCase().includes(q) ||
        (r.clientName ?? "").toLowerCase().includes(q) ||
        (r.projectName ?? "").toLowerCase().includes(q) ||
        (r.agentName ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || r.status === status;
      const matchesProvider = provider === "all" || r.providerName === provider;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [pageItems, provider, search, status]);

  const goToFirstPage = () => setCursorStack([null]);
  const goToPreviousPage = () => setCursorStack((prev) => prev.length > 1 ? prev.slice(0, -1) : prev);
  const goToNextPage = () => {
    if (page?.nextCursor === null || page?.nextCursor === undefined) return;
    setCursorStack((prev) => [...prev, page.nextCursor]);
  };

  if (isLoading) return <CardSkeleton />;

  if (isError || !page) {
    return (
      <ErrorState
        title="Não foi possível carregar as requisições de IA."
        error={error}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-2 rounded-2xl border border-border bg-surface/40 p-3 md:grid-cols-[minmax(240px,1fr)_180px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
          <input
            type="text"
            placeholder="Filtrar por ID, modelo, provedor, cliente, projeto ou agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RequestStatusFilter)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos os estados</option>
          <option value="success">Sucesso</option>
          <option value="running">Em execução</option>
          <option value="queued">Na fila</option>
          <option value="failed">Falha</option>
          <option value="cancelled">Cancelada</option>
        </select>

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por provedor"
        >
          <option value="all">Todos os provedores</option>
          {providerOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma requisição encontrada"
          description="Ajuste os filtros ou avance para outra página de requisições sanitizadas."
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {items.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="nx-card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-border/50 bg-surface/40 text-text-faint uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">ID Público</th>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Modelo</th>
                  <th className="p-3">Provedor</th>
                  <th className="p-3">Origem / Cliente</th>
                  <th className="p-3 text-right">Entrada</th>
                  <th className="p-3 text-right">Cache</th>
                  <th className="p-3 text-right">Saída</th>
                  <th className="p-3 text-right">Duração</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-hover/50">
                    <td className="p-3 font-bold text-primary">{shortId(r.id)}</td>
                    <td className="p-3 text-text-dim">{formatTime(r.createdAt)}</td>
                    <td className="p-3 text-text font-semibold">{r.modelName}</td>
                    <td className="p-3 text-text-dim">{r.providerName}</td>
                    <td className="p-3 text-text-dim">{r.clientName ?? r.agentName ?? "Sem dados"}</td>
                    <td className="p-3 text-right">{r.inputTokens.toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-right text-emerald-400">{r.cachedTokens.toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-right">{r.outputTokens.toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-right">{formatDuration(r.durationMs)}</td>
                    <td className="p-3 text-center"><RequestStatusPill request={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex flex-col gap-2 text-xs font-mono sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={cursorStack.length === 1}
            onClick={goToFirstPage}
            className="rounded-lg border border-border px-3 py-1.5 text-text-dim hover:text-text disabled:opacity-40"
          >
            ← Primeira
          </button>
          <button
            type="button"
            disabled={cursorStack.length === 1}
            onClick={goToPreviousPage}
            className="rounded-lg border border-border px-3 py-1.5 text-text-dim hover:text-text disabled:opacity-40"
          >
            Anterior
          </button>
        </div>
        <span className="text-text-faint">
          Página {cursorStack.length} · {items.length}/{pageItems.length} exibidas{isFetching ? " · atualizando..." : ""}
        </span>
        <button
          type="button"
          disabled={page.nextCursor === null}
          onClick={goToNextPage}
          className="rounded-lg border border-border px-3 py-1.5 text-text-dim hover:text-text disabled:opacity-40"
        >
          Próxima página →
        </button>
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: AiRequestRecord }) {
  return (
    <article className="nx-card space-y-3 p-4 text-xs font-mono">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-primary">{shortId(request.id)}</p>
          <p className="mt-1 text-text font-semibold">{request.modelName}</p>
          <p className="text-text-dim">{request.providerName}</p>
        </div>
        <RequestStatusPill request={request} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-text-dim">
        <MobileMetric label="Horário" value={formatTime(request.createdAt)} />
        <MobileMetric label="Duração" value={formatDuration(request.durationMs)} />
        <MobileMetric label="Entrada" value={request.inputTokens.toLocaleString("pt-BR")} />
        <MobileMetric label="Cache" value={request.cachedTokens.toLocaleString("pt-BR")} />
        <MobileMetric label="Saída" value={request.outputTokens.toLocaleString("pt-BR")} />
        <MobileMetric label="Origem" value={request.clientName ?? request.agentName ?? "Sem dados"} />
      </div>
    </article>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface/40 p-2">
      <span className="block text-[10px] uppercase tracking-wider text-text-faint">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}

function RequestStatusPill({ request }: { request: AiRequestRecord }) {
  const tone = request.status === "success" ? "green" : request.status === "running" || request.status === "queued" ? "amber" : "neutral";
  return <Pill tone={tone}>{formatStatus(request)}</Pill>;
}

function formatStatus(request: AiRequestRecord): string {
  if (request.status === "success") return "Sucesso";
  if (request.status === "running") return "Em execução";
  if (request.status === "queued") return "Na fila";
  if (request.status === "cancelled") return "Cancelada";
  return request.errorCategory ?? "Falha";
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDuration(durationMs: number | null): string {
  return durationMs ? `${(durationMs / 1000).toFixed(1)}s` : "-";
}
