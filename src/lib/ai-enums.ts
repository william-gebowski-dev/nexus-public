/**
 * Single source of truth para os enums do módulo AI Infrastructure.
 *
 * Este arquivo é importado tanto pelo bundle do browser (via
 * `src/lib/schemas.ts`) quanto pelo código server-side em
 * `api/_shared/http.ts`. Deve permanecer **sem dependências** e sem
 * imports de `node:*` / `supabase` / `crypto` para não vazar nada
 * no bundle do front.
 *
 * Antes desta centralização, `AI_PERIODS` vivia em `api/_shared/http.ts`
 * e o enum Zod equivalente era duplicado em `src/lib/schemas.ts` —
 * qualquer drift entre os dois passava despercebido até a próxima
 * request inválida em produção. Agora a forma canônica é a const
 * array, e os enums Zod são derivados dela.
 */

export const AI_PERIODS = ["today", "24h", "7d", "30d", "60d"] as const;
export type AiUsagePeriod = (typeof AI_PERIODS)[number];

export const AI_METRICS = [
  "tokens",
  "cost",
  "requests",
  "latency",
  "errors",
  "cache",
] as const;
export type AiMetric = (typeof AI_METRICS)[number];

export function isPeriod(value: unknown): value is AiUsagePeriod {
  return typeof value === "string" && (AI_PERIODS as readonly string[]).includes(value);
}

export function isMetric(value: unknown): value is AiMetric {
  return typeof value === "string" && (AI_METRICS as readonly string[]).includes(value);
}
