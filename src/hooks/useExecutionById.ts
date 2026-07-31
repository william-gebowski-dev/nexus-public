import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { Execution } from "@/types";

export function useExecutionById(id: string) {
  return useQuery<Execution | null>({
    queryKey: ["execution", id],
    queryFn: () => api.executionById(id),
    refetchInterval: REFRESH_MS,
    enabled: !!id,
  });
}
