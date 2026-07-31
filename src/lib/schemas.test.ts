import { describe, it, expect } from "vitest";
import {
  CronStatusSchema,
  ExecutionSchema,
  GeneratedArtifactSchema,
  RoutineDaySchema,
  NexusSystemStatusSchema,
  InfrastructureServiceSchema,
  NEXUS_API_SCHEMAS,
} from "./schemas";
import {
  MOCK_CRON_STATUS,
  MOCK_ROUTINE_TODAY,
  MOCK_RECENT_EXECUTIONS,
  MOCK_GENERATED_ARTIFACTS,
} from "@/data/mock-routine";

describe("CronStatusSchema", () => {
  it("aceita o mock canônico", () => {
    expect(CronStatusSchema.safeParse(MOCK_CRON_STATUS).success).toBe(true);
  });

  it("rejeita totalJobs diferente de 48", () => {
    const bad = { ...MOCK_CRON_STATUS, totalJobs: 12 };
    expect(CronStatusSchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita provider diferente de 'custom'", () => {
    const bad = { ...MOCK_CRON_STATUS, provider: "openai" };
    expect(CronStatusSchema.safeParse(bad).success).toBe(false);
  });
});

describe("ExecutionSchema", () => {
  it("aceita o mock", () => {
    expect(ExecutionSchema.safeParse(MOCK_RECENT_EXECUTIONS[0]).success).toBe(true);
  });

  it("rejeita status fora do enum", () => {
    const bad = { ...MOCK_RECENT_EXECUTIONS[0], status: "explodiu" };
    expect(ExecutionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita durationMs negativo", () => {
    const bad = { ...MOCK_RECENT_EXECUTIONS[0], durationMs: -5 };
    expect(ExecutionSchema.safeParse(bad).success).toBe(false);
  });
});

describe("GeneratedArtifactSchema", () => {
  it("aceita o mock", () => {
    expect(GeneratedArtifactSchema.safeParse(MOCK_GENERATED_ARTIFACTS[0]).success).toBe(true);
  });

  it("rejeita kind fora do enum", () => {
    const bad = { ...MOCK_GENERATED_ARTIFACTS[0], kind: "post-de-blog" };
    expect(GeneratedArtifactSchema.safeParse(bad).success).toBe(false);
  });
});

describe("RoutineDaySchema", () => {
  it("aceita o mock canônico (12 blocos × 4 tarefas)", () => {
    expect(RoutineDaySchema.safeParse(MOCK_ROUTINE_TODAY).success).toBe(true);
  });

  it("rejeita totalBlocks diferente de 12", () => {
    const bad = { ...MOCK_ROUTINE_TODAY, totalBlocks: 10 };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita timezone diferente de America/Sao_Paulo", () => {
    const bad = { ...MOCK_ROUTINE_TODAY, timezone: "UTC" as const };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita bloco com tasks.length != 4", () => {
    const bad = {
      ...MOCK_ROUTINE_TODAY,
      blocks: MOCK_ROUTINE_TODAY.blocks.map((b, i) =>
        i === 0 ? { ...b, tasks: b.tasks.slice(0, 3) } : b,
      ),
    };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita routineDay com blocks.length != 12", () => {
    const bad = { ...MOCK_ROUTINE_TODAY, blocks: MOCK_ROUTINE_TODAY.blocks.slice(0, 10) };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita blocos com id duplicado", () => {
    const bad = {
      ...MOCK_ROUTINE_TODAY,
      blocks: MOCK_ROUTINE_TODAY.blocks.map((block, index) =>
        index === 1 ? { ...block, id: 1 } : block,
      ),
    };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita tarefa cujo blockId não coincide com o bloco pai", () => {
    const bad = {
      ...MOCK_ROUTINE_TODAY,
      blocks: MOCK_ROUTINE_TODAY.blocks.map((block, index) =>
        index === 0
          ? {
              ...block,
              tasks: block.tasks.map((task, taskIndex) =>
                taskIndex === 0 ? { ...task, blockId: 2 } : task,
              ),
            }
          : block,
      ),
    };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita job ids duplicados na rotina", () => {
    const firstJobId = MOCK_ROUTINE_TODAY.blocks[0].tasks[0].id;
    const bad = {
      ...MOCK_ROUTINE_TODAY,
      blocks: MOCK_ROUTINE_TODAY.blocks.map((block, index) =>
        index === 1
          ? {
              ...block,
              tasks: block.tasks.map((task, taskIndex) =>
                taskIndex === 0 ? { ...task, id: firstJobId } : task,
              ),
            }
          : block,
      ),
    };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita jobId fora do padrão job-30m-01..48", () => {
    const bad = {
      ...MOCK_ROUTINE_TODAY,
      blocks: MOCK_ROUTINE_TODAY.blocks.map((block) => ({
        ...block,
        tasks: block.tasks.map((task) => ({ ...task, id: "job-30m-99" })),
      })),
    };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita scheduledTime fora do padrão HH:00|HH:30", () => {
    const bad = {
      ...MOCK_ROUTINE_TODAY,
      blocks: MOCK_ROUTINE_TODAY.blocks.map((b) => ({
        ...b,
        tasks: b.tasks.map((t) => ({ ...t, scheduledTime: "10:15" })),
      })),
    };
    expect(RoutineDaySchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita cpuUsage fora de 0..100", () => {
    const minimalStatus = {
      status: "operational" as const,
      message: "ok",
      generatedAt: "2026-07-30T00:00:00Z",
      lastUpdate: "2026-07-30T00:00:00Z",
      uptimeSeconds: 100,
      cpuUsage: 150,
      memoryUsage: 50,
      diskUsage: 60,
      counts: {
        servicesOperational: 0, servicesAttention: 0, servicesUnavailable: 0,
        agentsActive: 0, mcpsActive: 0, skillsActive: 0,
        automationsActive: 0, projectsActive: 0, executionsLast24h: 0,
      },
      technicalSummary: {
        activeMcps: 0, activeSkills: 0, activeAgents: 0,
        runningAutomations: 0, activeContainers: 0,
        lastSyncAt: null, lastBackupAt: null, lastFailureAt: null,
      },
      source: "live" as const,
    };
    expect(NexusSystemStatusSchema.safeParse(minimalStatus).success).toBe(false);
  });

  it("rejeita availabilityPct > 100", () => {
    const bad = {
      id: "x", name: "x",
      latencyMs: 10, availabilityPct: 150,
      lastCheckedAt: "2026-07-30T00:00:00Z",
      sparkline24h: Array(12).fill(50),
      uptime7d: Array(7).fill(true),
      version: "1",
    };
    expect(InfrastructureServiceSchema.safeParse(bad).success).toBe(false);
  });
});

describe("NexusSystemStatusSchema", () => {
  it("aceita payload mínimo válido", () => {
    const minimal = {
      status: "operational",
      message: "ok",
      generatedAt: "2026-07-30T00:00:00Z",
      lastUpdate: "2026-07-30T00:00:00Z",
      uptimeSeconds: 100,
      cpuUsage: 0.5,
      memoryUsage: 0.6,
      diskUsage: 0.7,
      counts: {
        servicesOperational: 5,
        servicesAttention: 0,
        servicesUnavailable: 0,
        agentsActive: 1,
        mcpsActive: 1,
        skillsActive: 1,
        automationsActive: 1,
        projectsActive: 1,
        executionsLast24h: 10,
      },
      technicalSummary: {
        activeMcps: 1,
        activeSkills: 1,
        activeAgents: 1,
        runningAutomations: 1,
        activeContainers: 1,
        lastSyncAt: null,
        lastBackupAt: null,
        lastFailureAt: null,
      },
      source: "live",
    };
    expect(NexusSystemStatusSchema.safeParse(minimal).success).toBe(true);
  });

  it("rejeita status fora do enum", () => {
    const bad = {
      status: "morto",
      message: "ok",
      generatedAt: "2026-07-30T00:00:00Z",
      lastUpdate: "2026-07-30T00:00:00Z",
      uptimeSeconds: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      counts: {
        servicesOperational: 0,
        servicesAttention: 0,
        servicesUnavailable: 0,
        agentsActive: 0,
        mcpsActive: 0,
        skillsActive: 0,
        automationsActive: 0,
        projectsActive: 0,
        executionsLast24h: 0,
      },
      technicalSummary: {
        activeMcps: 0,
        activeSkills: 0,
        activeAgents: 0,
        runningAutomations: 0,
        activeContainers: 0,
        lastSyncAt: null,
        lastBackupAt: null,
        lastFailureAt: null,
      },
      source: "live",
    };
    expect(NexusSystemStatusSchema.safeParse(bad).success).toBe(false);
  });
});

describe("NEXUS_API_SCHEMAS", () => {
  it("é um objeto indexado por método", () => {
    expect(NEXUS_API_SCHEMAS).toBeTypeOf("object");
    expect(NEXUS_API_SCHEMAS.cronStatus).toBe(CronStatusSchema);
    expect(NEXUS_API_SCHEMAS.routineToday).toBe(RoutineDaySchema);
  });
});
