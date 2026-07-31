import { useState } from "react";
import { useAiRequests } from "@/hooks/useAiInfrastructure";
import { Pill } from "@/components/ui/Pill";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { Search } from "lucide-react";

export function AiRequestsTab() {
  const [cursor, setCursor] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const { data: page, isLoading } = useAiRequests(10, cursor);

  if (isLoading) return <CardSkeleton />;

  const items = (page?.items ?? []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.modelName.toLowerCase().includes(q) ||
      r.providerName.toLowerCase().includes(q) ||
      (r.clientName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <input
          type="text"
          placeholder="Filtrar requisição por ID, modelo, provedor ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="nx-card overflow-x-auto">
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
                <td className="p-3 font-bold text-primary">{r.id}</td>
                <td className="p-3 text-text-dim">
                  {new Date(r.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </td>
                <td className="p-3 text-text font-semibold">{r.modelName}</td>
                <td className="p-3 text-text-dim">{r.providerName}</td>
                <td className="p-3 text-text-dim">{r.clientName ?? "CLI Operacional"}</td>
                <td className="p-3 text-right">{r.inputTokens.toLocaleString("pt-BR")}</td>
                <td className="p-3 text-right text-emerald-400">{r.cachedTokens.toLocaleString("pt-BR")}</td>
                <td className="p-3 text-right">{r.outputTokens.toLocaleString("pt-BR")}</td>
                <td className="p-3 text-right">{r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : "-"}</td>
                <td className="p-3 text-center">
                  <Pill tone={r.status === "success" ? "green" : "amber"}>
                    {r.status === "success" ? "Sucesso" : r.errorCategory ?? "Falha"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-xs font-mono">
        <button
          type="button"
          disabled={cursor === null || cursor === 0}
          onClick={() => setCursor(0)}
          className="rounded-lg border border-border px-3 py-1.5 text-text-dim hover:text-text disabled:opacity-40"
        >
          ← Primeira página
        </button>
        <span className="text-text-faint">Exibindo últimas requisições sanitizadas</span>
        <button
          type="button"
          disabled={!page?.nextCursor}
          onClick={() => setCursor(page?.nextCursor ?? null)}
          className="rounded-lg border border-border px-3 py-1.5 text-text-dim hover:text-text disabled:opacity-40"
        >
          Próxima página →
        </button>
      </div>
    </div>
  );
}
