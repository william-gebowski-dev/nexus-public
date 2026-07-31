# Nexus — Publicação correta e hardening P1 (2026-07-31)

> Plano de continuação da atualização do Nexus Dashboard. Cobre reconciliação Git → Vercel, remoção do documento legado da produção e o pacote P1 (Overview, Zod, CI, testes). Itens P2 (coletor Hermes, API real) ficam fora do escopo desta spec.

## 1. Contexto

A `main` local de `/home/william/Área de trabalho/dev/nexus-public` já contém o dashboard React (rotas lazy, Zod, Vitest, sanitização, mocks) e o `vercel.json` válido. Porém, o domínio `nexus-public-mu.vercel.app` continua entregando um documento estático antigo (lista de dispositivos, VPS, Tailscale, `~/.hermes/`, `state.db`), em vez do dashboard.

Há também três divergências que impedem um push limpo:

- `main` local está 1 commit à frente de `origin/main` (`d3e1571 spec: registrar skill obsidian-cli via marketplace local`). Decidido: **não** publicar.
- Working tree da `fix/nexus-review-hardening-clean-2026-07-31` tem 9 modificados + 5 untracked (CI novo, ESLint flat, testes, `useProjects`, `SystemStateBanner`, `Overview`, `schemas`).
- Branch de release (`fix/...-clean`) está em sincronia com `origin/main` no commit `4d0c6d2`, mas não é a branch onde a Vercel espera deploy (`main`).

Resultado: enquanto o domínio não for reassociado ao projeto Vercel correto e a `main` não estiver sincronizada, **toda melhoria é publicada em cima do problema errado**.

## 2. Decisão

Adotar uma estratégia em três camadas, cada uma com um critério de aceite próprio e separado:

1. **P0 — Reestabelecer a verdade do deploy.** Domínio volta a servir o dashboard React; documento antigo deixa de ser público; smoke test verde em `/` e `/routine`.
2. **P1 — Endurecer o que vai para a produção.** Corrigir erros da home, endurecer Zod, garantir CI obrigatório, ampliar cobertura das páginas principais. Entrega em **um único PR** “P1 hardening” após o P0.
3. **P2 — Fora de escopo desta spec.** Coletor Hermes, snapshot operacional, API somente leitura, troca para `VITE_DATA_MODE=api`, autenticação para `/admin` e `/knowledge`. Será brainstormed separadamente quando o P1 estiver em `main`.

A publicação continua sendo via **integração Git da Vercel** (sem CLI, sem job de deploy custom no GitHub Actions). Domínio alvo confirmado: `nexus-public-mu.vercel.app` no projeto `nexus-public` (`prj_6iNJQVonHUO7RcBQM6t9JtKdD0TD`).

## 3. Premissas e restrições

- Sem segredos em disco: nenhuma `.env*` com valores reais, `VITE_DATA_MODE` continua `mock` até o P2.
- Branch de produção na Vercel: `main`. Branches de feature continuam usando `fix/`, `feature/` conforme padrão atual.
- A spec anterior (`2026-07-30-...`) continua válida para identidade visual, navegação, contratos, estados obrigatórios e sanitização. Esta spec é complementar; não a substitui.
- CI atual (`ci.yml`) já tem `check:mocks → typecheck → lint → test → build`; o P1 apenas garante que ela está versionada e disparando.
- Cobertura de testes atual é restrita a `src/lib/**`; o P1 amplia para páginas críticas (Overview, Routine, Executions, Admin) sem cobrir 100% da UI.
- O commit `d3e1571` é tooling local e **não** entra no push público. Estratégia: `git reset --hard origin/main` na `main` local após o P0, antes de qualquer merge do P1.

## 4. Arquitetura (alto nível)

### 4.1 Estado Git desejado após P0

```
origin/main                          = 4d0c6d2  (PR #2 mergeado)
main (local)                         = 4d0c6d2  (após reset do d3e1571)
fix/nexus-review-hardening-clean-…   = 4d0c6d2 + uncommitted (workdir)
feature/p1-hardening (nova)          = branch do PR P1
```

### 4.2 Fluxo de deploy (inalterado)

```
feature/p1-hardening ── PR ──> main (local+origin)
                                │
                                ├── (1) ci.yml roda em push/PR
                                │     (check:mocks, typecheck, lint, test, build)
                                │
                                └── (2) Vercel Git Integration detecta push em main
                                      ├── install: npm ci
                                      ├── build:   npm run build  (tsc -b && vite build)
                                      ├── output:  dist
                                      ├── rewrite: /:splat -> /index.html
                                      └── domain:  nexus-public-mu.vercel.app
```

### 4.3 P0 — ações de domínio/projeto Vercel (manuais, fora do código)

- Confirmar, no painel Vercel, que o projeto correto (`prj_6iNJQVonHUO7RcBQM6t9JtKdD0TD`) é o que responde por `nexus-public-mu.vercel.app`.
- Se o domínio estiver em outro projeto: removê-lo, adicioná-lo ao projeto correto, promover o último deploy.
- Verificar SSL e DNS.
- Apagar/proteger o deployment documental antigo (`5671541451` e similares que não terminam no dashboard).

