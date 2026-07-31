import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useNavigate } from "react-router-dom";
import { restoreFocus, useRememberFocus } from "@/lib/focus";

/**
 * Command palette (Ctrl+K) — busca em projetos, serviços, agentes, MCPs,
 * skills, atividades e itens do roadmap.
 *
 * a11y: navegação por teclado (ArrowUp/Down, Enter, Home, End, Esc),
 * `aria-selected` no item ativo, foco de retorno ao botão de origem.
 */
export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQ = useDebounce(q, 180);
  const navigate = useNavigate();
  const previousFocusRef = useRememberFocus(open);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange, open]);

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
      { key: "agents", label: "Agentes", items: data?.agents ?? [], href: () => "/agentes" },
      { key: "mcps", label: "MCPs", items: data?.mcps ?? [], href: () => "/mcps" },
      { key: "skills", label: "Skills", items: data?.skills ?? [], href: () => "/skills" },
      { key: "automations", label: "Automações", items: data?.automations ?? [], href: () => "/automacoes" },
      { key: "activities", label: "Atividades", items: data?.activities ?? [], href: () => "/atividades" },
      { key: "roadmap", label: "Roadmap", items: data?.roadmap ?? [], href: () => "/roadmap" },
    ],
    [data],
  );

  // Lista flat de items para suportar navegação por setas que cruza grupos.
  const flatItems = useMemo(() => {
    const out: Array<{ groupKey: string; href: string; item: unknown }> = [];
    for (const g of groups) {
      for (const it of g.items.slice(0, 5)) {
        out.push({ groupKey: g.key, href: g.href(it as { id: string }), item: it });
      }
    }
    return out;
  }, [groups]);

  const totalResults = flatItems.length;

  // Reseta seleção sempre que o conjunto de resultados muda.
  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQ]);

  // Move o foco DOM quando o índice ativo muda por teclado.
  useEffect(() => {
    if (!open) return;
    const el = itemRefs.current[activeIndex];
    if (el) el.focus();
  }, [activeIndex, open]);

  const close = () => {
    onOpenChange(false);
    setQ("");
    setActiveIndex(0);
    restoreFocus(previousFocusRef);
  };

  const handleSelect = (href: string) => {
    navigate(href);
    onOpenChange(false);
    setQ("");
    setActiveIndex(0);
    restoreFocus(previousFocusRef);
  };

  // Atalhos de teclado quando o input está focado.
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalResults > 0) {
        setActiveIndex((i) => (i + 1) % totalResults);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalResults > 0) {
        setActiveIndex((i) => (i - 1 + totalResults) % totalResults);
      }
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      if (totalResults > 0) setActiveIndex(totalResults - 1);
      return;
    }
    if (e.key === "Enter" && totalResults > 0) {
      e.preventDefault();
      const sel = flatItems[activeIndex];
      if (sel) handleSelect(sel.href);
      return;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/80 backdrop-blur-sm p-4 sm:p-12"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar no painel"
      aria-labelledby="nx-search-input"
      onClick={() => close()}
    >
      <div
        className="nx-card w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Search className="h-4 w-4 text-text-dim" aria-hidden />
          <input
            ref={inputRef}
            id="nx-search-input"
            autoFocus
            type="text"
            placeholder="Buscar projetos, serviços, agentes… (Ctrl+K)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKeyDown}
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
          />
          <button
            type="button"
            onClick={() => close()}
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
              <div key={g.key} className="py-1" role="group" aria-label={g.label}>
                <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-text-faint">
                  {g.label}
                </div>
                {g.items.slice(0, 5).map((it) => {
                  const flatIdx = flatItems.findIndex((f) => f.item === it);
                  const isActive = flatIdx === activeIndex;
                  return (
                    <button
                      key={it.id}
                      ref={(el) => {
                        itemRefs.current[flatIdx] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSelect(g.href(it as { id: string }))}
                      onFocus={() => setActiveIndex(flatIdx)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-text",
                        isActive ? "bg-surface-hover" : "hover:bg-surface-hover",
                      )}
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
                  );
                })}
              </div>
            ) : null,
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border p-3 text-[11px] text-text-faint">
          <span>
            <kbd className="nx-kbd">Esc</kbd> fecha · <kbd className="nx-kbd">Ctrl+K</kbd> abre
          </span>
          {totalResults > 0 && <span>{totalResults} resultados</span>}
        </div>
      </div>
    </div>
  );
}
