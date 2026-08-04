import { getSupabaseServer } from "../_shared/supabaseServer";
import { isPeriod, pickString, type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * GET /api/ai/topology?period=today
 *
 * Constrói a topologia a partir dos dados realmente coletados:
 * - tools: client_name distintos em ai_request_records
 * - router: o 9Router (sempre presente)
 * - providers: ai_provider_usage do snapshot
 * - models: ai_model_usage do snapshot
 *
 * Edges: tools→router→providers→models, inferidas a partir das
 * requisições mais recentes (client×provider×model).
 */
const ROUTER_NODE_ID = "router-9router";
const ROUTER_NAME = "9Router Engine";

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
    console.error("[topology] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  // Snapshot mais recente.
  const { data: snap, error: snapErr } = await supabase
    .from("ai_usage_snapshots")
    .select("id")
    .eq("period", period)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (snapErr) {
    return res.status(500).json({ error: "Falha ao consultar snapshot" });
  }
  if (!snap) {
    return res.status(200).json({ nodes: [], edges: [], source: "partial" });
  }

  const [{ data: providers }, { data: models }, { data: clients }] = await Promise.all([
    supabase.from("ai_provider_usage").select("provider_id, public_name, status, requests, last_used_at").eq("snapshot_id", snap.id),
    supabase.from("ai_model_usage").select("model_id, public_name, provider_id, requests, last_used_at").eq("snapshot_id", snap.id),
    supabase.from("ai_request_records").select("client_name").limit(50),
  ]);

  const nodes: Array<{
    id: string;
    name: string;
    type: "tool" | "router" | "provider" | "model";
    status: string;
    requestsCount?: number;
    lastUsedAt?: string;
  }> = [];
  const edges: Array<{ from: string; to: string }> = [];

  // Tools (clientes reais observados).
  const clientNames = Array.from(new Set((clients ?? []).map((c) => c.client_name).filter(Boolean) as string[]));
  for (const name of clientNames) {
    const id = `tool-${slug(name)}`;
    nodes.push({ id, name, type: "tool", status: "operational" });
    edges.push({ from: id, to: ROUTER_NODE_ID });
  }

  // Router.
  nodes.push({ id: ROUTER_NODE_ID, name: ROUTER_NAME, type: "router", status: "operational" });

  // Providers.
  for (const p of providers ?? []) {
    nodes.push({
      id: p.provider_id,
      name: p.public_name,
      type: "provider",
      status: p.status,
      requestsCount: p.requests,
      lastUsedAt: p.last_used_at,
    });
    edges.push({ from: ROUTER_NODE_ID, to: p.provider_id });
  }

  // Models.
  for (const m of models ?? []) {
    nodes.push({
      id: m.model_id,
      name: m.public_name,
      type: "model",
      status: "operational",
      requestsCount: m.requests,
      lastUsedAt: m.last_used_at,
    });
    edges.push({ from: m.provider_id, to: m.model_id });
  }

  return res.status(200).json({
    nodes,
    edges,
    snapshotId: snap.id,
    source: nodes.length > 0 ? "live" : "partial",
  });
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
