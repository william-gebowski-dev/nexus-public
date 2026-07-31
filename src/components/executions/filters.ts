import type { Execution } from "@/types";

export interface ExecutionFilters {
  date?: string;          // ISO YYYY-MM-DD
  status?: string;        // BlockExecutionState string
  blockId?: string;       // 1..12
  job?: string;           // substring em exec.jobId (ex.: "job-30m-12")
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
    // blockId e jobId são campos estruturados no contrato; nada de regex
    // em `runner` (que continua sendo o nome do agente/automação).
    if (blockId) {
      if (e.blockId !== Number(blockId)) return false;
    }
    if (jobQ) {
      const target = (e.jobId ?? "").toLowerCase();
      if (!target.includes(jobQ)) return false;
    }
    if (projectQ && !(e.project ?? "").toLowerCase().includes(projectQ)) return false;
    if (agentQ && !(e.agent ?? "").toLowerCase().includes(agentQ)) return false;
    return true;
  });
}
