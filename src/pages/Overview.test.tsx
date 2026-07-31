import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Overview } from "./Overview";

const { idleQuery, projectsQuery } = vi.hoisted(() => ({
  idleQuery: {
    data: undefined,
    error: null,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  },
  projectsQuery: {
    data: [],
    isFetching: false,
  },
}));

vi.mock("@/hooks/useSystemStatus", () => ({ useSystemStatus: () => idleQuery }));
vi.mock("@/hooks/useCronStatus", () => ({ useCronStatus: () => idleQuery }));
vi.mock("@/hooks/useRoutineToday", () => ({ useRoutineToday: () => idleQuery }));
vi.mock("@/hooks/useRecentExecutions", () => ({ useRecentExecutions: () => idleQuery }));
vi.mock("@/hooks/useDailyReport", () => ({ useDailyReport: () => idleQuery }));
vi.mock("@/hooks/useGeneratedArtifacts", () => ({ useGeneratedArtifacts: () => idleQuery }));
vi.mock("@/hooks/useInfrastructureStatus", () => ({ useInfrastructureStatus: () => idleQuery }));
vi.mock("@/hooks/useProjects", () => ({ useProjects: () => projectsQuery }));

vi.mock("@/components/overview/SystemStateBanner", () => ({ SystemStateBanner: () => null }));
vi.mock("@/components/overview/KpiRow", () => ({ KpiRow: () => null }));
vi.mock("@/components/overview/NowCard", () => ({ NowCard: () => null }));
vi.mock("@/components/overview/NextExecutionCard", () => ({ NextExecutionCard: () => null }));
vi.mock("@/components/overview/DailyRoutineTimeline", () => ({ DailyRoutineTimeline: () => null }));
vi.mock("@/components/overview/CronHealthSection", () => ({ CronHealthSection: () => null }));
vi.mock("@/components/overview/DailyReportTeaser", () => ({ DailyReportTeaser: () => null }));
vi.mock("@/components/overview/StaleBanner", () => ({ StaleBanner: () => null }));
vi.mock("@/components/overview/MockDataBadge", () => ({ MockDataBadge: () => null }));

function renderOverview(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Overview refresh", () => {
  afterEach(cleanup);

  beforeEach(() => {
    projectsQuery.isFetching = false;
    vi.clearAllMocks();
  });

  it("invalida a consulta de projetos ao atualizar o painel", () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    renderOverview(queryClient);

    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["projects"] });
  });

  it("mantém o botão ocupado enquanto projetos estão sendo atualizados", () => {
    projectsQuery.isFetching = true;
    renderOverview(new QueryClient());

    expect(screen.getByRole("button", { name: "Atualizar" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
