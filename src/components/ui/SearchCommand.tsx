import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useNavigate } from "react-router-dom";

/**
 * Command palette (Ctrl+K) — busca em projetos, serviços e agentes.
 * Resultados agrupados por categoria. Esc fecha. Navegação por teclado.
 */
export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 180);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data } = useQuery({
    queryKey: ["search", debouncedQ],
    queryFn: () => api.search(debouncedQ),
    enabled: debouncedQ.trim().length >= 2,
    staleTime: 30_000,
  });

  const groups = useMemo(
    () => [
      { key: "projects", label: "Projetos", items: data?.projects ?? [], href: (it: { id: string }) => `/projetos?id=${it.id}` },
      { key: "services", label: "Serviços", items: data?.services ?? [], href: () => "/infraestrutura" },
      { key: "agents", label: "Agentes", items: data?.agents ?? [], href: () => "/ia" },
      { key: "mcps", label: "MCPs", items: data?.mcps ?? [], href: () => "/ia" },
      { key: "skills", label: "Skills", items: data?.skills ?? [], href: () => "/ia" },
      { key: "activities", label: "Atividades", items: data?.activities ?? [], href: () => "/atividades" },
      { key: "roadmap", label: "Roadmap", items: data?.roadmap ?? [], href: () => "/roadmap" },
    ],
    [data],
  );

  const totalResults = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (!open) return null;

  const handleSelect = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/80 backdrop-blur-sm p-4 sm:p-12"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="nx-card w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Search className="h-4 w-4 text-text-dim" aria-hidden />
          <input
            autoFocus
            type="text"
            placeholder="Buscar projetos, serviços, agentes… (Ctrl+K)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar busca"
            className="text-text-dim hover:text-text"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {debouncedQ.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-xs text-text-faint">
              Digite ao menos 2 caracteres para buscar.
            </p>
          )}

          {debouncedQ.trim().length >= 2 && totalResults === 0 && (
            <p className="px-3 py-6 text-center text-xs text-text-faint">
              Nenhum resultado encontrado.
            </p>
          )}

          {groups.map((g) =>
            g.items.length > 0 ? (
              <div key={g.key} className="py-1">
                <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-text-faint">
                  {g.label}
                </div>
                {g.items.slice(0, 5).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => handleSelect(g.href(it as { id: string }))}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
                  >
                    <span className="truncate font-mono">
                      {(it as { name?: string }).name ?? (it as { title?: string }).title}
                    </span>
                    <span className="text-[10px] text-text-faint">
                      {"description" in it && typeof (it as { description?: string }).description === "string"
                        ? (it as { description: string }).description.slice(0, 40)
                        : "objective" in it && typeof (it as { objective?: string }).objective === "string"
                          ? (it as { objective: string }).objective.slice(0, 40)
                          : "purpose" in it && typeof (it as { purpose?: string }).purpose === "string"
                            ? (it as { purpose: string }).purpose.slice(0, 40)
                            : "category" in it && typeof (it as { category?: string }).category === "string"
                              ? (it as { category: string }).category
                              : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : null,
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border p-3 text-[11px] text-text-faint">
          <span>
            <kbd className="font-mono">Esc</kbd> fecha · <kbd className="font-mono">Ctrl+K</kbd> abre
          </span>
          {totalResults > 0 && <span>{totalResults} resultados</span>}
        </div>
      </div>
      <span className={cn("sr-only")} />
    </div>
  );
}
