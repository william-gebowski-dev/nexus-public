/**
 * Helpers compartilhados pelos handlers em /api/ai/*.
 *
 * - Tipos mínimos compatíveis com a forma do req/res da Vercel (sem
 *   importar o SDK para manter o bundle pequeno).
 * - Validação de período aceita apenas a união canônica.
 * - `getHeader` é case-insensitive.
 */

export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => { json: (body: unknown) => void };
};

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

export function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const target = name.toLowerCase();
  const val = headers[target] ?? headers[name];
  if (Array.isArray(val)) return val[0] ?? null;
  return val ?? null;
}

export function isPeriod(value: unknown): value is AiUsagePeriod {
  return typeof value === "string" && (AI_PERIODS as readonly string[]).includes(value);
}

export function isMetric(value: unknown): value is AiMetric {
  return typeof value === "string" && (AI_METRICS as readonly string[]).includes(value);
}

export function pickString(
  query: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | null {
  if (!query) return null;
  const v = query[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function pickNumber(
  query: Record<string, string | string[] | undefined> | undefined,
  key: string,
): number | null {
  const raw = pickString(query, key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
