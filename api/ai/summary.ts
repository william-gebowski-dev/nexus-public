import { getSupabaseServer } from "../_shared/supabaseServer";
import { isPeriod, pickString, type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/summary?period=today|24h|7d|30d|60d
 *
 * Retorna o snapshot mais recente do período solicitado. Quando ainda
 * não existe snapshot, devolve **200 parcial** com `source: "unavailable"`
 * e todos os contadores zerados explicitamente — a UI mostra "Sem dados"
 * em vez de ErrorState. Quando existe, `source` é o valor persistido
 * pelo coletor (ver `scripts/ai-normalize.ts::deriveSnapshotSource`).
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const period = pickString(req.query, "period") ?? "today";
  if (!isPeriod(period)) {
    return res.status(400).json({
      error: "Período inválido",
      allowed: ["today", "24h", "7d", "30d", "60d"],
    });
  }

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[summary] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  const { data, error } = await supabase
    .from("ai_usage_snapshots")
    .select(
      "id, period, captured_at, source, total_requests, successful_requests, failed_requests, input_tokens, cached_input_tokens, output_tokens, total_tokens, estimated_cost_usd, average_latency_ms, median_latency_ms, active_providers, active_models, most_used_provider, most_used_model, last_request_at, payload_version",
    )
    .eq("period", period)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[summary] erro ao consultar snapshot", error.message);
    return res.status(500).json({ error: "Falha ao consultar snapshot" });
  }

  // Sem snapshot ainda — devolve 200 parcial com shape completo para que
  // a UI possa renderizar o estado "Sem dados" sem ErrorState. `source`
  // é `"unavailable"` (novo valor aceito pelo enum `AiDataSourceSchema`).
  if (!data) {
    return res.status(200).json({
      period,
      generatedAt: null,
      source: "unavailable",
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cacheRatePct: 0,
      errorRatePct: 0,
      estimatedCostUsd: null,
      averageLatencyMs: null,
      medianLatencyMs: null,
      activeProviders: 0,
      activeModels: 0,
      mostUsedProvider: null,
      mostUsedModel: null,
      lastRequestAt: null,
    });
  }

  const cached = (data.cached_input_tokens ?? 0);
  const input = (data.input_tokens ?? 0);
  const total = (data.total_requests ?? 0);
  const failed = (data.failed_requests ?? 0);

  return res.status(200).json({
    period: data.period,
    generatedAt: data.captured_at,
    // `data.source` veio do coletor (ver scripts/ai-normalize.ts). Fallback
    // para "live" se a migration não tiver sido aplicada — legado.
    source: data.source ?? "live",
    totalRequests: data.total_requests,
    successfulRequests: data.successful_requests,
    failedRequests: data.failed_requests,
    inputTokens: data.input_tokens,
    cachedInputTokens: data.cached_input_tokens,
    outputTokens: data.output_tokens,
    totalTokens: data.total_tokens,
    cacheRatePct: input > 0 ? Number(((cached / input) * 100).toFixed(2)) : 0,
    errorRatePct: total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0,
    estimatedCostUsd: data.estimated_cost_usd,
    averageLatencyMs: data.average_latency_ms,
    medianLatencyMs: data.median_latency_ms,
    activeProviders: data.active_providers,
    activeModels: data.active_models,
    mostUsedProvider: data.most_used_provider,
    mostUsedModel: data.most_used_model,
    lastRequestAt: data.last_request_at,
  });
}