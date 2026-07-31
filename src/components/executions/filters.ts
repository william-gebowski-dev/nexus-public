import type { Execution } from "@/types";

export interface ExecutionFilters {
  date?: string;          // ISO YYYY-MM-DD
  status?: string;        // BlockExecutionState string
  blockId?: string;       // 1..12
  job?: string;           // substring em exec.runner (case insensitive)
  project?: string;       // substring em exec.project
  agent?: string;         // substring em exec.agent
}

export function applyExecutionFilters(
  items: readonly Execution[],
  filters: ExecutionFilters,
): Execution[] {
  const { date, status, blockId, job, project, agent } = filters;
  const jobQ = job?.toLowerCase().trim();
  const projectQ = project?.toLowerCase().trim();
  const agentQ = agent?.toLowerCase().trim();
  return items.filter((e) => {
    if (date && e.startedAt.slice(0, 10) !== date) return false;
    if (status && e.status !== status) return false;
    if (blockId) {
      // Heurística: o runner (job id) tem o formato "job-30m-NN" onde
      // NN ∈ [1..48] mapeia para bloco ((NN-1)/4)+1 com floor. Mantém
      // simples: comparamos o número do job derivado do runner.
      const match = e.runner.match(/job-30m-(\d+)/);
      if (!match) return false;
      const t = Number(match[1]);
      const blk = Math.floor((t - 1) / 4) + 1;
      if (blk !== Number(blockId)) return false;
    }
    if (jobQ && !e.runner.toLowerCase().includes(jobQ)) return false;
    if (projectQ && !(e.project ?? "").toLowerCase().includes(projectQ)) return false;
    if (agentQ && !(e.agent ?? "").toLowerCase().includes(agentQ)) return false;
    return true;
  });
}
