-- Migration: Corrige checked_at no upsert de quotas da RPC ingest_ai_snapshot.
--
-- Antes desta migration, o ON CONFLICT DO UPDATE do INSERT de quotas não
-- atualizava `checked_at`. A coluna tem DEFAULT clock_timestamp() que só
-- aplica no INSERT (primeira vez). Após múltiplas ingestões com o mesmo
-- quota id, checked_at ficava preso no valor do primeiro INSERT — causando
-- staleness na deduplicação de api/ai/quotas.ts (que ordena por checked_at
-- DESC) e no display de "Última verificação" no frontend.
--
-- Esta migration: (1) corrige o INSERT para sempre atualizar checked_at,
-- (2) backfilla registros antigos que ficaram stale.

-- Backfill: atualizar checked_at de registros órfãos/stales
UPDATE ai_provider_quotas
SET checked_at = clock_timestamp()
WHERE id IN (
  SELECT id FROM ai_provider_quotas
  WHERE checked_at < (clock_timestamp() - interval '1 hour')
);

-- Recriar a função com checked_at no INSERT
CREATE OR REPLACE FUNCTION ingest_ai_snapshot(
  p_snapshot jsonb,
  p_model_usage jsonb,
  p_provider_usage jsonb,
  p_provider_quotas jsonb,
  p_request_records jsonb,
  p_incidents jsonb,
  p_topology jsonb,
  p_payload_version text,
  p_collector_version text,
  p_idempotency_key text,
  p_timestamp timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_run_id uuid := gen_random_uuid();
  v_snapshot_id uuid;
  v_items_processed integer := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM ai_ingest_runs WHERE idempotency_key = p_idempotency_key
  ) THEN
    RAISE EXCEPTION 'Chave de idempotência já processada: %', p_idempotency_key
      USING ERRCODE = 'unique_violation';
  END IF;

  INSERT INTO ai_ingest_runs (id, timestamp, idempotency_key, status, items_processed)
  VALUES (v_run_id, p_timestamp, p_idempotency_key, 'pending', 0);

  INSERT INTO ai_usage_snapshots (
    period, captured_at, source, total_requests, successful_requests,
    failed_requests, input_tokens, cached_input_tokens, output_tokens,
    total_tokens, estimated_cost_usd, average_latency_ms, median_latency_ms,
    active_providers, active_models, most_used_provider, most_used_model,
    last_request_at, payload_version
  ) VALUES (
    p_snapshot->>'period',
    (p_snapshot->>'generatedAt')::timestamptz,
    COALESCE(p_snapshot->>'source', 'live'),
    (p_snapshot->>'totalRequests')::integer,
    (p_snapshot->>'successfulRequests')::integer,
    (p_snapshot->>'failedRequests')::integer,
    (p_snapshot->>'inputTokens')::bigint,
    (p_snapshot->>'cachedInputTokens')::bigint,
    (p_snapshot->>'outputTokens')::bigint,
    (p_snapshot->>'totalTokens')::bigint,
    NULLIF(p_snapshot->>'estimatedCostUsd', '')::numeric(10,4),
    NULLIF(p_snapshot->>'averageLatencyMs', '')::numeric(10,2),
    NULLIF(p_snapshot->>'medianLatencyMs', '')::numeric(10,2),
    (p_snapshot->>'activeProviders')::integer,
    (p_snapshot->>'activeModels')::integer,
    p_snapshot->>'mostUsedProvider',
    p_snapshot->>'mostUsedModel',
    NULLIF(p_snapshot->>'lastRequestAt', '')::timestamptz,
    p_payload_version
  ) RETURNING id INTO v_snapshot_id;
  v_items_processed := v_items_processed + 1;

  -- Modelos.
  IF jsonb_array_length(p_model_usage) > 0 THEN
    INSERT INTO ai_model_usage (
      snapshot_id, model_id, public_name, provider_id, provider_name,
      requests, input_tokens, cached_tokens, output_tokens,
      estimated_cost_usd, average_latency_ms, median_latency_ms,
      error_count, last_used_at, status, source
    )
    SELECT
      v_snapshot_id,
      m->>'modelId', m->>'publicName', m->>'providerId', m->>'providerName',
      (m->>'requests')::integer,
      (m->>'inputTokens')::bigint,
      (m->>'cachedTokens')::bigint,
      (m->>'outputTokens')::bigint,
      NULLIF(m->>'estimatedCostUsd', '')::numeric(10,4),
      NULLIF(m->>'averageLatencyMs', '')::numeric(10,2),
      NULLIF(m->>'medianLatencyMs', '')::numeric(10,2),
      (m->>'errorCount')::integer,
      NULLIF(m->>'lastUsedAt', '')::timestamptz,
      m->>'status',
      COALESCE(m->>'source', 'live')
    FROM jsonb_array_elements(p_model_usage) m;
    v_items_processed := v_items_processed + jsonb_array_length(p_model_usage);
  END IF;

  -- Provedores.
  IF jsonb_array_length(p_provider_usage) > 0 THEN
    INSERT INTO ai_provider_usage (
      snapshot_id, provider_id, public_name, status, active_models,
      requests, input_tokens, cached_tokens, output_tokens, total_tokens,
      estimated_cost_usd, average_latency_ms, error_count, last_used_at,
      auth_status, quota_status, source
    )
    SELECT
      v_snapshot_id,
      p->>'providerId', p->>'publicName', p->>'status',
      (p->>'activeModels')::integer,
      (p->>'requests')::integer,
      (p->>'inputTokens')::bigint,
      (p->>'cachedTokens')::bigint,
      (p->>'outputTokens')::bigint,
      (p->>'totalTokens')::bigint,
      NULLIF(p->>'estimatedCostUsd', '')::numeric(10,4),
      NULLIF(p->>'averageLatencyMs', '')::numeric(10,2),
      (p->>'errorCount')::integer,
      NULLIF(p->>'lastUsedAt', '')::timestamptz,
      p->>'authStatus', p->>'quotaStatus',
      COALESCE(p->>'source', 'live')
    FROM jsonb_array_elements(p_provider_usage) p;
    v_items_processed := v_items_processed + jsonb_array_length(p_provider_usage);
  END IF;

  -- Cotas (upsert com checked_at corrigido).
  IF jsonb_array_length(p_provider_quotas) > 0 THEN
    INSERT INTO ai_provider_quotas (id, provider_id, provider_name, quota_type, status, used_pct, remaining_pct, resets_at, message, checked_at)
    SELECT
      q->>'id', q->>'providerId', q->>'providerName', q->>'quotaType',
      q->>'status',
      NULLIF(q->>'usedPct', '')::numeric(5,2),
      NULLIF(q->>'remainingPct', '')::numeric(5,2),
      NULLIF(q->>'resetsAt', '')::timestamptz,
      q->>'message',
      clock_timestamp()
    FROM jsonb_array_elements(p_provider_quotas) q
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      used_pct = EXCLUDED.used_pct,
      remaining_pct = EXCLUDED.remaining_pct,
      resets_at = EXCLUDED.resets_at,
      message = EXCLUDED.message,
      checked_at = clock_timestamp();
    v_items_processed := v_items_processed + jsonb_array_length(p_provider_quotas);
  END IF;

  -- Requisições (upsert por external_request_hash UNIQUE, ignora duplicatas).
  IF jsonb_array_length(p_request_records) > 0 THEN
    INSERT INTO ai_request_records (
      id, external_request_hash, created_at, provider_id, provider_name,
      model_id, model_name, client_name, project_id, project_name,
      agent_id, agent_name, input_tokens, cached_tokens, output_tokens,
      total_tokens, duration_ms, estimated_cost_usd, status,
      error_category, source
    )
    SELECT
      r->>'id', r->>'externalRequestHash',
      (r->>'createdAt')::timestamptz,
      r->>'providerId', r->>'providerName',
      r->>'modelId', r->>'modelName',
      r->>'clientName', r->>'projectId', r->>'projectName',
      r->>'agentId', r->>'agentName',
      (r->>'inputTokens')::integer,
      (r->>'cachedTokens')::integer,
      (r->>'outputTokens')::integer,
      (r->>'totalTokens')::integer,
      NULLIF(r->>'durationMs', '')::numeric(10,2),
      NULLIF(r->>'estimatedCostUsd', '')::numeric(10,4),
      r->>'status',
      r->>'errorCategory',
      COALESCE(r->>'source', 'live')
    FROM jsonb_array_elements(p_request_records) r
    ON CONFLICT (external_request_hash) DO NOTHING;
    v_items_processed := v_items_processed + jsonb_array_length(p_request_records);
  END IF;

  -- Incidentes (upsert).
  IF jsonb_array_length(p_incidents) > 0 THEN
    INSERT INTO ai_incidents (
      id, type, severity, status, provider_id, model_id,
      first_seen_at, last_seen_at, occurrences, title, summary, suggested_action
    )
    SELECT
      i->>'id', i->>'type', i->>'severity', i->>'status',
      i->>'providerId', i->>'modelId',
      (i->>'firstSeenAt')::timestamptz,
      (i->>'lastSeenAt')::timestamptz,
      (i->>'occurrences')::integer,
      i->>'title', i->>'summary', i->>'suggestedAction'
    FROM jsonb_array_elements(p_incidents) i
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      last_seen_at = EXCLUDED.last_seen_at,
      occurrences = EXCLUDED.occurrences;
    v_items_processed := v_items_processed + jsonb_array_length(p_incidents);
  END IF;

  UPDATE ai_ingest_runs
  SET status = 'succeeded', items_processed = v_items_processed
  WHERE id = v_run_id;

  RETURN v_run_id;
EXCEPTION WHEN OTHERS THEN
  UPDATE ai_ingest_runs
  SET status = 'failed', error_message = SQLERRM
  WHERE id = v_run_id;
  RAISE;
END;
$$;

COMMENT ON FUNCTION ingest_ai_snapshot IS
  'Ingestão atômica de snapshot AI (v2): insere snapshot + model_usage + provider_usage + '
  'quotas + requests + incidents em uma transação. Cotas agora atualizam checked_at no '
  'upsert para evitar stale timestamps. Em erro, toda a ingestão é revertida.';
