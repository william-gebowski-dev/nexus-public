import crypto from "node:crypto";
import { AiIngestPayloadSchema } from "../../src/lib/schemas";
import { checkPayload } from "../../src/lib/sanitize";
import { getSupabaseServer } from "../_shared/supabaseServer";
import { getHeader, type ApiRequest, type ApiResponse } from "../_shared/http";

/** Limite máximo do payload (em bytes) para evitar DoS via upload gigante. */
const MAX_BODY_BYTES = 256 * 1024; // 256 KiB
/** Tolerância máxima de drift entre timestamp do cliente e do servidor. */
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  // 1. Headers obrigatórios.
  const timestampHeader = getHeader(req.headers, "x-nexus-timestamp");
  const signatureHeader = getHeader(req.headers, "x-nexus-signature");
  const idempotencyHeader = getHeader(req.headers, "x-nexus-idempotency-key");

  if (!timestampHeader || !signatureHeader || !idempotencyHeader) {
    return res.status(401).json({ error: "Headers de autenticação HMAC ausentes" });
  }
  if (idempotencyHeader.length < 8 || idempotencyHeader.length > 128) {
    return res.status(400).json({ error: "Chave de idempotência com tamanho inválido" });
  }

  // 2. Timestamp drift.
  const reqTime = new Date(timestampHeader).getTime();
  const now = Date.now();
  if (Number.isNaN(reqTime) || Math.abs(now - reqTime) > MAX_TIMESTAMP_DRIFT_MS) {
    return res.status(401).json({ error: "Timestamp expirado ou desalinhado" });
  }

  // 3. Limite de payload.
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (typeof rawBody !== "string" || Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Payload Too Large" });
  }

  // 4. HMAC.
  const secret = process.env.AI_INGEST_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Segredo de Ingestão não configurado no servidor" });
  }

  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  const provided = Buffer.from(signatureHeader, "hex");
  const expected = Buffer.from(expectedHmac, "hex");

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return res.status(403).json({ error: "Assinatura HMAC inválida" });
  }

  // 5. Sanitização.
  const sanitization = checkPayload(rawBody);
  if (!sanitization.ok) {
    return res.status(400).json({
      error: "Payload contém dados sensíveis não sanitizados",
      // Apenas labels — nunca os matches (podem conter o próprio segredo).
      details: sanitization.failures.map((f) => f.label),
    });
  }

  // 6. Schema Zod.
  const parseResult = AiIngestPayloadSchema.safeParse(JSON.parse(rawBody));
  if (!parseResult.success) {
    return res.status(422).json({
      error: "Contrato de payload inválido",
      issues: parseResult.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }

  const payload = parseResult.data;
  const itemsProcessed =
    payload.modelUsage.length +
    payload.providerUsage.length +
    payload.providerQuotas.length +
    payload.requestRecords.length +
    payload.incidents.length +
    payload.topology.nodes.length +
    payload.topology.edges.length +
    1; // snapshot

  // 7. Idempotência: verifica se a chave já foi processada.
  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[ingest] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  const { data: existing, error: existingErr } = await supabase
    .from("ai_ingest_runs")
    .select("id, status, items_processed, created_at")
    .eq("idempotency_key", idempotencyHeader)
    .maybeSingle();

  if (existingErr) {
    console.error("[ingest] erro ao consultar idempotência", existingErr.message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }
  if (existing) {
    return res.status(409).json({
      error: "Chave de idempotência já processada",
      previousRun: {
        status: existing.status,
        itemsProcessed: existing.items_processed,
        createdAt: existing.created_at,
      },
    });
  }

  // 8. Persistência em transação (RPC atômica).
  // O Supabase JS não expõe transações multi-tabela diretamente; usamos
  // a RPC `ingest_ai_snapshot` criada em
  // `supabase/migrations/20260801000002_ingest_rpc.sql`. Se a RPC ainda
  // não existir no banco (deploy da migration pendente), caímos para o
  // fallback sequencial abaixo. Erros reais da RPC (contrato quebrado,
  // constraint, permissão) não são escondidos.
  const { data: rpcRunId, error: rpcErr } = await supabase.rpc("ingest_ai_snapshot", {
    p_snapshot: payload.snapshot,
    p_model_usage: payload.modelUsage,
    p_provider_usage: payload.providerUsage,
    p_provider_quotas: payload.providerQuotas,
    p_request_records: payload.requestRecords,
    p_incidents: payload.incidents,
    p_topology: payload.topology,
    p_payload_version: payload.payloadVersion,
    p_collector_version: payload.collectorVersion,
    p_idempotency_key: idempotencyHeader,
    p_timestamp: new Date(reqTime).toISOString(),
  });

  if (!rpcErr && rpcRunId) {
    return res.status(200).json({
      ok: true,
      message: "Snapshot persistido com sucesso (RPC atômica)",
      idempotencyKey: idempotencyHeader,
      runId: rpcRunId,
      snapshotId: null,
      itemsProcessed,
      receivedAt: new Date().toISOString(),
    });
  }

  const missingRpc = rpcErr && (
    rpcErr.code === "PGRST202" ||
    rpcErr.message?.includes("Could not find the function") ||
    rpcErr.message?.includes("function ingest_ai_snapshot")
  );
  if (rpcErr && !missingRpc) {
    console.error("[ingest] RPC ingest_ai_snapshot falhou", rpcErr.message);
    return res.status(500).json({ error: "Falha ao persistir snapshot via RPC" });
  }

  if (missingRpc) {
    // DEPRECATION: fallback sequencial mantido como safety-net para
    // migrações não-deployadas. Migrations `20260801000002_ingest_rpc.sql`
    // e `20260802000003_fix_quota_checked_at.sql` (v2) devem estar
    // aplicadas no Supabase alvo. Se este log aparece em produção,
    // aplicar migration pendente e remover este bloco (linhas ~166-380).
    console.warn(
      "[ingest] DEPRECATION: RPC ingest_ai_snapshot ausente — usando fallback sequencial. " +
        "Aplicar migration 20260802000003_fix_quota_checked_at.sql no Supabase alvo.",
    );
  }

  const runId = crypto.randomUUID();
  const ingestRecord = {
    id: runId,
    timestamp: new Date(reqTime).toISOString(),
    idempotency_key: idempotencyHeader,
    status: "pending" as const,
    items_processed: 0,
  };

  const { error: runErr } = await supabase
    .from("ai_ingest_runs")
    .insert(ingestRecord);
  if (runErr) {
    console.error("[ingest] falha ao criar ingest_run", runErr.message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  // Snapshot.
  const snap = payload.snapshot;
  const { data: snapRow, error: snapErr } = await supabase
    .from("ai_usage_snapshots")
    .insert({
      period: snap.period,
      captured_at: snap.generatedAt,
      source: snap.source,
      total_requests: snap.totalRequests,
      successful_requests: snap.successfulRequests,
      failed_requests: snap.failedRequests,
      input_tokens: snap.inputTokens,
      cached_input_tokens: snap.cachedInputTokens,
      output_tokens: snap.outputTokens,
      total_tokens: snap.totalTokens,
      estimated_cost_usd: snap.estimatedCostUsd ?? null,
      average_latency_ms: snap.averageLatencyMs ?? null,
      median_latency_ms: snap.medianLatencyMs ?? null,
      active_providers: snap.activeProviders,
      active_models: snap.activeModels,
      most_used_provider: snap.mostUsedProvider ?? null,
      most_used_model: snap.mostUsedModel ?? null,
      last_request_at: snap.lastRequestAt ?? null,
      payload_version: payload.payloadVersion,
    })
    .select("id")
    .single();
  if (snapErr || !snapRow) {
    await supabase.from("ai_ingest_runs").update({ status: "failed", error_message: "snapshot insert" }).eq("id", runId);
    return res.status(500).json({ error: "Falha ao persistir snapshot" });
  }
  const snapshotId: string = snapRow.id;

  // Modelos.
  if (payload.modelUsage.length > 0) {
    const rows = payload.modelUsage.map((m) => ({
      snapshot_id: snapshotId,
      model_id: m.modelId,
      public_name: m.publicName,
      provider_id: m.providerId,
      provider_name: m.providerName,
      requests: m.requests,
      input_tokens: m.inputTokens,
      cached_tokens: m.cachedTokens,
      output_tokens: m.outputTokens,
      estimated_cost_usd: m.estimatedCostUsd ?? null,
      average_latency_ms: m.averageLatencyMs ?? null,
      median_latency_ms: m.medianLatencyMs ?? null,
      error_count: m.errorCount,
      last_used_at: m.lastUsedAt ?? null,
      status: m.status,
      source: m.source,
    }));
    const { error } = await supabase.from("ai_model_usage").insert(rows);
    if (error) {
      await supabase.from("ai_ingest_runs").update({ status: "failed", error_message: "models insert" }).eq("id", runId);
      return res.status(500).json({ error: "Falha ao persistir modelos" });
    }
  }

  // Provedores.
  if (payload.providerUsage.length > 0) {
    const rows = payload.providerUsage.map((p) => ({
      snapshot_id: snapshotId,
      provider_id: p.providerId,
      public_name: p.publicName,
      status: p.status,
      active_models: p.activeModels,
      requests: p.requests,
      input_tokens: p.inputTokens,
      cached_tokens: p.cachedTokens,
      output_tokens: p.outputTokens,
      total_tokens: p.totalTokens,
      estimated_cost_usd: p.estimatedCostUsd ?? null,
      average_latency_ms: p.averageLatencyMs ?? null,
      error_count: p.errorCount,
      last_used_at: p.lastUsedAt ?? null,
      auth_status: p.authStatus,
      quota_status: p.quotaStatus,
      source: p.source,
    }));
    const { error } = await supabase.from("ai_provider_usage").insert(rows);
    if (error) {
      await supabase.from("ai_ingest_runs").update({ status: "failed", error_message: "providers insert" }).eq("id", runId);
      return res.status(500).json({ error: "Falha ao persistir provedores" });
    }
  }

  // Cotas.
  if (payload.providerQuotas.length > 0) {
    const rows = payload.providerQuotas.map((q) => ({
      id: q.id,
      provider_id: q.providerId,
      provider_name: q.providerName,
      quota_type: q.quotaType,
      status: q.status,
      used_pct: q.usedPct ?? null,
      remaining_pct: q.remainingPct ?? null,
      resets_at: q.resetsAt ?? null,
      message: q.message ?? null,
    }));
    const { error } = await supabase.from("ai_provider_quotas").upsert(rows);
    if (error) {
      await supabase.from("ai_ingest_runs").update({ status: "failed", error_message: "quotas upsert" }).eq("id", runId);
      return res.status(500).json({ error: "Falha ao persistir cotas" });
    }
  }

  // Requisições (idempotência por external_request_hash UNIQUE).
  if (payload.requestRecords.length > 0) {
    const rows = payload.requestRecords.map((r) => ({
      id: r.id,
      external_request_hash: r.externalRequestHash,
      created_at: r.createdAt,
      provider_id: r.providerId,
      provider_name: r.providerName,
      model_id: r.modelId,
      model_name: r.modelName,
      client_name: r.clientName ?? null,
      project_id: r.projectId ?? null,
      project_name: r.projectName ?? null,
      agent_id: r.agentId ?? null,
      agent_name: r.agentName ?? null,
      input_tokens: r.inputTokens,
      cached_tokens: r.cachedTokens,
      output_tokens: r.outputTokens,
      total_tokens: r.totalTokens,
      duration_ms: r.durationMs ?? null,
      estimated_cost_usd: r.estimatedCostUsd ?? null,
      status: r.status,
      error_category: r.errorCategory ?? null,
      source: r.source,
    }));
    const { error } = await supabase.from("ai_request_records").upsert(rows, {
      onConflict: "external_request_hash",
      ignoreDuplicates: true,
    });
    if (error) {
      await supabase.from("ai_ingest_runs").update({ status: "failed", error_message: "requests upsert" }).eq("id", runId);
      return res.status(500).json({ error: "Falha ao persistir requisições" });
    }
  }

  // Incidentes.
  if (payload.incidents.length > 0) {
    const rows = payload.incidents.map((i) => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      status: i.status,
      provider_id: i.providerId ?? null,
      model_id: i.modelId ?? null,
      first_seen_at: i.firstSeenAt,
      last_seen_at: i.lastSeenAt,
      occurrences: i.occurrences,
      title: i.title,
      summary: i.summary,
      suggested_action: i.suggestedAction ?? null,
    }));
    const { error } = await supabase.from("ai_incidents").upsert(rows);
    if (error) {
      await supabase.from("ai_ingest_runs").update({ status: "failed", error_message: "incidents upsert" }).eq("id", runId);
      return res.status(500).json({ error: "Falha ao persistir incidentes" });
    }
  }

  // Topologia — registrar como snapshot, sem tabela própria. Como
  // topologia é derivada, a fonte de verdade são os nós de
  // provider/model/cliente. Para simplicidade inicial, apenas
  // registramos que o snapshot foi capturado e os nós podem ser
  // derivados via /api/ai/topology.

  // Marcar run como succeeded.
  const { error: doneErr } = await supabase
    .from("ai_ingest_runs")
    .update({ status: "succeeded", items_processed: itemsProcessed })
    .eq("id", runId);
  if (doneErr) {
    // Os dados foram persistidos; o run ficou "pending". Marca como
    // succeeded é housekeeping — se falhar, devolvemos 200 mesmo assim,
    // porque os dados do snapshot estão no banco.
    console.error("[ingest] falha ao marcar run como succeeded", doneErr.message);
  }

  return res.status(200).json({
    ok: true,
    message: "Snapshot persistido com sucesso",
    idempotencyKey: idempotencyHeader,
    runId,
    snapshotId,
    itemsProcessed,
    receivedAt: new Date().toISOString(),
  });
}
