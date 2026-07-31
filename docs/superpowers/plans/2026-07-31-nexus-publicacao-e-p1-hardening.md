# Nexus — Publicação correta e hardening P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestabelecer o domínio `nexus-public-mu.vercel.app` servindo o dashboard React (P0) e endurecer o que vai para produção com um único PR P1 (Overview, Zod, CI, testes, README).

**Architecture:** Mantemos o pipeline GitHub → Vercel via integração Git, sem CLI no deploy. P0 é uma sequência de comandos Git e ações manuais no painel Vercel. P1 é um PR único com 5 áreas (Overview/Zod/CI/Testes/README) entregues em commits atômicos. P2 (coletor Hermes, API real, Supabase) está fora deste plano.

**Tech Stack:** Vite 5, React 18, TypeScript 5.6, Zod 4.4, Vitest 4.1, MSW 2.4, React Router 6, TanStack Query 5, GitHub Actions (Node 24), Vercel (integração Git, sem CLI).

## Global Constraints

- Branch de produção na Vercel: `main`. CI atual: `.github/workflows/ci.yml` (untracked) com `check:mocks → typecheck → lint → test → build` em Node 24.
- Sem `.env*` com valores reais; `VITE_DATA_MODE=mock`; `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` permanecem vazios até o P2.
- Domínio alvo: `https://nexus-public-mu.vercel.app` no projeto Vercel `prj_6iNJQVonHUO7RcBQM6t9JtKdD0TD`. Reassociação de domínio é manual.
- O commit `d3e1571` ("spec: registrar skill obsidian-cli via marketplace local") é tooling local e **não** entra no push público.
- Sanitização é obrigatória: gate em `src/lib/sanitize.ts` + `scripts/check-mocks.js` cobrem IPs `100.x`, chaves `sk-`/`nvapi-`/`ghp_`, paths `/opt|/home`, `hermes-nexus-os`, `srv\d{5,}`, e-mails.
- Cobertura de testes hoje está restrita a `src/lib/**`; P1 amplia para páginas-chave.
- Spec visual de produto já está em `docs/superpowers/specs/2026-07-30-nexus-hermes-12x4-dashboard-design.md` e permanece válida.

---

## Fase P0 — Reestabelecer a verdade do deploy

### Task 1: Arquivar o commit d3e1571 e resetar main local

**Files:**
- Modify: working tree (`git` apenas, sem edição de código)
- Create: `docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md` (já existe; nada a fazer)

**Interfaces:**
- Consumes: nenhuma.
- Produces: `main` local alinhado com `origin/main` em `4d0c6d2`; commit `d3e1571` preservado em branch de arquivo.

- [ ] **Step 1: Confirmar estado atual**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
git fetch origin
git log --oneline origin/main..main
git status
```

Esperado: lista mostra apenas `d3e1571 spec: registrar skill obsidian-cli via marketplace local`. Working tree pode ter modificações em outras branches; isso é normal.

- [ ] **Step 2: Criar branch de arquivo para o commit d3e1571**

```bash
git branch archive/d3e1571-obsidian-cli-skill d3e1571
git log --oneline archive/d3e1571-obsidian-cli-skill -1
```

Esperado: comando de log mostra `d3e1571 spec: registrar skill obsidian-cli via marketplace local`.

- [ ] **Step 3: Resetar main para origin/main**

```bash
git checkout main
git reset --hard origin/main
git log --oneline -1
git status
```

Esperado: HEAD mostra `4d0c6d2` (ou o SHA atual de `origin/main`); `git status` reporta working tree clean.

- [ ] **Step 4: Verificar que d3e1571 está preservado**

```bash
git rev-parse d3e1571 2>/dev/null && echo "still resolvable" || echo "missing"
git rev-parse archive/d3e1571-obsidian-cli-skill^{commit}
```

Esperado: ambas as resoluções imprimem SHA; nada foi perdido.

- [ ] **Step 5: Documentar a arquivação**

Adicione uma nota ao final de `docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md` na seção "Sequência de execução":

```markdown
- Commit `d3e1571` foi arquivado em `archive/d3e1571-obsidian-cli-skill` (skill obsidian-cli é tooling local e não vai para o repo público).
```

- [ ] **Step 6: Commit (sem nada a comitar se for apenas doc)**

```bash
git status
# se houver mudança no arquivo da spec:
# git add docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md
# git commit -m "docs(spec): arquivar d3e1571 em branch local"
```

Esperado: nada a comitar além da anotação acima. Se o arquivo não mudou, pular o commit.

---

### Task 2: Validar pipeline local em main limpa

**Files:** nenhum (verificação).

**Interfaces:** nenhuma.

- [ ] **Step 1: Rodar pipeline completo**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
npm ci
npm run check:mocks
npm run typecheck
npm run lint
npm test
npm run build
```

