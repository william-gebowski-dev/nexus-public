import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationBar({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;            // 0-indexed
  pageSize: number;
  total: number;           // total de itens no conjunto
  onChange: (nextPage: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 0;
  const canNext = page < pages - 1;
  return (
    <nav className="flex items-center justify-between text-xs" aria-label="Paginação">
      <p className="text-text-dim">
        Página {page + 1} de {pages} · {total} execuções
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onChange(page - 1)}
          className="nx-btn disabled:opacity-50"
        >
          <ChevronLeft className="h-3 w-3" aria-hidden /> Anterior
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onChange(page + 1)}
          className="nx-btn disabled:opacity-50"
        >
          Próxima <ChevronRight className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
