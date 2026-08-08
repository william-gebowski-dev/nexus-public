import type {
  ArtifactKind,
  AvailabilityRecord as NexusAvailabilityRecord,
  BlockExecutionState,
  CronStatus,
  DailyReportSummary,
  Execution,
  GeneratedArtifact,
  RoutineBlock,
  RoutineDay,
  RoutineInfrastructureService,
  RoutineTask,
} from "@/types";
import { ROUTINE_BLOCKS, ROUTINE_TASKS } from "./routine-definition";

// "Hoje" dinâmico em BRT (-03:00) — antes era congelado em 2026-07-30, o
// que fazia a tarefa 37 ficar permanentemente em execução e os relatórios
// ficarem fora do relógio. Anchors derivados de mockNow() para que o
// dashboard acompanhe o calendário real quando rodando em modo mock.
function todayBRTDate(): string {
  // Intl com timeZone fixo e en-CA (YYYY-MM-DD) para evitar deriva por locale.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function nowBRTAt(hhmm: string): string {
  return `${todayBRTDate()}T${hhmm}:00-03:00`;
}

// Fallback legacy: anchors congelados só se algo realmente exigir 30/07.
// Mantidos por retrocompatibilidade com testes que possam depender deles.
// (LEGACY_NOW removido por estar sem consumidores no momento.)

export function mockNow(): string {
  return nowBRTAt("18:00");
}

const NEXT_RUN = nowBRTAt("18:30");
const LAST_RUN = mockNow();
const LAST_FAILURE = nowBRTAt("05:00");

interface TaskResultEntry {
  status: BlockExecutionState;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
  resultSummary?: string;
  artifactIds?: string[];
}

function isoTodayAt(time: string): string {
  return `${todayBRTDate()}T${time}:00-03:00`;
}

function isoTodayEnd(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + 30;
  const eh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const em = String(total % 60).padStart(2, "0");
  return `${todayBRTDate()}T${eh}:${em}:00-03:00`;
}

function buildTaskResults(): Record<string, TaskResultEntry> {
  const results: Record<string, TaskResultEntry> = {};
  const planningFailures = new Set([
    "job-30m-01",
    "job-30m-02",
    "job-30m-03",
    "job-30m-04",
  ]);
  for (const task of ROUTINE_TASKS) {
    const t = task.scheduledTime;
    if (planningFailures.has(task.id)) {
      results[task.id] = {
        status: "failed",
        startedAt: isoTodayAt(t),
        finishedAt: isoTodayEnd(t),
        durationSeconds: 30,
        resultSummary: "Falha HTTP 400 no painel juiz ao montar tool payload.",
      };
      continue;
    }
    if (task.id === "job-30m-37") {
      results[task.id] = {
        status: "running",
        startedAt: isoTodayAt(t),
        resultSummary: "Coletando estado dos projetos ativos em tempo real.",
      };
      continue;
    }
    if (task.id === "job-30m-12") {
      results[task.id] = {
        status: "failed",
        startedAt: isoTodayAt(t),
        finishedAt: isoTodayEnd(t),
        durationSeconds: 540,
        resultSummary: "Timeout na verificação de saúde do notebook Orion.",
      };
      continue;
    }
    if (task.id === "job-30m-13") {
      results[task.id] = {
        status: "partial",
        startedAt: isoTodayAt(t),
        finishedAt: isoTodayEnd(t),
        durationSeconds: 360,
        resultSummary: "Relatório de infraestrutura parcialmente montado; falta item de logs.",
      };
      continue;
    }
    if (t > "18:30") {
      results[task.id] = { status: "scheduled" };
      continue;
    }
    if (t > "18:00") {
      results[task.id] = {
        status: "scheduled",
        // Não inventar startedAt/finishedAt/durationSeconds para tarefas
        // agendadas: o status "scheduled" significa que ainda não rodaram
        // (audit E.3).
      };
      continue;
    }
    const dur = 60 + ((t.charCodeAt(0) + t.charCodeAt(1)) % 540);
    results[task.id] = {
      status: "completed",
      startedAt: isoTodayAt(t),
      finishedAt: isoTodayEnd(t),
      durationSeconds: dur,
      resultSummary: `Concluído: ${task.title}.`,
    };
  }
  return results;
}

const MOCK_RECENT_ACTIVITIES_DATA = [
  { id: "act-1", text: "9Router respondeu em 4,2 segundos.", at: LAST_RUN, state: "success" as const },
  { id: "act-2", text: "job-30m-37 iniciado às 18:00.", at: LAST_RUN, state: "running" as const },
  { id: "act-3", text: "job-30m-12 terminou com falha (timeout).", at: LAST_FAILURE, state: "error" as const },
  { id: "act-4", text: "Boletim técnico de IA consolidado no bloco 02.", at: "2026-07-30T03:30:00-03:00", state: "success" as const },
  { id: "act-5", text: "Relatório de infraestrutura parcial no bloco 03.", at: "2026-07-30T05:30:00-03:00", state: "warning" as const },
  { id: "act-6", text: "Banco de pautas atualizado no bloco 06.", at: "2026-07-30T11:30:00-03:00", state: "success" as const },
  { id: "act-7", text: "Roadmap do produto revisado no bloco 08.", at: "2026-07-30T15:30:00-03:00", state: "success" as const },
];