## 5. Componentes e mudanças

### 5.1 P0 — reconciliação (mudanças locais pequenas)

- `git fetch origin`
- `git checkout main && git reset --hard origin/main` (remove `d3e1571`)
- `git checkout -b chore/p0-deploy-realign` (descartável; só para isolar eventuais ajustes)
- `npm ci && npm run check:mocks && npm run typecheck && npm run lint && npm test && npm run build` — todos verdes em `main` limpa.
- `vercel ls` (quando CLI autorizado) e `vercel inspect` no último deploy para confirmar framework/Vite/Node 24.
- Smoke test pós-promover produção: `curl -s https://nexus-public-mu.vercel.app/ | grep -c 'Nexus'` ≥ 1, `curl -sI /routine` retorna 200.

### 5.2 P1 — hardening em um único PR

Branch: `feature/p1-hardening-2026-07-31`. Mudanças:

- **Overview (UX).**
  - `src/pages/Overview.tsx`: remover `useAvailability()` da home (consulta não renderizada, polui refresh).
  - Corrigir card de projetos para mostrar contagem real (`active`, `blocked`) em vez de `lastArtifact`.
  - Adicionar card próprio para “Resultados gerados” no Overview usando `useGeneratedArtifacts` (renomear bloco se necessário para evitar confusão com `/activities`).
- **Zod (contratos).**
  - `src/lib/schemas.ts`: adicionar `blocks.length(12)` e `tasks.length(4)` em `RoutineDaySchema` (e variantes relacionadas) via `superRefine`.
  - Validar `scheduledTime` como `HH:00|HH:30` e `jobId` no formato `job-30m-NN` com NN entre 01 e 48.
  - Em `src/services/nexus-api.ts`: quando `result.success === false`, **lançar erro** (`ApiContractError`) e mostrar `ErrorState` na UI; não retornar `raw`. Fallback: usar último valor válido do cache do `useQuery`.
  - Adicionar testes correspondentes em `src/lib/schemas.test.ts` (cobre regras acima) e `src/services/nexus-api.test.ts` (cobre `throw on contract fail`).
- **CI obrigatório.**
  - Versionar `.github/workflows/ci.yml` (atualmente untracked) com `pull_request` + `push` em `main`, `concurrency.cancel-in-progress: true`, Node 24, steps: `npm ci`, `check:mocks`, `typecheck`, `lint`, `test`, `build`.
  - Adicionar badge de status no `README.md`.
  - Configurar **branch protection rule** em `main`: exigir CI verde antes de merge. (Ação no GitHub; não no código.)
- **Testes de páginas.**
  - Ampliar `vitest.config.ts` para incluir `src/pages/**` na cobertura.
  - Adicionar testes para `Overview`, `Routine`, `Executions`, `Admin` (estado vazio, `ErrorState`, `aria-busy` no loading).
  - Filtros/paginação do `Executions` e troca de `mock`↔`api` no `Overview`.
  - Meta local: ≥ 1 teste de interação crítica por página coberta, sem buscar 100%.

### 5.3 Mudanças explicitamente fora desta spec

- Coletor Hermes local e API real (`/api/routine/today`, `/api/system/status`, etc.).
- Migração para `VITE_DATA_MODE=api`.
- Autenticação real em `/admin` (Supabase).
- Domínio custom.
- Refactor do `Sidebar` para alias `/configuracoes → /configs`.
- Remoção ou reativação do `SearchCommand`.

## 6. Dados e contratos

Sem mudança no modelo de dados. Os contratos Zod permanecem a fonte da verdade, e a regra nova é **falhar alto** quando o backend real chegar e devolver algo fora do esperado.

Variáveis esperadas na Vercel (inalteradas):

| Env | Valor alvo agora | Valor quando P2 chegar |
|---|---|---|
| `VITE_DATA_MODE` | `mock` | `api` |
| `VITE_SUPABASE_URL` | _vazio_ | setar |
| `VITE_SUPABASE_ANON_KEY` | _vazio_ | setar |

Nenhum segredo novo entra no repo.

## 7. Erros e estados

- Falha de contrato Zod → `ApiContractError` lançada, UI mostra `ErrorState` com “Atualizar”. Sem fallback silencioso.
- Erro de rede em modo `api` → mantém último valor válido se houver, senão `ErrorState`.
- CI vermelho em PR → branch protection bloqueia merge.
- Falha de deploy Vercel → verificar `vercel inspect` (CLI quando autorizado) ou Dashboard; rollback via UI Vercel (PUBLICACAO.md §7).

## 8. Testes e verificação

Por fase:

