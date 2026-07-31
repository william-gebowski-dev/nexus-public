/**
 * Tons de pill — UMA fonte de verdade para a paleta semântica dos badges.
 *
 * Paleta (extraída de tokens.css):
 *   - green   → confirmado / OK / operacional
 *   - amber   → atenção / em aberto
 *   - red     → falha real / crítico
 *   - accent  → técnico (.dev) / em-execução
 *   - geb     → pessoal (.geb) / aguardando
 *   - neutral → inerte / desabilitado
 */

export type PillTone = "green" | "amber" | "red" | "accent" | "geb" | "neutral";

/** Classes Tailwind para `<Pill tone={...}>`. Cada classe combina texto,
 * background soft e borda translúcida — já prontos para MUI/cn(). */
export const PILL_TONES: Record<PillTone, string> = {
  green: "text-green bg-green-soft border-green/40",
  amber: "text-amber bg-amber-soft border-amber/40",
  red: "text-red bg-red-soft border-red/40",
  accent: "text-accent bg-accent-soft border-accent/40",
  geb: "text-geb bg-geb-soft border-geb/40",
  neutral: "text-text-faint bg-surface-hover border-border-strong",
};

/** Mesma paleta, só com cor de texto (sem bg/borda) — para uso inline
 * no estilo do `PRIORITY_TONE` original. */
export const TEXT_TONES: Record<PillTone, string> = {
  green: "text-green",
  amber: "text-amber",
  red: "text-red",
  accent: "text-accent",
  geb: "text-geb",
  neutral: "text-text-dim",
};
