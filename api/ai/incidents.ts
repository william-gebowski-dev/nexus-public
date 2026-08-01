import { getSupabaseServer } from "../_shared/supabaseServer";
import type { ApiRequest, ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/incidents
 *
 * Lista incidentes persistidos, com filtro opcional por status.
 * Aceita ?status=open|acknowledged|resolved|ignored.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const status = typeof req.query?.status === "string" ? req.query.status : null;

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[incidents] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  let q = supabase
    .from("ai_incidents")
    .select(
      "id, type, severity, status, provider_id, model_id, first_seen_at, last_seen_at, occurrences, title, summary, suggested_action",
    )
    .order("last_seen_at", { ascending: false });
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    console.error("[incidents] erro", error.message);
    return res.status(500).json({ error: "Falha ao consultar incidentes" });
  }

  return res.status(200).json({
    items: (data ?? []).map((i) => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      status: i.status,
      providerId: i.provider_id,
      modelId: i.model_id,
      firstSeenAt: i.first_seen_at,
      lastSeenAt: i.last_seen_at,
      occurrences: i.occurrences,
      title: i.title,
      summary: i.summary,
      suggestedAction: i.suggested_action,
    })),
  });
}
