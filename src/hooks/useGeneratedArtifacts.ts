import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { GeneratedArtifact } from "@/types";

export function useGeneratedArtifacts() {
  return useQuery<GeneratedArtifact[]>({
    queryKey: ["generatedArtifacts"],
    queryFn: async () => (await api.artifacts()) as GeneratedArtifact[],
    refetchInterval: REFRESH_MS,
  });
}