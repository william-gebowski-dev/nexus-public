import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { AiUsagePeriod } from "@/types/ai-infrastructure";

export function useAiSummary(period: AiUsagePeriod = "today") {
  return useQuery({
    queryKey: ["aiSummary", period],
    queryFn: () => api.aiSummary(period),
    refetchInterval: REFRESH_MS,
  });
}

export function useAiTimeseries(metric = "tokens", period: AiUsagePeriod = "today") {
  return useQuery({
    queryKey: ["aiTimeseries", metric, period],
    queryFn: () => api.aiTimeseries(metric, period),
    refetchInterval: REFRESH_MS,
  });
}

export function useAiModels(period: AiUsagePeriod = "today") {
  return useQuery({
    queryKey: ["aiModels", period],
    queryFn: () => api.aiModels(period),
    refetchInterval: REFRESH_MS,
  });
}

export function useAiProviders(period: AiUsagePeriod = "today") {
  return useQuery({
    queryKey: ["aiProviders", period],
    queryFn: () => api.aiProviders(period),
    refetchInterval: REFRESH_MS,
  });
}

export function useAiQuotas() {
  return useQuery({
    queryKey: ["aiQuotas"],
    queryFn: () => api.aiQuotas(),
    refetchInterval: REFRESH_MS,
  });
}

export function useAiRequests(limit = 10, cursor: number | null = null) {
  return useQuery({
    queryKey: ["aiRequests", limit, cursor],
    queryFn: () => api.aiRequests(limit, cursor),
    refetchInterval: REFRESH_MS,
  });
}

export function useAiIncidents() {
  return useQuery({
    queryKey: ["aiIncidents"],
    queryFn: () => api.aiIncidents(),
    refetchInterval: REFRESH_MS,
  });
}

export function useAiTopology() {
  return useQuery({
    queryKey: ["aiTopology"],
    queryFn: () => api.aiTopology(),
    refetchInterval: REFRESH_MS,
  });
}
