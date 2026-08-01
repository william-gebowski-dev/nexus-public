/**
 * Formatadores — pt-BR, fuso America/Sao_Paulo (BRT, sem DST desde 2019).
 */

const BR_TZ = "America/Sao_Paulo";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BR_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BR_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BR_TZ,
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** "há 3 minutos", "há 2 horas" — Intl.RelativeTimeFormat em pt-BR. */
const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatRelative(iso: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return rtf.format(-diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return rtf.format(-diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(-diffDay, "day");
}

/** ms → "1.4s", "940ms", "12.3min". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}min`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

/** 0..100 → "98.2%". */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** número grande → "1.4k", "12.3k", "1.2M". */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/**
 * Helpers null-aware para a observabilidade de IA.
 *
 * Diferenciam explicitamente `null`/`undefined` (ausência de dado) de `0`
 * (zero confirmado pela fonte). O frontend **não deve** renderizar
 * ausência de dado como `0`, `~US$ 0.00`, `0 ms` ou `N/A`; usa `—`
 * (em-dash). Mantemos `?? 0` apenas em aritmética legítima (sort,
 * proporção, contagem agregada) — em labels de UI, sempre via helper.
 */
export const PLACEHOLDER = "—";

export function formatNullable<T>(value: T | null | undefined, fallback: string = PLACEHOLDER): T | string {
  if (value === null || value === undefined) return fallback;
  return value;
}

/** `number | null | undefined` → "~US$ 12.34" ou "—". */
export function formatCostUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return PLACEHOLDER;
  return `~US$ ${value.toFixed(2)}`;
}

/** `number | null | undefined` → "12.3 ms" ou "—". */
export function formatLatencyMs(value: number | null | undefined): string {
  if (value === null || value === undefined) return PLACEHOLDER;
  return `${value.toLocaleString("pt-BR")} ms`;
}

/** `number | null | undefined` → "12.3%" ou "—". */
export function formatPct(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined) return PLACEHOLDER;
  return `${value.toFixed(fractionDigits)}%`;
}
