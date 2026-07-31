import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Barra de paginação cursor-based. Recebe `canPrev`/`canNext` em vez de
 * derivar do `total` (que mascara a próxima página quando total
 * reportado é o da página atual). `total` é usado apenas para a label
 * "X execuções no total".
 */
export function PaginationBar({
  page,
  pageSize,
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  page: number;            // 0-indexed
  pageSize: number;
  total: number;           // total reportado pelo backend
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <nav className="flex items-center justify-between text-xs" aria-label="Paginação">
      <p className="text-text-dim">
        Página {page + 1} · {total} execuções · {pageSize} por página
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={onPrev}
          className="nx-btn disabled:opacity-50"
        >
          <ChevronLeft className="h-3 w-3" aria-hidden /> Anterior
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="nx-btn disabled:opacity-50"
        >
          Próxima <ChevronRight className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
