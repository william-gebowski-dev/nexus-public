import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pill } from "./Pill";

describe("Pill", () => {
  it("renderiza o conteúdo filho", () => {
    render(<Pill tone="green">Operacional</Pill>);
    expect(screen.getByText("Operacional")).toBeInTheDocument();
  });

  it("aplica aria-label quando passado", () => {
    render(
      <Pill tone="amber" aria-label="Atenção necessária">
        Atenção
      </Pill>,
    );
    expect(screen.getByLabelText("Atenção necessária")).toBeInTheDocument();
  });

  it("aplica title quando passado", () => {
    render(
      <Pill tone="red" title="Serviço indisponível">
        Down
      </Pill>,
    );
    const el = screen.getByText("Down");
    expect(el).toHaveAttribute("title", "Serviço indisponível");
  });

  it("aceita className extra", () => {
    render(
      <Pill tone="neutral" className="mt-2">
        tag
      </Pill>,
    );
    expect(screen.getByText("tag").className).toMatch(/mt-2/);
  });
});
