import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("kaboom");
  }
  return <p>renderizou ok</p>;
}

describe("ErrorBoundary", () => {
  it("renderiza children quando não há erro", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("renderizou ok")).toBeInTheDocument();
  });

  it("mostra fallback quando um filho lança", () => {
    // silencia o log do React sobre o erro não tratado — esperamos ele.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Algo deu errado ao renderizar o painel")).toBeInTheDocument();
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
