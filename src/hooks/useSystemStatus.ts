import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { NexusSystemStatus } from "@/types";

export function useSystemStatus() {
  return useQuery<NexusSystemStatus>({
    queryKey: ["systemStatus"],
    queryFn: api.systemStatus,
    refetchInterval: REFRESH_MS,
  });
}