Esperado: todos os 6 comandos terminam com exit 0. Se algum falhar, registre o erro antes de prosseguir.

- [ ] **Step 2: Confirmar artefatos do build**

```bash
ls -la dist/
test -f dist/index.html && echo "index.html present"
test -d dist/assets && echo "assets dir present"
```

Esperado: `dist/index.html` e `dist/assets/` existem.

- [ ] **Step 3: Decidir ação corretiva se algum step falhou**

Se algum step falhar:

1. Não continue.
2. Abra issue com a saída literal em `.superpowers/sdd/<id>/reports/` ou relate aqui.
3. Só prossiga quando o pipeline estiver 100% verde em `main` limpa.

Não há commit nesta task.

---

### Task 3: Ações manuais no painel Vercel

**Files:** nenhum (ações no painel).

**Interfaces:** nenhuma.

Esta task não tem comandos shell. Execute manualmente:

- [ ] **Step 1: Abrir o projeto Vercel correto**

URL: `https://vercel.com/william-gebowski-dev/nexus-public`

Confirme que o `Project ID` exibido é `prj_6iNJQVonHUO7RcBQM6t9JtKdD0TD`. Se não for, você está no projeto errado — feche e procure o correto (Search → "nexus-public").

- [ ] **Step 2: Verificar domínio em Settings → Domains**

Confirme que `nexus-public-mu.vercel.app` está listado nesse projeto. Anote o status:

- ✅ Anexado a este projeto → vá para o Step 4.
- ❌ Anexado a outro projeto → execute o Step 3 antes.

- [ ] **Step 3 (somente se Step 2 indicou outro projeto): Reassociar domínio**

1. No projeto Vercel **antigo** (onde o domínio está hoje): Settings → Domains → selecione `nexus-public-mu.vercel.app` → Remove.
2. Volte ao projeto correto: Settings → Domains → Add → `nexus-public-mu.vercel.app` → Add.
3. Aguarde a propagação do DNS (1–5 min).
4. Confirme SSL provisioned (cadeado verde no Domains list).

- [ ] **Step 4: Forçar um build de produção**

Opção A (recomendada, mais rápida): em Deployments, localize o deploy mais recente do branch `main` (commit `4d0c6d2`) e clique em Promote to Production.

Opção B (cria deploy novo): se preferir não promover, faça um commit trivial no `main` (ex.: atualizar linha do README) e `git push origin main` — a Vercel detectará e fará deploy novo.

- [ ] **Step 5: Aguardar build terminar**

No painel, o status deve ir de Building → Ready. Anote o tempo total.

- [ ] **Step 6: Smoke test do domínio**

```bash
curl -s https://nexus-public-mu.vercel.app/ | grep -c "Nexus"
curl -sI https://nexus-public-mu.vercel.app/routine | head -1
```

Esperado: primeiro retorna ≥ 1 (a string `Nexus` aparece no HTML); segundo retorna `HTTP/2 200`.

- [ ] **Step 7: Conferir todas as 14 rotas**