const MOCK_GENERATED_ARTIFACTS_DATA: GeneratedArtifact[] = [
  { id: "art-1", name: "Boletim técnico de IA", kind: "boletim", sourceJobId: "job-30m-08", createdAt: "2026-07-30T03:30:00-03:00", publicPath: "artifacts/2026-07-30/bloco-02/boletim-tecnico-ia.md", sizeBytes: 18432 },
  { id: "art-2", name: "Relatório de infraestrutura", kind: "report", sourceJobId: "job-30m-13", createdAt: "2026-07-30T05:30:00-03:00", publicPath: "artifacts/2026-07-30/bloco-03/relatorio-infraestrutura.md", sizeBytes: 9201 },
  { id: "art-3", name: "Banco de pautas do dia", kind: "pauta", sourceJobId: "job-30m-24", createdAt: "2026-07-30T11:30:00-03:00", publicPath: "artifacts/2026-07-30/bloco-06/banco-de-pautas.md", sizeBytes: 4210 },
  { id: "art-4", name: "Pauta principal do dia", kind: "content", sourceJobId: "job-30m-25", createdAt: "2026-07-30T12:30:00-03:00", publicPath: "artifacts/2026-07-30/bloco-07/pauta-principal.md", sizeBytes: 12044 },
  { id: "art-5", name: "Atualização do roadmap", kind: "roadmap", sourceJobId: "job-30m-32", createdAt: "2026-07-30T15:30:00-03:00", publicPath: "artifacts/2026-07-30/bloco-08/roadmap-produto.md", sizeBytes: 7320 },
  { id: "art-6", name: "Relatório de follow-ups", kind: "leads", sourceJobId: "job-30m-35", createdAt: "2026-07-30T17:00:00-03:00", publicPath: "artifacts/2026-07-30/bloco-09/follow-ups.md", sizeBytes: 5102 },
  { id: "art-7", name: "Estado dos projetos ativos", kind: "project-update", sourceJobId: "job-30m-37", createdAt: "2026-07-30T18:00:00-03:00", publicPath: "artifacts/2026-07-30/bloco-10/projetos-ativos.md", sizeBytes: 0 },
  { id: "art-8", name: "Relatório diário", kind: "daily-report", sourceJobId: "job-30m-46", createdAt: "2026-07-30T23:00:00-03:00", publicPath: "artifacts/2026-07-30/bloco-12/relatorio-diario.md", sizeBytes: 22110 },
];

export const MOCK_TASK_RESULTS: Record<string, TaskResultEntry> = buildTaskResults();

export const MOCK_CRON_STATUS: CronStatus = {
  gatewayRunning: true,
  gatewayPid: 80043,
  activeJobs: 48,
  totalJobs: 48,
  nextRunAt: NEXT_RUN,
  heartbeatSecondsAgo: 7,
  lastRunAt: LAST_RUN,
  lastFailureAt: LAST_FAILURE,
  provider: "custom",
  model: "9Router",
  delivery: "local",
  tickerOk: true,
};

const STATUS_PRIORITY: Record<BlockExecutionState, number> = {
  failed: 8, partial: 7, running: 6, scheduled: 5, unknown: 4,
  cancelled: 3, skipped: 2, completed: 1,
};

function aggregateStatus(states: BlockExecutionState[]): BlockExecutionState {
  let best: BlockExecutionState = "completed";
  let bestPrio = -1;
  for (const s of states) {
    const p = STATUS_PRIORITY[s];
    if (p > bestPrio) { best = s; bestPrio = p; }
  }
  return best;
}

function deepCloneTask(t: RoutineTask): RoutineTask {
  return { ...t, dependsOn: [...t.dependsOn], artifactIds: t.artifactIds ? [...t.artifactIds] : undefined };
}

function applyResultsToTask(task: RoutineTask, result: TaskResultEntry | undefined): RoutineTask {
  const cloned = deepCloneTask(task);
  if (!result) return cloned;
  cloned.status = result.status;
  if (result.startedAt) cloned.startedAt = result.startedAt;
  if (result.finishedAt) cloned.finishedAt = result.finishedAt;
  if (result.durationSeconds !== undefined) cloned.durationSeconds = result.durationSeconds;
  if (result.resultSummary) cloned.resultSummary = result.resultSummary;
  if (result.artifactIds) cloned.artifactIds = result.artifactIds;
  return cloned;
}

