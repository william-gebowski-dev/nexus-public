import { getSupabaseServer } from "../_shared/supabaseServer";
import { isPeriod, pickString, type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/models?period=today&provider=…&status=…
 *
 * Retorna o uso de modelos do snapshot mais recente do período.
 * Se o cliente pedir provider ou status, filtra no servidor.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const period = pickString(req.query, "period") ?? "today";
  if (!isPeriod(period)) {
    return res.status(400).json({ error: "Período inválido" });
  }
  const provider = pickString(req.query, "provider");
  const status = pickString(req.query, "status");

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[models] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  // Encontrar o snapshot mais recente do período.
  const { data: snap, error: snapErr } = await supabase
    .from("ai_usage_snapshots")
    .select("id, captured_at")
    .eq("period", period)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapErr) {
    return res.status(500).json({ error: "Falha ao consultar snapshot" });
  }
  if (!snap) {
    return res.status(200).json({ items: [], snapshotId: null, source: "partial" });
  }

  let q = supabase
    .from("ai_model_usage")
    .select(
      "model_id, public_name, provider_id, provider_name, requests, input_tokens, cached_tokens, output_tokens, estimated_cost_usd, average_latency_ms, median_latency_ms, error_count, last_used_at, status, source",
    )
    .eq("snapshot_id", snap.id)
    .order("requests", { ascending: false });

  if (provider) q = q.eq("provider_id", provider);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    console.error("[models] erro", error.message);
    return res.status(500).json({ error: "Falha ao consultar modelos" });
  }

  const items = (data ?? []).map((m) => ({
    modelId: m.model_id,
    publicName: m.public_name,
    providerId: m.provider_id,
    providerName: m.provider_name,
    requests: m.requests,
    inputTokens: m.input_tokens,
    cachedTokens: m.cached_tokens,
    outputTokens: m.output_tokens,
    estimatedCostUsd: m.estimated_cost_usd,
    averageLatencyMs: m.average_latency_ms,
    medianLatencyMs: m.median_latency_ms,
    errorCount: m.error_count,
    lastUsedAt: m.last_used_at,
    status: m.status,
    source: m.source,
  }));

  return res.status(200).json({
    items,
    snapshotId: snap.id,
    capturedAt: snap.captured_at,
    source: items.length > 0 ? "live" : "partial",
  });
}