```bash
for r in / /routine /executions /infrastructure /agents /mcps /skills /automations /projects /activities /knowledge /configs /admin /qualquer-rota-inexistente; do
  code=$(curl -sI -o /dev/null -w "%{http_code}" "https://nexus-public-mu.vercel.app$r")
  echo "$r -> $code"
done
```

Esperado: 200 para todas as 13 rotas registradas; 200 também para `/qualquer-rota-inexistente` (o React Router resolve para `NotFound` no cliente, mas o servidor retorna 200 porque o rewrite catch-all é `/(.*) → /index.html`). O importante é que **nenhuma** retorne 404 nem HTML do documento antigo.

- [ ] **Step 8: Apagar deployments legados**

Em Deployments, procure por deployments anteriores que mostrem o documento estático antigo (cabeçalho com nome completo, lista de dispositivos, etc.). Para cada um: ⋯ → Delete.

Critério de fechamento da Task 3: `https://nexus-public-mu.vercel.app/` mostra o dashboard, todas as 13 rotas registradas retornam 200, e nenhum deployment legado com o documento antigo está acessível.

---

### Task 4: Documentar o estado pós-P0

**Files:**
- Modify: `docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md` (anexo)

**Interfaces:** nenhuma.

- [ ] **Step 1: Adicionar nota de fechamento do P0**

No fim do arquivo, adicione uma nova seção:

```markdown
## 12. Fechamento do P0 (data e observações)

- Data de aplicação: <YYYY-MM-DD>
- Projeto Vercel confirmado: `prj_6iNJQVonHUO7RcBQM6t9JtKdD0TD`
- Domínio: `https://nexus-public-mu.vercel.app` servindo o dashboard React.
- Smoke tests: 13/13 rotas OK; nenhum deployment legado acessível.
- Observações: <quaisquer ressalvas — ex.: rota X teve que ser manualmente promovida, deploy N falhou e foi refeito, etc.>
```

- [ ] **Step 2: Commit da nota**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
git add docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md
git commit -m "docs(spec): registrar fechamento do P0"
git push origin main
```

Esperado: commit aparece no GitHub; CI roda; Vercel faz deploy do commit trivial.

---

## Fase P1 — Endurecimento (1 PR)

### Task 5: Abrir branch feature/p1-hardening-2026-07-31

**Files:** nenhum (git).

**Interfaces:**
- Consome: `main` no estado pós-P0.
- Produz: branch `feature/p1-hardening-2026-07-31` com base em `main`.

- [ ] **Step 1: Criar branch**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
git checkout main
git pull --ff-only
git checkout -b feature/p1-hardening-2026-07-31
git status
```

Esperado: branch nova criada a partir de `main` atualizada; working tree clean.

---

### Task 6: Remover useAvailability da home (Overview)

**Files:**
- Modify: `src/pages/Overview.tsx`

**Interfaces:**
- Consome: `useAvailability` (hook em `src/hooks/useAvailability.ts`).
- Produz: `Overview.tsx` sem a chamada `useAvailability()` e sem qualquer referência a `availability`.

- [ ] **Step 1: Localizar a chamada**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
grep -n "useAvailability" src/pages/Overview.tsx
```

Esperado: 1 linha com `const availability = useAvailability();`. Anote o número da linha.

- [ ] **Step 2: Apagar a chamada e o destructure associado**

Em `src/pages/Overview.tsx`, remova a linha `const availability = useAvailability();` (e qualquer linha vizinha que só sirva para essa variável). Não remova o import se ele ainda for usado em outro lugar do arquivo.

- [ ] **Step 3: Confirmar que o componente compila**

```bash
npm run typecheck
```

Esperado: typecheck verde. Se reclamar de import não usado, remova o import.

- [ ] **Step 4: Rodar testes de página existentes**

```bash
npm test -- src/pages/Overview.test.tsx
```

