# Publicação do `nexus-public`

> Documento de referência para empacotar, validar e publicar uma nova versão
> do painel operacional. Lê em conjunto com `README.md`.

## 1. Build local

```bash
cd /home/william/dev/nexus-public

# Sanitização: 0 vazamentos esperados
npm run check:mocks

# Tipos: 0 erros esperados
npm run typecheck

# Lint: 0 erros esperados
npm run lint

# Build de produção (gera dist/)
npm run build
```

Inspeção do bundle (sanity check adicional — deve voltar vazio):

```bash
grep -R "100\.1\d\d\." dist/   # não deve retornar nada
grep -R -E "\b(hermes|tailscale|vps)\b" dist/   # apenas termos públicos reescritos
```

## 2. Preview local

```bash
npm run preview
# Abre em http://localhost:4173 (porta padrão do vite preview)
```

Verificações funcionais (com MSW ativo):

- `/` (Overview): contagens batem com os JSONs (`servicesUp = soma dos healthy`,
  `servicesAttention = soma dos attention`, etc.).
- `/infraestrutura`: filtros mostram `IA`, `APIs`, `Web` — sem `VPS`, `Bancos`,
  `Bots`, `Docker`, `Rede privada`.
- `/ia`: 4 agentes, 2 MCPs, 7 skills (5 ativas), 5 modelos.
- `/projetos`: 7 projetos; `router-local` e `central de agentes` refletem v2.
- `/roadmap`: nenhum item cita `VPS`, `Uptime Kuma`, `Telegram`, `LiteLLM`,
  `Postgres`, `Redis`; os itens `done` são milestones v2 (roteador local,
  verificação do Combo, dashboard público).
- `/atividades`: existe entrada do cutover para o roteador local (28/07).
- `/alertas`: existe alerta sobre o roteador local sem unidade de inicialização.
- `/docs`: snapshot congelado aparece com o aviso "Snapshot congelado de
  28/07/2026".

## 3. Verificação de privacidade

```bash
# Nos seeds: nada de marcas internas ou paths
grep -E "(100\.1\d\d\.|hermes-nexus-os|\bhermes\b|\btailscale\b|srv\d{5,}|/opt/|/home/)" \
  src/mocks/data/*.json
# Esperado: zero matches.

# O gate offline reforça o check acima (regex + rewrites):
npm run check:mocks
```

## 4. Pendências fora do escopo local

Itens que **não** podem ser resolvidos daqui — precisam do William em outro
terminal (com 2FA) ou na Vercel:

1. **`gh auth login -h github.com`** — token atual está inválido; sem isso,
   `git push` falha. Re-autorizar e então:
   ```bash
   git push -u origin redesign/dashboard-react-2026-07-28
   ```
2. **Vercel — variáveis de ambiente** — quando `/admin` for habilitado, definir
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do projeto
   `nexus-public-mu`.
3. **Desativar `status-page-publish.timer`** em `archive/vps-era/` — a
   automação legada continua armada no monorepo. Mitigação atual é por
   construção (Vercel serve `dist/index.html`, não a raiz), mas a limpeza
   formal elimina o ruído.

## 5. Após o push

- A Vercel dispara deploy automático no push para `main` (ou no branch se
  configurado). Conferir em `https://vercel.com/william-gebowski-dev/nexus-public`.
- O deploy expõe a nova versão em `https://nexus-public-mu.vercel.app` com
  cache invalidado em ~30 s.
- Smoke-test em produção: `curl -s https://nexus-public-mu.vercel.app/ | grep -c 'Nexus'`
  (deve retornar ≥1).

## 6. Rollback

Vercel mantém o histórico de deploys; o rollback é um clique no painel.
Localmente, basta `git revert` do commit problemático e `git push`.