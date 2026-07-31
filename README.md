# Nexus — Painel operacional público

Painel operacional vivo do ecossistema Nexus (William Gebowski Duda), publicado
em [`nexus-public-mu.vercel.app`](https://nexus-public-mu.vercel.app).

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS.
- **Cache/sincronização:** TanStack Query com refresh automático (constante
  `REFRESH_MS` em `src/lib/queryClient.ts` — fonte única).
- **Mock API:** MSW (Mock Service Worker) — endpoints `/api/*` servidos pelo
  navegador em dev/preview. Gateado por `DATA_MODE` em
  `src/services/nexus-api.ts`; quando o backend real estiver pronto, basta
  desligar os mocks e os mesmos paths respondem.
- **Roteamento:** React Router — `/`, `/routine`, `/executions`,
  `/infrastructure`, `/agents`, `/mcps`, `/skills`, `/automations`,
  `/projects`, `/activities`, `/knowledge`, `/configs`, `/admin`.

## Arquitetura refletida (v2, local)

O painel descreve o estado da **camada local** do ecossistema:

- **Roteador local** (porta 20128) — orquestra os modelos para a central de agentes.
- **Runner de sessões** — executor local das sessões de chat.
- **Central de agentes** — orquestrador conversacional (memória + despacho).
- **Monitor do sistema**, **Entropia** — automações de saúde e curadoria.

Modelos ativos: Combo (roteador), MiniMax-M3, GLM 5.2, DeepSeek, Kimi.

## Privacidade

A camada pública **não** publica IPs, hostnames, paths internos, prompts,
tokens, chat IDs, títulos de alertas, destinos de backup, nem texto cru de
erros. A regra está aplicada em três camadas:

1. Tipos TypeScript em `src/types/*.ts` **não carregam** campos sensíveis.
2. JSONs seed em `src/mocks/data/*.json` já chegam com termos públicos
   ("rede-privada", "central de agentes", "Roteador de modelos", etc.).
3. `src/lib/sanitize.ts` (regex `FORBIDDEN_PATTERNS`) é aplicado em todas as
   respostas dos handlers MSW antes de devolver ao front — gate final.

`src/mocks/serializers.ts` ainda faz uma **reescrita defensiva**
(`hermes → central de agentes`, `VPS → Cloud`, `LiteLLM → Roteador de modelos`,
etc.) caso algum seed novo reintroduza uma marca interna. `scripts/check-mocks.js`
espelha esse gate para rodar offline antes do commit.

## Rotas

| Path | Descrição |
|---|---|
| `/` | Visão geral: estado do ecossistema, execuções recentes, próxima execução e timeline 12×4 |
| `/routine` | Rotina 12×4 do dia (48 jobs, blocos × tarefas) |
| `/executions` | Tabela paginada de execuções |
| `/executions/:id` | Detalhe de uma execução específica |
| `/infrastructure` | Serviços monitorados (IA, APIs, Web) com latência, disponibilidade e uptime 7d |
| `/agents` | Agentes ativos e estado de cada um |
| `/mcps` | MCPs registrados e saúde |
| `/skills` | Skills do catálogo |
| `/automations` | Automações em execução e cronograma |
| `/projects` | Cards com filtros (estado, prioridade, categoria, tecnologia) |
| `/activities` | Feed cronológico paginado com filtros por escopo |
| `/knowledge` | Documentos e base de conhecimento (sanitizados) |
| `/configs` | Tema, frequência de refresh, fontes de dados |
| `/admin` | Autenticação Supabase + edição (em construção) |

## Comandos

```bash
npm install
npm run dev          # servidor dev em http://localhost:5173
npm run check:mocks  # valida o gate de sanitização contra os seeds
npm run typecheck    # tsc -b --noEmit
npm run lint         # eslint
npm run build        # build de produção em dist/
npm run preview      # preview do build
npx msw init public/ # (apenas uma vez) gera o service worker do MSW
```

## Modo de dados

O front opera em dois modos, definidos por `VITE_DATA_MODE`:

| Modo  | `VITE_DATA_MODE` | MSW | API real |
|-------|------------------|-----|----------|
| mock  | `mock` (default) | sim | não       |
| api   | `api`            | não | sim      |

Override por URL (útil para teste pontual):

- `?mock=1` força modo mock mesmo se `VITE_DATA_MODE=api`
- `?mock=0` força modo api mesmo se `VITE_DATA_MODE=mock`

A leitura fica centralizada em `src/services/nexus-api.ts` —
`main.tsx`, o badge "Dados de demonstração" e todos os métodos
do `nexusApi` consomem o mesmo `DATA_MODE`. Não ler
`import.meta.env` direto em outros lugares.

> Quando o backend `/api/*` estiver publicado, defina
> `VITE_DATA_MODE=api` no painel do projeto `nexus-public` na Vercel
> (ambiente "Production") e os mocks somem automaticamente.

## Estrutura

```
nexus-public/
├── index.html              # entry do Vite
├── public/
│   └── mockServiceWorker.js
├── scripts/
│   └── check-mocks.js      # validador offline do gate de sanitização
├── src/
│   ├── components/         # ui/ (cards, badges, dialogs) + layout/ + charts/
│   ├── hooks/              # useDataFreshness, useCountdownRefresh, useDebounce, useTheme, useScrollRestoration
│   ├── lib/                # api, queryClient, sanitize, supabase, format, cn, tones, focus
│   ├── mocks/              # handlers MSW + serializers + JSONs seed
│   ├── pages/              # 14 páginas (Overview, Routine, Executions, ExecutionDetail, Infrastructure, Agents, Mcps, Skills, Automations, Projects, Activities, Knowledge, Configs, Admin)
│   ├── services/           # nexus-api.ts (fonte única de DATA_MODE)
│   ├── styles/             # tokens.css + globals.css
│   ├── types/              # tipos TS das entidades
│   ├── App.tsx             # roteador + provider
│   └── main.tsx            # bootstrap React + MSW
├── vercel.json             # outputDirectory=dist + rewrite SPA catch-all
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## Deploy

- `vercel.json` aponta `outputDirectory: "dist"` e um único rewrite
  catch-all `/(.*) → /index.html` para suportar rotas SPA
  (`/routine`, `/executions`, etc.). Arquivos estáticos em
  `dist/assets/*` são servidos diretos pela Vercel.
- **Projeto Vercel:** `nexus-public` (id `prj_6iNJQVonHUO7RcBQM6t9JtKdD0TD`).
- **Domínio:** `nexus-public-mu.vercel.app` — deve estar associado a esse
  projeto. Se o domínio aparecer apontando para um deployment antigo,
  conferir a aba "Domains" do projeto.
- **Branch de produção:** `main`.
- Vercel faz o build e o deploy a cada `git push` em `main`.

### Pendências registradas

- **Backend `/api/*` real ainda não existe neste repositório.** Os
  endpoints consumidos pelo front (`/api/system/status`,
  `/api/routine/today`, `/api/executions`, etc.) são atendidos pelo MSW
  enquanto o coletor sanitizado do Hermes não é publicado. Por isso o
  build público entra em modo `mock` por padrão.
- **Supabase:** `/admin` exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
  no painel da Vercel antes de qualquer mutação real.
- **Domínio/projeto:** se o push para `main` republica mas o domínio
  público continua no deployment antigo, conferir a associação
  `nexus-public-mu.vercel.app` → projeto `nexus-public` na Vercel
  (a aba Domains do projeto errado deixa o domínio órfão).