export function applyResults(
  blocks: readonly RoutineBlock[],
  results: Record<string, TaskResultEntry>,
): RoutineDay {
  // Conjunto de IDs de execução que existem em /executions (mock). Apenas
  // esses recebem o link "Abrir logs"; o resto fica sem executionId para
  // evitar que o card aponte para uma rota 404. Derivado das próprias
  // tasks, espelhando o filtro que MOCK_RECENT_EXECUTIONS usa logo abaixo
  // — evita dependência circular.
  const knownExecutionIds = new Set(
    ROUTINE_TASKS
      .filter((t) => t.id !== "job-30m-37")
      .filter((t) => (MOCK_TASK_RESULTS[t.id]?.status ?? t.status) === "completed")
      .map((t) => `exec-${t.id}`),
  );
  const todayBlocks: RoutineBlock[] = blocks.map((b) => {
    const tasks = b.tasks.map((t) => {
      const applied = applyResultsToTask(t, results[t.id]);
      const candidateId = `exec-${applied.id}`;
      if (knownExecutionIds.has(candidateId)) {
        applied.executionId = candidateId;
      }
      return applied;
    });
    const completedCount = tasks.filter((t) => t.status === "completed").length;
    const failedCount = tasks.filter((t) => t.status === "failed").length;
    return {
      ...b,
      tasks,
      status: aggregateStatus(tasks.map((t) => t.status)),
      completedCount,
      failedCount,
    };
  });
  const flatTasks = todayBlocks.flatMap((b) => b.tasks);
  const completedJobs = flatTasks.filter((t) => t.status === "completed").length;
  const failedJobs = flatTasks.filter((t) => t.status === "failed").length;
  const runningJobs = flatTasks.filter((t) => t.status === "running").length;
  return {
    date: todayBRTDate(),
    timezone: "America/Sao_Paulo",
    totalBlocks: 12,
    totalJobs: 48,
    completedJobs,
    failedJobs,
    runningJobs,
    nextExecutionAt: NEXT_RUN,
    blocks: todayBlocks,
    artifacts: MOCK_GENERATED_ARTIFACTS_DATA,
    recentActivities: MOCK_RECENT_ACTIVITIES_DATA,
  };
}

export const MOCK_GENERATED_ARTIFACTS: readonly GeneratedArtifact[] = MOCK_GENERATED_ARTIFACTS_DATA;

export const MOCK_ROUTINE_TODAY: RoutineDay = applyResults(ROUTINE_BLOCKS, MOCK_TASK_RESULTS);

function buildExecutionFromTask(task: RoutineTask): Execution {
  const startedAt = task.startedAt ?? isoTodayAt(task.scheduledTime);
  const durationMs = (task.durationSeconds ?? 180) * 1000;
  // partial ≠ success (audit E.4): manter a granularidade para que a UI
  // consiga mostrar resultado incompleto em vez de "OK".
  const baseStatus: Execution["status"] = task.status === "completed"
    ? "success"
    : task.status === "running"
      ? "running"
      : task.status === "failed"
        ? "failed"
        : task.status === "partial"
          ? "partial"
          : task.status === "cancelled"
            ? "cancelled"
            : "queued";
  // Extrai o número do job a partir do id (formato job-30m-NN) e calcula
  // o bloco correspondente: bloco = floor((N-1)/4) + 1, com N ∈ [1..48].
  const jobMatch = task.id.match(/^job-30m-(\d{1,2})$/);
  const jobNumber = jobMatch ? Number(jobMatch[1]) : undefined;
  const blockId = jobNumber !== undefined ? Math.floor((jobNumber - 1) / 4) + 1 : undefined;
  return {
    id: `exec-${task.id}`,
    name: task.title,
    runner: "scheduler-cron",
    jobId: jobMatch ? task.id : undefined,
    blockId,
    scheduledTime: task.scheduledTime,
    agent: "operational-agent",
    project: task.projectId,
    projectId: task.projectId,
    actionLabel: task.slot,
    startedAt,
    durationMs,
    status: baseStatus,
    summary: task.resultSummary ?? `Tarefa ${task.title} processada pelo scheduler.`,
    source: "simulated",
  };
}

export const MOCK_RECENT_EXECUTIONS: Execution[] = ROUTINE_TASKS
  .filter((t) => t.id !== "job-30m-37")
  .filter((t) => (MOCK_TASK_RESULTS[t.id]?.status ?? t.status) === "completed")
  .slice(-10)
  .map(buildExecutionFromTask);

