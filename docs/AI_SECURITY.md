# Segurança do Módulo de Infraestrutura de IA

## Princípios
1. **O frontend nunca fala diretamente com 9Router.** Toda observação é intermediada por `scripts/ai-collector.ts` local.
2. **A Vercel nunca expõe o coletor local.** A função `/api/ai/ingest` valida HMAC-SHA256 e timestamp antes de processar.
3. **O Supabase tem RLS habilitado em todas as tabelas.** Apenas service-role key (server-side) lê/escreve.
4. **Nenhum dado sensível cruza fronteiras.** Sanitização regex em duas camadas (coletor e `safeStringify`).

## Padrões Bloqueados (FORBIDDEN_PATTERNS)
Definidos em `src/lib/sanitize.ts` e `scripts/ai-collector.ts`:
- IPv4 público (10/8, 172.16/12, 192.168/16, 100.x Tailscale)
- IPv6 (link-local, unique-local)
- Chaves `sk-*`, `sk-ant-*`, `nvapi-*`, `ghp_*`, `github_pat_*`
- Bearer tokens genéricos
- Paths Unix absolutos (`/opt/`, `/home/`)
- Hostnames internos (`srvXXXXX`)
- E-mails

## Variáveis Sensíveis (Server-Side Only)
- `AI_INGEST_SECRET` (compartilhado entre coletor e Vercel)
- `SUPABASE_SERVICE_ROLE_KEY` (somente usado em `api/ai/*.ts`)
- `SUPABASE_URL`

⚠️ **NUNCA** prefixar com `VITE_`. Variáveis `VITE_*` são empacotadas no bundle público.

## Rotação de Segredo
1. Gere novo valor: `openssl rand -hex 32`.
2. Atualize `AI_INGEST_SECRET` na Vercel e em cada máquina do coletor.
3. Reinicie o coletor local.

## CSP (index.html)
Atualizado para permitir `connect-src 'self' https://*.supabase.co` e remover inline scripts inseguros.

## Auditoria
- ✅ `scripts/check-mocks.js` valida mocks contra regex de sanitização.
- ✅ `scripts/check-ai-contracts.ts` valida Zod schemas.
- ✅ CI no GitHub Actions executa todos os checks antes do deploy.