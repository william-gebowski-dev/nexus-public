import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { REFRESH_MS } from "@/lib/queryClient";
import type { Project } from "@/types";

/**
 * Lista de projetos do painel. Usado em /projects (página dedicada) e
 * em cards-resumo do Overview. A versão Overview consome só contagens
 * (ativos / em atenção), evitando puxar o payload cheio sem necessidade.
 */
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: api.projects,
    refetchInterval: REFRESH_MS,
  });
}
