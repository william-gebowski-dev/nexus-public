import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { DailyReportSummary } from "@/types";

export function useDailyReport(date: string) {
  return useQuery<DailyReportSummary>({
    queryKey: ["dailyReport", date],
    queryFn: async () => (await api.dailyReport(date)) as DailyReportSummary,
    refetchInterval: REFRESH_MS,
  });
}