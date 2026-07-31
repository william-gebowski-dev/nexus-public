import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { Execution } from "@/types";
import type { Page } from "@/lib/api";

export function useRecentExecutions(limit = 10, cursor: number | null = null) {
  return useQuery<Page<Execution>>({
    queryKey: ["recentExecutions", limit, cursor],
    queryFn: () => api.recentExecutions(limit, cursor),
    refetchInterval: REFRESH_MS,
  });
}