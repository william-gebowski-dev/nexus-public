import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { RoutineDay } from "@/types";

export function useRoutineToday() {
  return useQuery<RoutineDay>({
    queryKey: ["routineToday"],
    queryFn: api.routineToday,
    refetchInterval: REFRESH_MS,
  });
}