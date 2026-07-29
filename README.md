# Nexus — Painel operacional público

Painel operacional vivo do ecossistema Nexus (William Gebowski Duda), publicado
em [`nexus-public-mu.vercel.app`](https://nexus-public-mu.vercel.app).

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS.
- **Cache/sincronização:** TanStack Query com refresh automático a cada 15 min.
- **Mock API:** MSW (Mock Service Worker) — endpoints `/api/*` servidos pelo
  navegador em dev/produção. Quando o backend real (`nexus-api` no monorepo)
  estiver pronto, basta desligar o MSW e os mesmos paths respondem.
- **Roteamento:** React Router — `/`, `/infraestrutura`, `/ia`, `/projetos`,
  `/roadmap`, `/atividades`, `/execucoes`, `/documentacao`, `/configuracoes`,
  `/admin`, `/docs`.
- **Documento legado:** `/docs` embute `legacy/index.html` (o "Registro mestre
  do ecossistema de IA") preservado em `legacy/`. O legacy/index.html teve os
  e-mails completos removidos antes de entrar no repo.

## Privacidade

A camada pública **não** publica IPs, hostnames, paths internos, prompts,
tokens, chat IDs, títulos de alertas, destinos de backup, nem texto cru de
erros. A regra está aplicada em três camadas:

1. Tipos TypeScript em `src/types/*.ts` **não carregam** campos sensíveis.
2. JSONs seed em `src/mocks/data/*.json` já chegam sanitizados.
3. `src/lib/sanitize.ts` (regex `FORBIDDEN`) é aplicado em todas as respostas
   dos handlers MSW antes de devolver ao front — gate final, análogo ao
   `hermes-nexus-os/scripts/status-page.py`.

## Rotas

| Path | Descrição |
|---|---|
| `/` | Visão geral: estado do ecossistema, contadores, top-10 atividades e execuções |
| `/infraestrutura` | Serviços monitorados com latência, disponibilidade e uptime 7d |
| `/ia` | Agentes, MCPs, skills e modelos |
| `/projetos` | Cards com filtros (estado, prioridade, categoria, tecnologia) |
| `/roadmap` | Visualização por fases (Agora / Próximo / Futuro / Concluído) |
| `/atividades` | Feed cronológico paginado com filtros por escopo |
| `/execucoes` | Tabela paginada de execuções |
| `/documentacao` | Documentos sanitizados e alertas |
| `/configuracoes` | Tema, frequência de refresh, fontes de dados |
| `/admin` | Autenticação Supabase + edição (em construção) |
| `/docs` | Documento legado "Registro mestre do ecossistema" |

## Comandos

```bash
npm install
npm run dev          # servidor dev em http://localhost:5173
npm run typecheck    # tsc -b --noEmit
npm run build        # build de produção em dist/
npm run preview      # preview do build
npx msw init public/ # (apenas uma vez) gera o service worker do MSW
```

## Estrutura

```
nexus-public/
├── index.html              # entry do Vite
├── legacy/                 # documento antigo preservado (Registro mestre)
├── public/                 # estáticos servidos pelo Vite (inclui mockServiceWorker.js)
├── src/
│   ├── components/         # ui/ (cards, badges, dialogs) + layout/ + charts/
│   ├── hooks/              # useDataFreshness, useCountdownRefresh, useDebounce, useTheme
│   ├── lib/                # api, queryClient, sanitize, supabase, format, cn
│   ├── mocks/              # handlers MSW + JSONs seed
│   ├── pages/              # 11 páginas + LegacyDocs
│   ├── styles/             # tokens.css + globals.css
│   ├── types/              # tipos TS das entidades
│   ├── App.tsx             # roteador + provider
│   └── main.tsx            # bootstrap React + MSW
├── vercel.json             # outputDirectory=dist + rewrites SPA + /legacy/*
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## Deploy

- `vercel.json` aponta `outputDirectory: "dist"` e rewrite SPA fallback
  para `/index.html`. Paths `/legacy/*` são servidos diretos.
- Vercel faz o build e o deploy a cada `git push` em `main`.
- A Vercel serve o `dist/index.html` (a raiz do build do Vite). O legacy fica
  em `/legacy/index.html`, também servido pela Vercel via rewrite.

## Riscos abertos (registrados em `hermes-nexus-os/.agent/PROJECT_STATE.md`)

- A automação de status antiga (`status-page-publish.timer` no monorepo)
  continua armada; se a VPS voltar a rodar, ela sobrescreve o `index.html`
  **da raiz**. Mitigação atual: o que a Vercel serve é `dist/index.html`
  (gerado pelo Vite), não o `index.html` na raiz do repo — mover o legacy
  para `legacy/` reduz a superfície de risco.
- A autenticação Supabase exige configuração de `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY` no painel da Vercel.
