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

/**
 * Regra única para o badge "Operacional" do resumo de IA.
 *
 * Antes (análise anterior): `summary.failedRequests === 0 ||
 * summary.errorRatePct < 2` — bastava uma das condições ser verdadeira
 * para exibir Operacional, mesmo com snapshot vazio ou sem providers.
 *
 * Agora exige:
 *   - `source` não é `unavailable` (sem dados) nem `partial` (incompleto);
 *   - `generatedAt` presente (snapshot realmente persistido);
 *   - zero falhas nas requisições observadas;
 *   - taxa de erro abaixo de 2%.
 *
 * Retorna `true` quando TODAS as condições são verdadeiras.
 */
export function isOperational(summary: {
  source: string;
  generatedAt: string | null;
  failedRequests: number;
  errorRatePct: number;
}): boolean {
  return (
    summary.source !== "unavailable" &&
    summary.source !== "partial" &&
    Boolean(summary.generatedAt) &&
    summary.failedRequests === 0 &&
    summary.errorRatePct < 2
  );
}

/**
 * Badge do teaser: 3 estados visíveis — Operacional, Atenção, Sem dados.
 * Retorna o par `tone` + `label` pronto para renderizar em `<Pill>`.
 */
export function operationalBadge(summary: {
  source: string;
  generatedAt: string | null;
  failedRequests: number;
  errorRatePct: number;
}): { tone: PillTone; label: string } {
  if (summary.source === "unavailable" || !summary.generatedAt) {
    return { tone: "neutral", label: "Sem dados" };
  }
  if (isOperational(summary)) {
    return { tone: "green", label: "Operacional" };
  }
  return { tone: "amber", label: "Atenção necessária" };
}
