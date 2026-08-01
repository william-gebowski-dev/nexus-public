import { getSupabaseServer } from "../_shared/supabaseServer";
import { pickNumber, pickString, type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/requests?limit=&cursor=&provider=&model=&status=&project=&agent=&search=&period=
 *
 * Filtros server-side, paginação cursor-based (cursor = offset),
 * validação de limit (1..100). Sem Math.random.
 */
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const limitRaw = pickNumber(req.query, "limit") ?? DEFAULT_LIMIT;
  if (limitRaw < 1 || limitRaw > MAX_LIMIT) {
    return res.status(400).json({
      error: "Parâmetro limit inválido",
      allowed: { min: 1, max: MAX_LIMIT },
    });
  }
  const cursorRaw = pickNumber(req.query, "cursor") ?? 0;
  if (cursorRaw < 0) {
    return res.status(400).json({ error: "Parâmetro cursor deve ser >= 0" });
  }

  const provider = pickString(req.query, "provider");
  const model = pickString(req.query, "model");
  const status = pickString(req.query, "status");
  const project = pickString(req.query, "project");
  const agent = pickString(req.query, "agent");
  const search = pickString(req.query, "search");

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[requests] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  let q = supabase
    .from("ai_request_records")
    .select(
      "id, created_at, provider_id, provider_name, model_id, model_name, client_name, project_id, project_name, agent_id, agent_name, input_tokens, cached_tokens, output_tokens, total_tokens, duration_ms, estimated_cost_usd, status, error_category, source",
    )
    .order("created_at", { ascending: false });

  if (provider) q = q.eq("provider_id", provider);
  if (model) q = q.eq("model_id", model);
  if (status) q = q.eq("status", status);
  if (project) q = q.eq("project_id", project);
  if (agent) q = q.eq("agent_id", agent);
  if (search) {
    // ILIKE em qualquer campo textual razoável.
    const like = `%${search.replace(/[%_]/g, "")}%`;
    q = q.or(`client_name.ilike.${like},project_name.ilike.${like},agent_name.ilike.${like},provider_name.ilike.${like},model_name.ilike.${like}`);
  }

  q = q.range(cursorRaw, cursorRaw + limitRaw - 1);

  const { data, error } = await q;
  if (error) {
    console.error("[requests] erro", error.message);
    return res.status(500).json({ error: "Falha ao consultar requisições" });
  }

  const items = (data ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    providerId: r.provider_id,
    providerName: r.provider_name,
    modelId: r.model_id,
    modelName: r.model_name,
    clientName: r.client_name,
    projectId: r.project_id,
    projectName: r.project_name,
    agentId: r.agent_id,
    agentName: r.agent_name,
    inputTokens: r.input_tokens,
    cachedTokens: r.cached_tokens,
    outputTokens: r.output_tokens,
    totalTokens: r.total_tokens,
    durationMs: r.duration_ms,
    estimatedCostUsd: r.estimated_cost_usd,
    status: r.status,
    errorCategory: r.error_category,
    source: r.source,
  }));

  return res.status(200).json({
    items,
    nextCursor: items.length === limitRaw ? cursorRaw + limitRaw : null,
    totalReturned: items.length,
  });
}
