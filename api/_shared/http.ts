/**
 * Helpers compartilhados pelos handlers em /api/ai/*.
 *
 * - Tipos mínimos compatíveis com a forma do req/res da Vercel (sem
 *   importar o SDK para manter o bundle pequeno).
 * - Validação de período aceita apenas a união canônica.
 * - `getHeader` é case-insensitive.
 *
 * Os enums `AI_PERIODS` / `AI_METRICS` são re-exportados de
 * `src/lib/ai-enums.ts` (single source of truth) — antes viviam
 * duplicados aqui e em `src/lib/schemas.ts`, com risco de drift.
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

export { AI_METRICS, AI_PERIODS, isMetric, isPeriod } from "@/lib/ai-enums";
export type { AiMetric, AiUsagePeriod } from "@/lib/ai-enums";

export function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const target = name.toLowerCase();
  const val = headers[target] ?? headers[name];
  if (Array.isArray(val)) return val[0] ?? null;
  return val ?? null;
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

export function json(res: ApiResponse, statusCode: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(statusCode).json(body);
}

export function methodNotAllowed(res: ApiResponse, allow = "GET") {
  res.setHeader("Allow", allow);
  return json(res, 405, { error: "Método não permitido" });
}

export function unavailableSource(message = "Fonte operacional indisponível") {
  return {
    error: message,
    source: "unavailable",
    generatedAt: null,
  };
}