- **P0.**
  - `npm ci && npm run check:mocks && npm run typecheck && npm run lint && npm test && npm run build` todos verdes em `main` local limpa.
  - `curl https://nexus-public-mu.vercel.app/` retorna HTML que contém `Nexus`.
  - `curl -sI https://nexus-public-mu.vercel.app/routine` retorna `200`.
  - `/executions`, `/infrastructure`, `/agents`, `/mcps`, `/skills`, `/automations`, `/projects`, `/activities`, `/knowledge`, `/configs`, `/admin` todas retornam 200 com a SPA carregando.
- **P1.**
  - Testes locais verdes: `npm run test` cobre Overview, Routine, Executions, Admin; schemas validam `blocks.length(12)`/`tasks.length(4)`; `nexus-api` lança em contrato inválido.
  - CI verde no PR de `feature/p1-hardening-2026-07-31` contra `main`.
  - Smoke test pós-merge em produção: páginas principais com badge “Dados de demonstração” visível, `useAvailability` ausente no bundle (grep em `dist/assets/*.js` não encontra `availability`).
  - Branch protection impede merge direto sem CI verde.

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Domínio está em outro projeto Vercel e reassociar quebra o que está no ar | P0 manual: confirmar `prj_…` antes de mover o domínio. Rollback via UI Vercel. |
| `git reset --hard origin/main` perde trabalho útil em `main` local | Antes do reset, conferir `git log main ^origin/main` e arquivar `d3e1571` em branch/arquivo de tooling. |
| P1 fica grande demais para revisar | Limitar a 5 áreas (Overview, Zod, CI, testes, README). Refactors fora do escopo vão para PRs próprios depois do P1. |
| CI roda `npx tsx scripts/check-shapes.ts` e quebra por `tsx` ausente em CI | Garantir `tsx` em devDependencies ou trocar para `node --import tsx/esm`. |
| `vercel deploy` CLI não está instalado | Plano não depende de CLI para deploy (usa integração Git). CLI só para inspeção. |
| Documento antigo continua público após P0 | Confirmar exclusão/proteção no painel Vercel; documentar em PUBLICACAO.md §6.2. |

## 10. Sequência de execução (resumo)

1. **P0.1** Limpar `main` local (reset para `origin/main`); arquivar `d3e1571` em `archive/d3e1571-obsidian-cli-skill` (skill obsidian-cli é tooling local e não vai para o repo público). Stash do trabalho P1 não-comitado em `stash@{0}` em `fix/nexus-review-hardening-clean-2026-07-31`, a ser aplicado em `feature/p1-hardening-2026-07-31` na fase P1.
2. **P0.2** Validar `main` local: pipeline verde local.
3. **P0.3** Confirmar no painel Vercel qual projeto responde pelo domínio; mover se necessário.
4. **P0.4** Promover último deploy em `main` para produção; rodar smoke tests.
5. **P1.1** Abrir branch `feature/p1-hardening-2026-07-31` a partir de `main` limpa.
6. **P1.2** Implementar as 5 áreas (Overview, Zod, CI, testes, README) com commits atômicos.
7. **P1.3** PR contra `main`; CI verde; code review; merge.
8. **P1.4** Smoke test em produção; checklist de fechamento.

## 11. Critérios de aceite

- **P0 aceito:** `https://nexus-public-mu.vercel.app/` mostra o dashboard; nenhuma das 14 rotas retorna o documento antigo; `main` local está em sincronia com `origin/main` e pipeline verde.
- **P1 aceito:** PR mergeado em `main`, CI verde na `main`, smoke tests OK, `useAvailability` removido do bundle, Zod lança em contrato inválido, branch protection ativa, testes de páginas cobrem Overview/Routine/Executions/Admin com ≥ 1 caso de interação cada.

---

Esta spec é propositadamente curta e operacional. Detalhes de UX visual já estão no `2026-07-30-...`; esta documenta apenas o que falta publicar, o que endurecer e o que deixar para depois.

## 12. Fechamento do P0 (2026-07-31)

- Data de aplicação local: 2026-07-31 13:36 -03.
- Projeto Vercel confirmado (esperado): `prj_6iNJQVonHUO7RcBQM6t9JtKdD0TD`.
- Domínio: `https://nexus-public-mu.vercel.app` (reassociação manual em andamento).
- `main` local alinhado com `origin/main` em `4d0c6d2`; commit `d3e1571` arquivado em `archive/d3e1571-obsidian-cli-skill`.
- Trabalho P1 não-comitado preservado em `stash@{0}` (`p1-uncommitted-2026-07-31`), a ser aplicado em `feature/p1-hardening-2026-07-31`.
- Pipeline local em `main` limpa:
  - `npm ci` ok
  - `npm run check:mocks` ok (31/31)
  - `npm run typecheck` ok
  - `npm run lint` **falha**: `eslint: not found`. O `main` limpa referencia o binário mas a devDep e o `eslint.config.js` ainda não estão versionados. Cobertura de correção: P1 (Tarefa 10).
  - `npm test` ok (33/33)
  - `npm run build` ok
- Observações: o `lint` quebrado não bloqueia o P0 em si (Vercel roda `npm run build`, não `npm run lint`), mas precisa entrar no PR P1 antes de qualquer branch protection ativa.
