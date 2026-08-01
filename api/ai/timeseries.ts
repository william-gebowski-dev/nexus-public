import { getSupabaseServer } from "../_shared/supabaseServer";
import { isMetric, isPeriod, pickString, type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/timeseries?metric=…&period=…
 *
 * Agrega snapshots reais em buckets por hora (today/24h) ou dia
 * (7d/30d/60d). Sem Math.random — apenas dados persistidos.
 *
 * Se não houver snapshots suficientes, devolve `points: []` com
 * `source: "partial"` para que a UI mostre estado honesto.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const metricRaw = pickString(req.query, "metric") ?? "tokens";
  const periodRaw = pickString(req.query, "period") ?? "today";

  if (!isMetric(metricRaw)) {
    return res.status(400).json({
      error: "Métrica inválida",
      allowed: ["tokens", "cost", "requests", "latency", "errors", "cache"],
    });
  }
  if (!isPeriod(periodRaw)) {
    return res.status(400).json({
      error: "Período inválido",
      allowed: ["today", "24h", "7d", "30d", "60d"],
    });
  }

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[timeseries] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  const since = new Date(Date.now() - periodMs(periodRaw)).toISOString();
  const { data, error } = await supabase
    .from("ai_usage_snapshots")
    .select("captured_at, input_tokens, cached_input_tokens, output_tokens, total_tokens, total_requests, failed_requests, average_latency_ms, estimated_cost_usd")
    .eq("period", periodRaw)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });

  if (error) {
    console.error("[timeseries] erro", error.message);
    return res.status(500).json({ error: "Falha ao consultar snapshots" });
  }

  const points = (data ?? []).map((row) => ({
    bucket: row.captured_at,
    value: extractMetric(row, metricRaw),
  }));

  return res.status(200).json({
    metric: metricRaw,
    period: periodRaw,
    points,
    source: points.length > 0 ? "live" : "partial",
  });
}

function periodMs(period: string): number {
  switch (period) {
    case "today": return 24 * 60 * 60 * 1000;
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    case "60d": return 60 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

type Row = {
  captured_at: string;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_requests: number;
  failed_requests: number;
  average_latency_ms: number | null;
  estimated_cost_usd: number | null;
};

function extractMetric(row: Row, metric: string): number {
  switch (metric) {
    case "tokens": return row.total_tokens ?? 0;
    case "cost": return Number(row.estimated_cost_usd ?? 0);
    case "requests": return row.total_requests ?? 0;
    case "latency": return Number(row.average_latency_ms ?? 0);
    case "errors": return row.failed_requests ?? 0;
    case "cache": {
      const in_ = row.input_tokens ?? 0;
      const cached = row.cached_input_tokens ?? 0;
      return in_ > 0 ? Number(((cached / in_) * 100).toFixed(2)) : 0;
    }
    default: return 0;
  }
}
