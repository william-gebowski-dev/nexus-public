-- Migration: adicionar coluna `source` à tabela `ai_usage_snapshots`.
--
-- Antes desta migration, a tabela só tinha `payload_version` para rastrear a
-- origem do snapshot, e os endpoints de IA (ex.: /api/ai/summary) precisavam
-- inferir a origem via `requests.length > 0`. Isso transformava qualquer
-- coleta com ao menos uma requisição real em `source: "live"`, mesmo
-- quando providers/quotas/topology/modelUsage estivessem ausentes.
--
-- Agora o snapshot persiste explicitamente o `source` calculado pelo
-- coletor com base em cobertura de campos (ver `scripts/ai-normalize.ts`,
-- função `deriveSnapshotSource`). Default `'live'` mantém o comportamento
-- anterior para dados legados — uma coleta que não tenha atualizado para
-- o novo agregador continua reportando como live, mas o novo agregador
-- escreve o valor correto.

ALTER TABLE ai_usage_snapshots
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'live';

-- Comentário explicativo para quem inspecionar o schema.
COMMENT ON COLUMN ai_usage_snapshots.source IS
  'Origem do snapshot: live (todos os campos vieram do 9Router), '
  'partial (algum campo crítico ausente), periodic (snapshot de janela fixa), '
  'simulated (demo, sem dados reais), unavailable (coletor falhou completamente). '
  'Calculado pelo coletor em scripts/ai-normalize.ts (deriveSnapshotSource).';

-- O índice composto existente (period, captured_at DESC) já cobre as
-- consultas principais; nada a criar aqui.