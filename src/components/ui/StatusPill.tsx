import { Pill } from "./Pill";
import type { PillTone } from "@/lib/tones";
import type { McpStatus } from "@/types";

/**
 * Pill de status para entidades da página /ia (MCPs e modelos). Antes
 * vivia como dois componentes locais dentro de AI.tsx; movido para
 * components/ui/ por ser reutilizável e seguir a convenção do projeto.
 */

type ModelStatus = "available" | "rate_limited" | "offline";

const MCP_COPY: Record<McpStatus, { label: string; tone: PillTone }> = {
  connected: { label: "Conectado", tone: "green" },
  unavailable: { label: "Indisponível", tone: "red" },
};

const MODEL_COPY: Record<ModelStatus, { label: string; tone: PillTone }> = {
  available: { label: "Disponível", tone: "green" },
  rate_limited: { label: "Limite de taxa", tone: "amber" },
  offline: { label: "Offline", tone: "red" },
};

export function StatusPill(
  props: { kind: "mcp"; status: McpStatus } | { kind: "model"; status: ModelStatus },
) {
  const copy = props.kind === "mcp" ? MCP_COPY[props.status] : MODEL_COPY[props.status];
  return (
    <Pill tone={copy.tone} size="xs">
      {copy.label}
    </Pill>
  );
}
