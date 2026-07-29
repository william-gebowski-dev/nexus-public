import { QueryClient } from "@tanstack/react-query";

/**
 * Cliente do TanStack Query configurado com refresh automático de 15 min.
 * Esse é o "tick" do dashboard — toda query ativa é revalidada em segundo plano.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — antes disso, considera "fresco"
      gcTime: 30 * 60 * 1000, // 30 min — garbage collection de cache
      refetchInterval: 15 * 60 * 1000, // 15 min — sync automático
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    },
  },
});
