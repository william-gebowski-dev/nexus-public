import { getSupabaseServer } from "../_shared/supabaseServer";
import { isPeriod, pickString, type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/providers?period=today
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

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[providers] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

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

  const { data, error } = await supabase
    .from("ai_provider_usage")
    .select(
      "provider_id, public_name, status, active_models, requests, input_tokens, cached_tokens, output_tokens, total_tokens, estimated_cost_usd, average_latency_ms, error_count, last_used_at, auth_status, quota_status, source",
    )
    .eq("snapshot_id", snap.id)
    .order("requests", { ascending: false });

  if (error) {
    console.error("[providers] erro", error.message);
    return res.status(500).json({ error: "Falha ao consultar provedores" });
  }

  const items = (data ?? []).map((p) => ({
    providerId: p.provider_id,
    publicName: p.public_name,
    status: p.status,
    activeModels: p.active_models,
    requests: p.requests,
    inputTokens: p.input_tokens,
    cachedTokens: p.cached_tokens,
    outputTokens: p.output_tokens,
    totalTokens: p.total_tokens,
    estimatedCostUsd: p.estimated_cost_usd,
    averageLatencyMs: p.average_latency_ms,
    errorCount: p.error_count,
    lastUsedAt: p.last_used_at,
    authStatus: p.auth_status,
    quotaStatus: p.quota_status,
    source: p.source,
  }));

  return res.status(200).json({
    items,
    snapshotId: snap.id,
    capturedAt: snap.captured_at,
    source: items.length > 0 ? "live" : "partial",
  });
}
