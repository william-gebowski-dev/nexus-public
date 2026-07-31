import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PILL_TONES, type PillTone } from "@/lib/tones";

/**
 * Pill/badge semântico reutilizável. Substitui as marcações `nx-pill`
 * mais as classes de cor (texto, fundo suave, borda translúcida) que
 * antes eram repetidas em cada componente.
 *
 * Uso: `<Pill tone="green">Operacional</Pill>`.
 */
export function Pill({
  tone,
  size = "sm",
  className,
  children,
  "aria-label": ariaLabel,
  title,
}: {
  tone: PillTone;
  size?: "xs" | "sm";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "nx-pill border",
        PILL_TONES[tone],
        size === "xs" ? "text-[10px] py-0" : "text-xs",
        className,
      )}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}
