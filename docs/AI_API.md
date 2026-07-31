# API de Infraestrutura de IA (Server-Side Endpoints)

## Endpoints Públicos (GET)
Estes endpoints são consumidos pelo dashboard Nexus através do wrapper `nexusApi` em `src/services/nexus-api.ts`:

| Rota                  | Parâmetros               | Descrição                                  |
| --------------------- | ------------------------ | ------------------------------------------ |
| `/api/ai/summary`     | `period`                 | Resumo agregado do período selecionado     |
| `/api/ai/timeseries`  | `metric`, `period`       | Pontos de série temporal por métrica       |
| `/api/ai/models`      | `period`                 | Tabela detalhada de uso por modelo         |
| `/api/ai/providers`   | `period`                 | Cards de status por provedor               |
| `/api/ai/quotas`      | —                        | Cotas e limites por provedor               |
| `/api/ai/requests`    | `limit`, `cursor`        | Log paginado de requisições recentes       |
| `/api/ai/incidents`   | —                        | Histórico de incidentes detectados         |
| `/api/ai/topology`    | —                        | Topologia de roteamento (clientes → 9Router → provedores → modelos) |

## Endpoint Privado de Ingestão (POST)
**Rota:** `POST /api/ai/ingest`

**Headers obrigatórios:**
- `X-Nexus-Timestamp`: timestamp ISO UTC (rejeitado se drift > 5 minutos).
- `X-Nexus-Signature`: HMAC-SHA256(`AI_INGEST_SECRET`, `timestamp + "." + rawBody`).
- `X-Nexus-Idempotency-Key`: string única para evitar replay.

**Validação:**
1. Drift de timestamp ≤ 5 minutos.
2. Verificação HMAC com `crypto.timingSafeEqual`.
3. Sanitização (`src/lib/sanitize.ts`) do JSON inteiro.
4. Validação Zod contra `AiIngestPayloadSchema`.

**Variáveis server-side:**
- `AI_INGEST_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Schemas Zod (src/lib/schemas.ts)
- `AiUsageSummarySchema`
- `AiModelUsageSchema`
- `AiProviderUsageSchema`
- `AiProviderQuotaSchema`
- `AiRequestRecordSchema`
- `AiIncidentSchema`
- `AiTopologySchema`
- `AiIngestPayloadSchema`