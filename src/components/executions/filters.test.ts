import { describe, it, expect } from "vitest";
import { applyExecutionFilters } from "./filters";
import type { Execution } from "@/types";

const base: Execution = {
  id: "exec-job-30m-12",
  name: "Verificação matinal",
  runner: "scheduler-cron",
  jobId: "job-30m-12",
  blockId: 3,
  scheduledTime: "06:00",
  agent: "operational-agent",
  project: "proj-orion",
  projectId: "proj-orion",
  startedAt: "2026-07-30T09:00:00-03:00",
  durationMs: 180_000,
  status: "success",
  summary: "OK",
  source: "simulated",
};

describe("applyExecutionFilters", () => {
  it("filtra por blockId estruturado (não por regex em runner)", () => {
    const result = applyExecutionFilters([{ ...base, blockId: 3 }], { blockId: "3" });
    expect(result).toHaveLength(1);
    const none = applyExecutionFilters([{ ...base, blockId: 1 }], { blockId: "3" });
    expect(none).toHaveLength(0);
  });

  it("filtra por jobId estruturado (sub-string em exec.jobId)", () => {
    const found = applyExecutionFilters([base], { job: "30m-12" });
    expect(found).toHaveLength(1);
    // substring de 1 não casa com job-30m-12 (corretamente)
    const none = applyExecutionFilters([base], { job: "30m-99" });
    expect(none).toHaveLength(0);
  });

  it("filtra por status, project e agent sem depender de runner", () => {
    const r1 = applyExecutionFilters([base], { status: "success" });
    const r2 = applyExecutionFilters([base], { project: "orion" });
    const r3 = applyExecutionFilters([base], { agent: "operational" });
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(1);
    expect(r3).toHaveLength(1);
  });

  it("combina múltiplos filtros (AND)", () => {
    const r = applyExecutionFilters([base], { blockId: "3", job: "30m-12" });
    expect(r).toHaveLength(1);
    const empty = applyExecutionFilters([base], { blockId: "1", job: "30m-12" });
    expect(empty).toHaveLength(0);
  });
});
