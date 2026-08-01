-- Migration: AI Infrastructure & 9Router Observability tables
-- Row Level Security (RLS) enabled on all tables to deny direct anon access.

CREATE TABLE IF NOT EXISTS ai_usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  total_requests INTEGER NOT NULL CHECK (total_requests >= 0),
  successful_requests INTEGER NOT NULL CHECK (successful_requests >= 0),
  failed_requests INTEGER NOT NULL CHECK (failed_requests >= 0),
  input_tokens BIGINT NOT NULL CHECK (input_tokens >= 0),
  cached_input_tokens BIGINT NOT NULL CHECK (cached_input_tokens >= 0),
  output_tokens BIGINT NOT NULL CHECK (output_tokens >= 0),
  total_tokens BIGINT NOT NULL CHECK (total_tokens >= 0),
  estimated_cost_usd NUMERIC(10,4),
  average_latency_ms NUMERIC(10,2),
  median_latency_ms NUMERIC(10,2),
  active_providers INTEGER NOT NULL CHECK (active_providers >= 0),
  active_models INTEGER NOT NULL CHECK (active_models >= 0),
  most_used_provider TEXT,
  most_used_model TEXT,
  last_request_at TIMESTAMPTZ,
  payload_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS ai_model_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES ai_usage_snapshots(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  public_name TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  requests INTEGER NOT NULL CHECK (requests >= 0),
  input_tokens BIGINT NOT NULL CHECK (input_tokens >= 0),
  cached_tokens BIGINT NOT NULL CHECK (cached_tokens >= 0),
  output_tokens BIGINT NOT NULL CHECK (output_tokens >= 0),
  estimated_cost_usd NUMERIC(10,4),
  average_latency_ms NUMERIC(10,2),
  median_latency_ms NUMERIC(10,2),
  error_count INTEGER NOT NULL CHECK (error_count >= 0),
  last_used_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'live',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS ai_provider_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES ai_usage_snapshots(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  public_name TEXT NOT NULL,
  status TEXT NOT NULL,
  active_models INTEGER NOT NULL CHECK (active_models >= 0),
  requests INTEGER NOT NULL CHECK (requests >= 0),
  input_tokens BIGINT NOT NULL CHECK (input_tokens >= 0),
  cached_tokens BIGINT NOT NULL CHECK (cached_tokens >= 0),
  output_tokens BIGINT NOT NULL CHECK (output_tokens >= 0),
  total_tokens BIGINT NOT NULL CHECK (total_tokens >= 0),
  estimated_cost_usd NUMERIC(10,4),
  average_latency_ms NUMERIC(10,2),
  error_count INTEGER NOT NULL CHECK (error_count >= 0),
  last_used_at TIMESTAMPTZ,
  auth_status TEXT NOT NULL,
  quota_status TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'live',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS ai_provider_quotas (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  quota_type TEXT NOT NULL,
  status TEXT NOT NULL,
  used_pct NUMERIC(5,2),
  remaining_pct NUMERIC(5,2),
  resets_at TIMESTAMPTZ,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  message TEXT
);

CREATE TABLE IF NOT EXISTS ai_request_records (
  id TEXT PRIMARY KEY,
  external_request_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  client_name TEXT,
  project_id TEXT,
  project_name TEXT,
  agent_id TEXT,
  agent_name TEXT,
  input_tokens INTEGER NOT NULL CHECK (input_tokens >= 0),
  cached_tokens INTEGER NOT NULL CHECK (cached_tokens >= 0),
  output_tokens INTEGER NOT NULL CHECK (output_tokens >= 0),
  total_tokens INTEGER NOT NULL CHECK (total_tokens >= 0),
  duration_ms NUMERIC(10,2),
  estimated_cost_usd NUMERIC(10,4),
  status TEXT NOT NULL,
  error_category TEXT,
  source TEXT NOT NULL DEFAULT 'live'
);

CREATE TABLE IF NOT EXISTS ai_incidents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  provider_id TEXT,
  model_id TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  occurrences INTEGER NOT NULL CHECK (occurrences >= 0),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  suggested_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS ai_ingest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  items_processed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Enable RLS on all tables
ALTER TABLE ai_usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ingest_runs ENABLE ROW LEVEL SECURITY;

-- Indexes for performance and data retention cleanups
CREATE INDEX IF NOT EXISTS idx_ai_snapshots_captured_at ON ai_usage_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_request_records_created_at ON ai_request_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_request_records_provider ON ai_request_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_records_model ON ai_request_records(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_status ON ai_incidents(status);
