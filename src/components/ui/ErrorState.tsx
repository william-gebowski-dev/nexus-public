import { AlertTriangle } from "lucide-react";

export function ErrorState({
  message = "Não foi possível carregar os dados.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="nx-card flex flex-col items-center justify-center gap-3 p-8 text-center border-red/40">
      <AlertTriangle className="h-6 w-6 text-red" aria-hidden />
      <h3 className="font-mono text-sm text-text">Erro ao carregar</h3>
      <p className="max-w-sm text-xs text-text-dim">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="nx-btn">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
