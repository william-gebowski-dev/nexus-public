-- Migration: snapshot do estado operacional do sistema Nexus.
--
-- Antes desta migration, `/api/system/status` ou proxyava um endpoint
-- externo (`NEXUS_STATUS_ENDPOINT`) ou retornava 503 com body vazio.
-- Sem fonte configurada na Vercel, a UI caía em "Não foi possível
-- atualizar os dados do Hermes".
--
-- Esta migration adiciona a tabela `system_status_snapshots` (linha
-- única sobrescrita a cada atualização) e a função `upsert_system_status`
-- para que o estado operacional possa ser escrito por um coletor e
-- lido pelo endpoint `/api/system/status` sem depender de upstream.
--
-- O coletor (cron job, função agendada ou chamada manual) alimenta esta
-- tabela quando o Hermes publica um status novo; o endpoint da Vercel
-- lê a linha mais recente e devolve no envelope `NexusSystemStatus`.

CREATE TABLE IF NOT EXISTS system_status_snapshots (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  status          TEXT NOT NULL,
  message         TEXT NOT NULL,
  generated_at    TIMESTAMPTZ,
  last_update     TIMESTAMPTZ,
  source          TEXT NOT NULL DEFAULT 'live',
  counts          JSONB NOT NULL,
  technical_summary JSONB NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Linha semente para que `SELECT` nunca falhe antes do primeiro ingest.
INSERT INTO system_status_snapshots (id, status, message, counts, technical_summary)
VALUES (
  1,
  'unavailable',
  'Aguardando primeiro estado operacional do Hermes.',
  '{"servicesOperational":0,"servicesAttention":0,"servicesUnavailable":0,"agentsActive":0,"mcpsActive":0,"skillsActive":0,"automationsActive":0,"projectsActive":0,"executionsLast24h":0}'::jsonb,
  '{"activeMcps":0,"activeSkills":0,"activeAgents":0,"runningAutomations":0,"activeContainers":0,"lastSyncAt":null,"lastBackupAt":null,"lastFailureAt":null}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE system_status_snapshots ENABLE ROW LEVEL SECURITY;

-- Função idempotente: sempre escreve id=1 (linha única). Caller envia
-- o snapshot completo; o upsert substitui a linha inteira por simplicidade
-- (volume baixo, schema pequeno).
CREATE OR REPLACE FUNCTION upsert_system_status(
  p_status          text,
  p_message         text,
  p_generated_at    timestamptz,
  p_last_update     timestamptz,
  p_source          text,
  p_counts          jsonb,
  p_technical_summary jsonb
)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
BEGIN
  INSERT INTO system_status_snapshots (
    id, captured_at, status, message, generated_at, last_update,
    source, counts, technical_summary, updated_at
  ) VALUES (
    1, v_now, p_status, p_message, p_generated_at, p_last_update,
    COALESCE(NULLIF(p_source, ''), 'live'),
    p_counts, p_technical_summary, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    captured_at        = EXCLUDED.captured_at,
    status             = EXCLUDED.status,
    message            = EXCLUDED.message,
    generated_at       = EXCLUDED.generated_at,
    last_update        = EXCLUDED.last_update,
    source             = EXCLUDED.source,
    counts             = EXCLUDED.counts,
    technical_summary  = EXCLUDED.technical_summary,
    updated_at         = EXCLUDED.updated_at;

  RETURN v_now;
END;
$$;

COMMENT ON FUNCTION upsert_system_status IS
  'Upsert do snapshot operacional do Hermes. Linha única (id=1) sobrescrita '
  'a cada chamada. Retorna o timestamp da escrita para fins de log/auditoria.';
