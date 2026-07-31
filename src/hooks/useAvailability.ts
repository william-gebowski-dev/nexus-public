import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { AvailabilityRecord } from "@/types";

export function useAvailability() {
  return useQuery<Record<string, AvailabilityRecord[]>>({
    queryKey: ["availability"],
    queryFn: async () => (await api.availability()) as Record<string, AvailabilityRecord[]>,
    refetchInterval: REFRESH_MS,
  });
}