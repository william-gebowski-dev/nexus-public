import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { InfrastructureService } from "@/types";

export function useInfrastructureStatus() {
  return useQuery<InfrastructureService[]>({
    queryKey: ["infrastructureStatus"],
    queryFn: async () => (await api.infrastructure()) as InfrastructureService[],
    refetchInterval: REFRESH_MS,
  });
}