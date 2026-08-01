import { getSupabaseServer } from "../_shared/supabaseServer";
import type { ApiRequest, ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/quotas
 *
 * Retorna a informação mais recente de cada cota (uma linha por
 * provider/quota_type, ordenada por `checked_at` desc e deduplicada
 * por `(provider_id, quota_type)`).
 *
 * Envelope: `{ items, generatedAt, source }`. `generatedAt` é o
 * `checked_at` mais recente; `source` é `"live"` quando há itens,
 * `"partial"` quando a seleção veio vazia.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[quotas] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  const { data, error } = await supabase
    .from("ai_provider_quotas")
    .select("id, provider_id, provider_name, quota_type, status, used_pct, remaining_pct, resets_at, checked_at, message")
    .order("checked_at", { ascending: false });

  if (error) {
    console.error("[quotas] erro", error.message);
    return res.status(500).json({ error: "Falha ao consultar cotas" });
  }

  // Deduplica: para cada (provider_id, quota_type), mantém apenas a
  // primeira (mais recente).
  const seen = new Set<string>();
  const items = (data ?? []).filter((q) => {
    const k = `${q.provider_id}::${q.quota_type}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const mapped = items.map((q) => ({
    id: q.id,
    providerId: q.provider_id,
    providerName: q.provider_name,
    quotaType: q.quota_type,
    status: q.status,
    usedPct: q.used_pct,
    remainingPct: q.remaining_pct,
    resetsAt: q.resets_at,
    checkedAt: q.checked_at,
    message: q.message,
  }));

  return res.status(200).json({
    items: mapped,
    generatedAt: mapped.length > 0 ? mapped[0].checkedAt : null,
    source: mapped.length > 0 ? "live" : "partial",
  });
}