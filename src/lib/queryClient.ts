import { QueryClient } from "@tanstack/react-query";

/**
 * Cliente do TanStack Query configurado com refresh automático.
 * Esse é o "tick" do dashboard — toda query ativa é revalidada em segundo plano.
 */

/** Intervalo de refresh automático em ms — fonte única da verdade. */
export const REFRESH_MS = 15 * 60 * 1000;

/** Rótulo amigável do intervalo (para SourceBadge, Topbar, Overview). */
export const REFRESH_LABEL = `${REFRESH_MS / 60 / 1000} min`;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — antes disso, considera "fresco"
      gcTime: 30 * 60 * 1000, // 30 min — garbage collection de cache
      refetchInterval: REFRESH_MS, // sync automático
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    },
  },
});