Esperado: testes passam (devem ser independentes da disponibilidade).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Overview.tsx
git commit -m "fix(overview): remover useAvailability não utilizado da home"
```

---

### Task 7: Corrigir card de projetos (Overview)

**Files:**
- Modify: `src/pages/Overview.tsx`
- Test: `src/pages/Overview.test.tsx`

**Interfaces:**
- Consome: `useProjects` (hook em `src/hooks/useProjects.ts`), tipo `Project` (provavelmente em `src/lib/schemas.ts`).
- Produz: copy do card de projetos baseada em contagens (`active`/`blocked`), sem referência a `artifacts`.

- [ ] **Step 1: Inspecionar o tipo Project**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
grep -n "Project" src/lib/schemas.ts | head -20
```

Anote os campos disponíveis (status, blockers, etc.). Identifique como mapear para `active` e `blocked`.

- [ ] **Step 2: Escrever o teste (red)**

Em `src/pages/Overview.test.tsx`, adicione (substitua o teste atual do card de projetos se houver):

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    data: [
      { id: 'p1', name: 'A', status: 'active' },
      { id: 'p2', name: 'B', status: 'active' },
      { id: 'p3', name: 'C', status: 'blocked' },
    ],
    isLoading: false,
  }),
}))

import Overview from './Overview'

