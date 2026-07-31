import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function KnowledgeSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="nx-card flex items-center gap-3 p-3">
      <Search className="h-4 w-4 text-text-dim" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filtrar seções pelo título ou resumo…"
        aria-label="Filtrar seções do documento de conhecimento"
        className={cn(
          "flex-1 bg-transparent text-sm text-text outline-none",
          "placeholder:text-text-faint",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="text-text-dim hover:text-text"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
