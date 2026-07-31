# Nexus — Painel operacional público

Painel operacional vivo do ecossistema Nexus (William Gebowski Duda), publicado
em [`nexus-public-mu.vercel.app`](https://nexus-public-mu.vercel.app).

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS.
- **Cache/sincronização:** TanStack Query com refresh automático (constante
  `REFRESH_MS` em `src/lib/queryClient.ts` — fonte única).
- **Mock API:** MSW (Mock Service Worker) — endpoints `/api/*` servidos pelo
  navegador em dev/produção. Gateado por `DEV || VITE_USE_MOCKS` em
  `src/main.tsx`; quando o backend real estiver pronto, basta desligar o MSW
  e os mesmos paths respondem.
- **Roteamento:** React Router — `/`, `/infraestrutura`, `/ia`, `/projetos`,
  `/roadmap`, `/atividades`, `/execucoes`, `/documentacao`, `/configuracoes`,
  `/admin`, `/docs`.
- **Documento legado:** `/docs` embute `public/legacy/index.html` (o "Registro
  mestre do ecossistema de IA", snapshot congelado de 28/07/2026, com e-mails
  removidos). Servido via `vercel.json` (`/legacy/:path*`).

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
| `/` | Visão geral: estado do ecossistema, contadores, top-10 atividades e execuções |
| `/infraestrutura` | Serviços monitorados (IA, APIs, Web) com latência, disponibilidade e uptime 7d |
| `/ia` | Agentes, MCPs, skills e modelos |
| `/projetos` | Cards com filtros (estado, prioridade, categoria, tecnologia) |
| `/roadmap` | Visualização por fases (Agora / Próximo / Futuro / Concluído) |
| `/atividades` | Feed cronológico paginado com filtros por escopo |
| `/execucoes` | Tabela paginada de execuções |
| `/documentacao` | Documentos sanitizados e alertas |
| `/configuracoes` | Tema, frequência de refresh, fontes de dados |
| `/admin` | Autenticação Supabase + edição (em construção) |
| `/docs` | Documento legado "Registro mestre do ecossistema" (snapshot congelado) |

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

## Estrutura

```
nexus-public/
├── index.html              # entry do Vite
├── public/
│   ├── legacy/             # documento antigo (Registro mestre, snapshot)
│   └── mockServiceWorker.js
├── scripts/
│   └── check-mocks.js      # validador offline do gate de sanitização
├── src/
│   ├── components/         # ui/ (cards, badges, dialogs) + layout/ + charts/
│   ├── hooks/              # useDataFreshness, useCountdownRefresh, useDebounce, useTheme, useScrollRestoration
│   ├── lib/                # api, queryClient, sanitize, supabase, format, cn, tones, focus
│   ├── mocks/              # handlers MSW + serializers + JSONs seed
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

- **Push bloqueado**: o token `gh auth` está inválido no desktop atual;
  `gh auth login -h github.com` precisa ser refeito antes de subir este branch.
- **Supabase**: `/admin` exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
  no painel da Vercel antes de qualquer mutação real.
- **Timer legado**: a automação antiga de publicação de status
  (`status-page-publish.timer` no monorepo) continua armada; se a VPS voltar
  a rodar, ela pode tentar sobrescrever o `index.html` da raiz. **Mitigação
  por construção**: o que a Vercel serve é `dist/index.html` (gerado pelo
  Vite), não o `index.html` na raiz do repo. O legacy em `public/legacy/`
  é servido apenas pela Vercel via rewrite.