export const MOCK_DAILY_REPORT: Record<string, DailyReportSummary> = {
  "2026-07-30": {
    date: "2026-07-30",
    scheduledJobs: 48,
    completedJobs: 30,
    failedJobs: 1,
    completeBlocks: 8,
    highlights: [
      "Boletim técnico de IA publicado no bloco 02.",
      "Banco de pautas consolidado no bloco 06.",
      "Roadmap do produto atualizado no bloco 08.",
      "Follow-ups preparados para leads qualificados no bloco 09.",
    ],
    discoveries: [
      "Nova técnica de RAG aplicável ao agente operacional.",
      "Tendência forte de perguntas sobre carreira em IA no público.",
    ],
    incidents: [
      "Timeout na verificação de saúde do notebook Orion (job-30m-12).",
      "Relatório de infraestrutura do bloco 03 saiu parcial.",
    ],
    pending: [
      "Concluir relatório de infraestrutura do bloco 03.",
      "Atualizar documentação dos projetos ativos no bloco 10.",
    ],
    humanDecisions: [
      "Validar pauta principal do bloco 07 antes de publicar.",
      "Aprovar follow-ups prioritários do bloco 09.",
      "Revisar prioridades do dia seguinte na transição do bloco 12.",
    ],
  },
};

const SPARK_24H: readonly number[] = [96, 97, 95, 96, 98, 97, 96, 95, 96, 97, 96, 96];

function buildInfra(
  id: string,
  name: string,
  version: string,
  latencyMs: number,
  availabilityPct: number,
  uptime7d: readonly boolean[],
  status: "healthy" | "attention" = "healthy",
): RoutineInfrastructureService {
  return {
    id,
    name,
    status,
    latencyMs,
    availabilityPct,
    lastCheckedAt: "2026-07-30T17:58:00-03:00",
    sparkline24h: [...SPARK_24H],
    uptime7d: [...uptime7d],
    version,
  };
}

export const MOCK_INFRASTRUCTURE: RoutineInfrastructureService[] = [
  buildInfra("notebook-orion", "Notebook Orion", "kernel 6.8.0", 18, 99.4, [true, true, true, true, true, true, true]),
  buildInfra("agente-operacional", "Agente Operacional", "v2.4.1", 42, 99.1, [true, true, true, true, true, true, true]),
  buildInfra("gateway-local", "Gateway Local", "v2.4.1", 22, 99.8, [true, true, true, true, true, true, true]),
  buildInfra("roteador-modelos", "Roteador de Modelos", "v2.4.1", 68, 99.6, [true, true, true, true, false, true, true]),
  buildInfra("docker-engine", "Docker Engine", "26.1.4", 12, 99.9, [true, true, true, true, true, true, true]),
  buildInfra("rede-privada", "Rede Privada", "1.78", 35, 99.7, [true, true, true, true, true, true, true]),
  buildInfra("modelo-local", "Modelo Local", "0.5.7", 145, 98.3, [true, false, true, true, true, true, true]),
  buildInfra("banco-dados", "Banco de Dados", "16.3", 8, 99.95, [true, true, true, true, true, true, true]),
  // Scheduler-cron em "attention" para casar com o systemStatus mock
  // (1 serviço em atenção). Audit E.5: status geral e infra discordavam.
  buildInfra("scheduler-cron", "Scheduler Cron", "v2.4.1", 5, 99.6, [true, true, true, false, true, true, true], "attention"),
  buildInfra("armazenamento-local", "Armazenamento Local", "ZFS 2.2", 11, 99.99, [true, true, true, true, true, true, true]),
];

function buildAvailability(serviceId: string, instabilityHours: readonly number[]): NexusAvailabilityRecord[] {
  const records: NexusAvailabilityRecord[] = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, "0");
    const state: NexusAvailabilityRecord["state"] = instabilityHours.includes(h) ? "instability" : "operational";
    records.push({ id: `${serviceId}-${hh}`, checkedAt: `2026-07-30T${hh}:00:00-03:00`, state });
  }
  return records;
}

export const MOCK_AVAILABILITY: Record<string, NexusAvailabilityRecord[]> = {
  "notebook-orion": buildAvailability("notebook-orion", [3]),
  "agente-operacional": buildAvailability("agente-operacional", []),
  "gateway-local": buildAvailability("gateway-local", []),
  "roteador-modelos": buildAvailability("roteador-modelos", [14]),
  "docker-engine": buildAvailability("docker-engine", []),
  "rede-privada": buildAvailability("rede-privada", []),
  "modelo-local": buildAvailability("modelo-local", [9, 17]),
  "banco-dados": buildAvailability("banco-dados", []),
  "scheduler-cron": buildAvailability("scheduler-cron", [5]),
  "armazenamento-local": buildAvailability("armazenamento-local", []),
};

export const _internalArtifactKinds: readonly ArtifactKind[] = ["report", "boletim", "study-plan", "pauta", "content", "roadmap", "leads", "project-update", "note", "daily-report"];

export type { TaskResultEntry };