describe('Overview projects card', () => {
  it('mostra contagens de projetos ativos e bloqueados', () => {
    render(<Overview />)
    expect(screen.getByText(/2 projetos ativos/i)).toBeInTheDocument()
    expect(screen.getByText(/1 com bloqueios/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar o teste para ver falhar**

```bash
npm test -- src/pages/Overview.test.tsx
```

Esperado: o teste falha porque a copy atual ainda referencia `lastArtifact`.

- [ ] **Step 4: Substituir a lógica do card de projetos**

Em `src/pages/Overview.tsx`, localize a construção que gera a descrição do card (provavelmente `projectsMetric(projects.data)` ou cálculo inline). Substitua por:

```tsx
const projects = useProjects()
const activeCount = projects.data?.filter((p) => p.status === 'active').length ?? 0
const blockedCount = projects.data?.filter((p) => p.status === 'blocked').length ?? 0

const projectsCard = {
  title: 'Projetos',
  description: `${activeCount} projetos ativos · ${blockedCount} com bloqueios`,
}
```

Adapte os nomes (`p.status`, `active`, `blocked`) ao tipo real encontrado no Step 1.

- [ ] **Step 5: Rodar o teste para ver passar**

```bash
npm test -- src/pages/Overview.test.tsx
```

Esperado: passa.

- [ ] **Step 6: Typecheck e build**

```bash
npm run typecheck
npm run build
```

Esperado: ambos verdes.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Overview.tsx src/pages/Overview.test.tsx
git commit -m "fix(overview): card de projetos usa contagens reais, não artefatos"
```

---

### Task 8: Endurecer schemas Zod (12 blocos, 4 tarefas, IDs, horários)

**Files:**
- Modify: `src/lib/schemas.ts`
- Test: `src/lib/schemas.test.ts`

**Interfaces:**
- Consume: `RoutineDaySchema` e variantes em `src/lib/schemas.ts`.
- Produz: validações `blocks.length(12)`, `tasks.length(4)`, regex `jobId = /^job-30m-(0[1-9]|[1-4][0-9])$/`, `scheduledTime = /^([01]\d|2[0-3]):(00|30)$/`.

- [ ] **Step 1: Localizar schemas relevantes**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
grep -n "RoutineDaySchema\|RoutineBlockSchema\|RoutineTaskSchema\|job-30m\|scheduledTime" src/lib/schemas.ts
```

Anote os números das linhas.

- [ ] **Step 2: Escrever testes (red)**

Em `src/lib/schemas.test.ts`, adicione um bloco `describe('12x4 hardening', () => { ... })`:

```ts
import { RoutineDaySchema } from './schemas'

const baseBlock = {
  id: 1,
  name: 'Bloco 1',
  startTime: '00:00',
  endTime: '02:00',
  tasks: [
    { id: 't1', name: 'A', scheduledTime: '00:00', status: 'pending' as const },
    { id: 't2', name: 'B', scheduledTime: '00:30', status: 'pending' as const },
    { id: 't3', name: 'C', scheduledTime: '01:00', status: 'pending' as const },
    { id: 't4', name: 'D', scheduledTime: '01:30', status: 'pending' as const },
  ],
}

const validDay = {
  date: '2026-07-31',
  totalBlocks: 12,
  totalJobs: 48,
  blocks: Array.from({ length: 12 }, (_, i) => ({ ...baseBlock, id: i + 1, name: `Bloco ${i + 1}` })),
}

describe('12x4 hardening', () => {
  it('aceita 12 blocos com 4 tarefas cada', () => {
    expect(RoutineDaySchema.parse(validDay)).toBeTruthy()
  })

  it('rejeita dia com menos de 12 blocos', () => {
    const bad = { ...validDay, blocks: validDay.blocks.slice(0, 8) }
    expect(() => RoutineDaySchema.parse(bad)).toThrow()
  })

  it('rejeita bloco com menos de 4 tarefas', () => {
    const bad = { ...validDay, blocks: validDay.blocks.map((b, i) => (i === 0 ? { ...b, tasks: b.tasks.slice(0, 2) } : b)) }
    expect(() => RoutineDaySchema.parse(bad)).toThrow()
  })
})
```

Adicione `as const` onde necessário conforme o tipo real.

- [ ] **Step 3: Rodar testes para ver falharem**

```bash
npm test -- src/lib/schemas.test.ts
```

Esperado: 2 dos 3 testes falham (length checks ainda não estão ativos).

- [ ] **Step 4: Aplicar endurecimento no schema**

Em `src/lib/schemas.ts`, no `RoutineDaySchema` (ou onde `blocks` é declarado), troque:

```ts
blocks: z.array(RoutineBlockSchema)
```

por

```ts
blocks: z.array(RoutineBlockSchema).length(12)
```

No `RoutineBlockSchema`, troque `tasks: z.array(RoutineTaskSchema)` por `tasks: z.array(RoutineTaskSchema).length(4)`. Adicione:

```ts
scheduledTime: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'scheduledTime deve estar em HH:00 ou HH:30')
jobId: z.string().regex(/^job-30m-(0[1-9]|[1-4][0-9])$/, 'jobId deve estar no formato job-30m-01 a job-30m-48')
```

Adapte os nomes dos campos se forem diferentes no schema real.

- [ ] **Step 5: Rodar testes para ver passarem**

```bash
npm test -- src/lib/schemas.test.ts
```

Esperado: 3/3 passam.

- [ ] **Step 6: Garantir que mocks e dados de teste existentes continuam válidos**

```bash
npm run check:mocks
npm run typecheck
```

Se mocks quebrarem (length mismatch), atualize os seeds em `src/data/mock-routine.ts` e/ou `src/mocks/data/*.json` para produzir 12 blocos × 4 tarefas com IDs `job-30m-01`..`job-30m-48` e horários `HH:00|HH:30`. Commits separados: **um** para endurecimento, **outro** para ajuste de mocks.

- [ ] **Step 7: Commit do endurecimento (apenas schema + testes)**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat(schemas): endurecer regra 12x4 (12 blocos, 4 tarefas, ids, horarios)"
```

Se Step 6 exigiu ajustes em mocks:

```bash
git add src/data/mock-routine.ts src/mocks/data/ 2>/dev/null || true
git commit -m "test(mocks): ajustar seeds para regra 12x4 endurecida"
```

---

### Task 9: Fail-loud em contrato Zod inválido

**Files:**
- Modify: `src/services/nexus-api.ts`
- Test: `src/services/nexus-api.test.ts`

**Interfaces:**
- Consome: `nexusApi.<método>(args)` em `src/services/nexus-api.ts`, validação Zod existente.
- Produz: lança `ApiContractError` quando `result.success === false`; nunca retorna `raw` após warning.

- [ ] **Step 1: Localizar o ponto de validação**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
grep -n "result.success\|ApiContractError\|console.warn" src/services/nexus-api.ts
```

Anote as linhas.

- [ ] **Step 2: Escrever o teste (red)**

Em `src/services/nexus-api.test.ts`, adicione:

```ts
import { describe, it, expect, vi } from 'vitest'
import { nexusApi, ApiContractError } from './nexus-api'

describe('ApiContractError', () => {
  it('lança quando o backend retorna payload fora do contrato', async () => {
    const badPayload = { date: 'invalid', totalBlocks: 0, totalJobs: 0, blocks: [] }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(badPayload), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    await expect(nexusApi.routineToday()).rejects.toBeInstanceOf(ApiContractError)
  })
})
```

- [ ] **Step 3: Rodar o teste para ver falhar**

```bash
npm test -- src/services/nexus-api.test.ts
```

Esperado: falha porque hoje a função retorna `raw` em vez de lançar.

- [ ] **Step 4: Trocar o comportamento de warning para throw**

Em `src/services/nexus-api.ts`, localize cada bloco do tipo:

```ts
const result = SomeSchema.safeParse(raw)
if (!result.success) {
  console.warn(...)
  return raw
}
return result.data
```

e troque para:

```ts
const result = SomeSchema.safeParse(raw)
if (!result.success) {
  throw new ApiContractError('routineToday', result.error)
}
return result.data
```

Se `ApiContractError` ainda não existir, declare:

```ts
export class ApiContractError extends Error {
  constructor(public method: string, public zodError: unknown) {
    super(`API contract failed for ${method}`)
    this.name = 'ApiContractError'
  }
}
```

- [ ] **Step 5: Rodar o teste para ver passar**

```bash
npm test -- src/services/nexus-api.test.ts
```

Esperado: passa.

- [ ] **Step 6: Garantir que mocks válidos ainda passam**

```bash
npm test
```

Esperado: suíte completa verde. Se algum teste de página quebrar (porque dependia do fallback silencioso), adapte o teste para esperar `ErrorState` ou mockar `nexusApi` retornando dado válido.

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

Esperado: verde.

- [ ] **Step 8: Commit**

```bash
git add src/services/nexus-api.ts src/services/nexus-api.test.ts
git commit -m "feat(api): falhar alto em contrato Zod invalido (ApiContractError)"
```

---

### Task 10: Versionar CI do GitHub

**Files:**
- Modify: `.github/workflows/ci.yml` (atualmente untracked)
- Modify: `README.md` (adicionar badge)

**Interfaces:**
- Consome: scripts `check:mocks`, `typecheck`, `lint`, `test`, `build` em `package.json`.
- Produz: CI que roda em `push` em `main` e em `pull_request`, Node 24, `concurrency.cancel-in-progress: true`.

- [ ] **Step 1: Verificar conteúdo atual**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
cat .github/workflows/ci.yml 2>/dev/null || echo "MISSING"
```

- [ ] **Step 2: Ajustar/recriar o workflow**

Garanta que `.github/workflows/ci.yml` contém (substitua se necessário):

```yaml
name: Quality gate

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run check:mocks
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- [ ] **Step 3: Adicionar badge no README**

Em `README.md`, no topo (depois do título), adicione:

```markdown
[![Quality gate](https://github.com/william-gebowski-dev/nexus-public/actions/workflows/ci.yml/badge.svg)](https://github.com/william-gebowski-dev/nexus-public/actions/workflows/ci.yml)
```

- [ ] **Step 4: Commit**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
git add .github/workflows/ci.yml README.md
git commit -m "ci: versionar workflow de quality gate e badge no README"
```

- [ ] **Step 5: Push da branch e abrir PR**

```bash
git push -u origin feature/p1-hardening-2026-07-31
gh pr create --base main --head feature/p1-hardening-2026-07-31 --title "p1: hardening Overview, Zod, CI, testes" --body "Resumo: ver docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md. Quebra em 5 áreas (Overview, Zod, CI, Testes, README)."
```

Esperado: PR criado; CI roda automaticamente.

---

### Task 11: Ampliar cobertura para páginas-chave

**Files:**
- Modify: `vitest.config.ts`
- Create: `src/pages/Overview.test.tsx` (se ainda não cobre o suficiente — ver Task 7)
- Create: `src/pages/Routine.test.tsx`
- Create: `src/pages/Executions.test.tsx`
- Create: `src/pages/Admin.test.tsx`

**Interfaces:**
- Consome: `Overview`, `Routine`, `Executions`, `Admin` em `src/pages/`.
- Produz: testes que verificam estado vazio, `ErrorState`, `aria-busy` no loading, troca `mock`↔`api` em Overview, paginação/filtro em Executions.

- [ ] **Step 1: Atualizar `vitest.config.ts`**

Localize a seção `coverage`. Garanta:

```ts
coverage: {
  include: ['src/lib/**', 'src/pages/**'],
  // thresholds ficam opcionais nesta task; se já existirem, mantenha
}
```

- [ ] **Step 2: Adicionar teste de Overview (se ainda não cobre o suficiente)**

Reaproveite o que já existe em `src/pages/Overview.test.tsx`. Garanta que tem:

- Render com dados válidos (cobre KPIs e timeline).
- Render com erro (cobre `ErrorState`).
- Render durante loading (cobre `aria-busy="true"` no contêiner principal).
- Troca de `mock`↔`api` via prop (cobre `MockDataBadge` aparecendo/sumindo).

Use `vi.mock('@/hooks/useNexusDashboard', ...)` para retornar os estados.

- [ ] **Step 3: Criar `src/pages/Routine.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/useRoutineToday', () => ({
  useRoutineToday: () => ({ data: undefined, isLoading: false, isError: false }),
}))

import Routine from './Routine'

describe('Routine page', () => {
  it('mostra estado de erro quando o hook falha', () => {
    vi.mocked(useRoutineToday as unknown as () => { isError: boolean }).mockReturnValueOnce({
      data: undefined, isLoading: false, isError: true, refetch: () => {},
    } as unknown as ReturnType<typeof useRoutineToday>)
    // Implemente conforme o padrão de mock do Overview.test.tsx
  })

  it('mostra estado de loading com aria-busy', () => {
    // ...
  })

  it('mostra timeline quando os dados carregam', () => {
    // ...
  })
})
```

Adapte o padrão de mock ao estilo já usado em `src/pages/Overview.test.tsx`. Cada teste deve ser curto e focado.

- [ ] **Step 4: Criar `src/pages/Executions.test.tsx`**

Cubra:

- Render com lista vazia → `EmptyState`.
- Render com lista → `ExecutionRow` aparece N vezes.
- Filtro por status (mock do hook retornando subset).
- Paginação (próxima página mostra próximo lote).

- [ ] **Step 5: Criar `src/pages/Admin.test.tsx`**

Cubra:

- Render sem Supabase env → mostra "em breve" (estado atual em `Admin.tsx:99-115`).
- Render com Supabase mockado e usuário nulo → botão "Entrar".
- Render com usuário logado (mock) → saudação.

- [ ] **Step 6: Rodar toda a suíte**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Esperado: tudo verde.

- [ ] **Step 7: Commit**

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
git add vitest.config.ts src/pages/Overview.test.tsx src/pages/Routine.test.tsx src/pages/Executions.test.tsx src/pages/Admin.test.tsx
git commit -m "test(pages): ampliar cobertura para Overview, Routine, Executions, Admin"
```

---

### Task 12: Ativar branch protection em main

**Files:** nenhum (ação no GitHub).

**Interfaces:** nenhuma.

Esta task não tem comandos shell. Execute manualmente:

- [ ] **Step 1: Abrir Settings do repositório**

URL: `https://github.com/william-gebowski-dev/nexus-public/settings/branches`

- [ ] **Step 2: Adicionar/editar rule para `main`**

Clique em "Add rule" (ou edite a existente):

- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - Selecione: `quality` (o job do `ci.yml`)
- ✅ Require linear history
- ✅ Do not allow bypassing the above settings

- [ ] **Step 3: Confirmar e fechar**

Salve. Tente abrir um PR direto contra `main` no GitHub UI para validar (deve ser bloqueado ou exigir PR).

---

### Task 13: Validar PR + mergear

**Files:** nenhum (ação no GitHub).

- [ ] **Step 1: Conferir CI verde no PR**

Em `https://github.com/william-gebowski-dev/nexus-public/pulls`, abra o PR de `feature/p1-hardening-2026-07-31`. O check `quality` deve estar ✅.

- [ ] **Step 2: Conferir diff resumido**

Confirme que o PR contém exatamente os commits das Tasks 6–11 (Overview, Zod, CI, Testes, README). Não deve ter mudanças aleatórias.

- [ ] **Step 3: Merge**

Use "Squash and merge" ou "Rebase and merge" (sua preferência; mantenha linear history se ativou). Apague a branch após merge.

- [ ] **Step 4: Aguardar deploy automático**

Vercel detecta push em `main` e faz deploy. Acompanhe em `https://vercel.com/william-gebowski-dev/nexus-public/deployments`.

- [ ] **Step 5: Smoke test pós-merge**

```bash
curl -s https://nexus-public-mu.vercel.app/ | grep -c "Nexus"
curl -sI https://nexus-public-mu.vercel.app/routine | head -1
```

Esperado: ≥ 1 e `HTTP/2 200`.

- [ ] **Step 6: Conferir ausência de `useAvailability` no bundle público**

```bash
curl -s https://nexus-public-mu.vercel.app/assets/$(curl -s https://nexus-public-mu.vercel.app/ | grep -oE 'assets/[a-zA-Z0-9_.-]+\.js' | head -1) | grep -c "useAvailability" || echo 0
```

Esperado: 0 (se a string aparecer, force rebuild e verifique se algum chunk lazy ainda carrega o hook; se for apenas nome de export, ignore — o que importa é que o Overview não o invoca).

- [ ] **Step 7: Documentar fechamento do P1**

Adicione ao final de `docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md`:

```markdown
## 13. Fechamento do P1 (data e observações)

- Data de merge: <YYYY-MM-DD>
- PR: <URL>
- Itens entregues: Overview, Zod endurecido, CI versionado, testes de páginas, branch protection ativa.
- Observações: <quaisquer ressalvas — ex.: testes de paginação não ficaram completos, fica para P2.1>
```

```bash
cd "/home/william/Área de trabalho/dev/nexus-public"
git add docs/superpowers/specs/2026-07-31-nexus-publicacao-e-p1-hardening-design.md
git commit -m "docs(spec): registrar fechamento do P1"
git push origin main
```

---

## Critérios globais de aceite (recap)

- **P0 aceito:** `https://nexus-public-mu.vercel.app/` mostra o dashboard; 13/13 rotas retornam 200; nenhum deployment legado acessível; `main` local alinhado com `origin/main`; pipeline verde.
- **P1 aceito:** PR mergeado em `main`, CI verde na `main`, smoke tests OK, `useAvailability` removido do Overview, Zod lança em contrato inválido, branch protection ativa, testes cobrem Overview/Routine/Executions/Admin com ≥ 1 caso de interação cada.

## Fora de escopo

- Coletor Hermes, snapshot operacional, API somente leitura.
- Troca para `VITE_DATA_MODE=api`.
- Autenticação real em `/admin` (Supabase).
- Domínio custom, refactor do Sidebar, SearchCommand.
