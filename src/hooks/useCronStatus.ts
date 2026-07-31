import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { CronStatus } from "@/types";

export function useCronStatus() {
  return useQuery<CronStatus>({
    queryKey: ["cronStatus"],
    queryFn: api.cronStatus,
    refetchInterval: REFRESH_MS,
  });
}