import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AiInfrastructureTeaser } from "@/components/overview/AiInfrastructureTeaser";

describe("Fórmulas de Observabilidade de IA", () => {
  it("calcula corretamente a taxa de aproveitamento de cache", () => {
    const inputTokens = 250691385;
    const cachedTokens = 203637137;
    const cacheRatePct = inputTokens > 0 ? (cachedTokens / inputTokens) * 100 : 0;
    expect(cacheRatePct).toBeCloseTo(81.23, 1);
  });

  it("retorna 0% de cache quando inputTokens é zero", () => {
    const inputTokens = 0;
    const cachedTokens = 0;
    const cacheRatePct = inputTokens > 0 ? (cachedTokens / inputTokens) * 100 : 0;
    expect(cacheRatePct).toBe(0);
  });

  it("calcula taxa de erro não negativa", () => {
    const total = 2670;
    const failed = 14;
    const errorRatePct = total > 0 ? (failed / total) * 100 : 0;
    expect(errorRatePct).toBeGreaterThan(0);
    expect(errorRatePct).toBeLessThan(100);
  });
});

describe("Componente AiInfrastructureTeaser", () => {
  it("renderiza o teaser com os valores principais", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AiInfrastructureTeaser />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Infraestrutura de IA")).toBeInTheDocument();
    expect(screen.getByText("Abrir observabilidade de IA")).toBeInTheDocument();
  });
});
