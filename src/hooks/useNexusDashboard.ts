import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";

export function useNexusDashboard() {
  const status = useQuery({ queryKey: ["status"], queryFn: api.systemStatus, refetchInterval: REFRESH_MS });
  const services = useQuery({ queryKey: ["services"], queryFn: api.services, refetchInterval: REFRESH_MS });
  const activities = useQuery({ queryKey: ["activities", 10, 0], queryFn: () => api.activities(10, 0), refetchInterval: REFRESH_MS });
  const executions = useQuery({ queryKey: ["executions", 10, 0], queryFn: () => api.executions(10, 0), refetchInterval: REFRESH_MS });
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.projects, refetchInterval: REFRESH_MS });

  const isLoading = status.isLoading || services.isLoading || activities.isLoading || executions.isLoading || projects.isLoading;
  const isFetching = status.isFetching || services.isFetching || activities.isFetching || executions.isFetching || projects.isFetching;
  const hasError = status.isError || services.isError || activities.isError || executions.isError || projects.isError;

  return { status, services, activities, executions, projects, isLoading, isFetching, hasError };
}
