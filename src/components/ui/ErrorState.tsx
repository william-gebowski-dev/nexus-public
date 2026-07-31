import { AlertTriangle } from "lucide-react";

/**
 * Normaliza qualquer `error` recebido (Error, string, objeto {message}, ou
 * outros) para uma string amigável. Em particular, mapeia erros de rede
 * ("Failed to fetch", TypeError) para uma mensagem de "Sem conexão".
 */
export function normalizeErrorMessage(err: unknown, fallback = "Não foi possível carregar os dados."): string {
  if (!err) return fallback;
  let raw: string;
  if (err instanceof Error) raw = err.message;
  else if (typeof err === "string") raw = err;
  else if (typeof err === "object" && err !== null && "message" in err) {
    raw = String((err as { message: unknown }).message);
  } else {
    raw = String(err);
  }
  const lower = raw.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("network request failed")) {
    return "Sem conexão — verifique sua rede.";
  }
  if (lower.includes("timeout")) return "Tempo limite esgotado — tente novamente.";
  return raw || fallback;
}

export function ErrorState({
  error,
  onRetry,
  title,
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message = normalizeErrorMessage(error);
  return (
    <div className="nx-card flex flex-col items-center justify-center gap-2 p-8 text-center">
      <AlertTriangle className="h-5 w-5 text-red" aria-hidden />
      <h3 className="font-mono text-sm text-text">{title ?? "Erro ao carregar"}</h3>
      <p className="max-w-sm text-xs text-text-dim">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="nx-btn mt-1">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
