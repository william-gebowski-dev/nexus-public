# Publicação do `Nexus-Dashboard`

> Documento de referência para empacotar, validar e publicar uma nova versão
> do painel operacional. Lê em conjunto com `README.md`.

## 1. Build local

```bash
cd "/home/william/Área de trabalho/Nexus Dashboard"

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

`npm run preview` sobe no modo padrão `mock` (MSW ativo). Para validar
contra um backend local real, use `?mock=0` na URL ou exporte
`VITE_DATA_MODE=api` antes do `npm run build`.

## 3. Verificação de privacidade

```bash
# Nos seeds: nada de marcas internas ou paths
grep -E "(100\.1\d\d\.|hermes-nexus-os|\bhermes\b|\btailscale\b|srv\d{5,}|/opt/|/home/)" \
  src/mocks/data/*.json
# Esperado: zero matches.

# O gate offline reforça o check acima (regex + rewrites):
npm run check:mocks
```

## 4. Configuração do projeto na Vercel

O deploy depende da configuração correta do projeto **antes** do push:

| Item                  | Valor                                            |
|-----------------------|--------------------------------------------------|
| Repositório           | `william-gebowski-dev/Nexus-Dashboard`           |
| Escopo/painel         | `vercel.com/william-gebowski/nexus-dashboard`    |
| Branch de produção    | `main`                                           |
| Framework Preset      | Vite                                             |
| Build Command         | `npm run build`                                  |
| Install Command       | `npm ci`                                         |
| Output Directory      | `dist`                                           |
| Root Directory        | `./`                                             |
| Deployment Protection | `Disabled` (ou `Only Preview Deployments`)       |

`Deployment Protection` é o item mais fácil de esquecer e o de sintoma mais
enganoso: com ela ligada o build fica verde e o site inacessível. Ver §7.

Domínio esperado em **Domains** do projeto:

- `nexus-dashboard-dev.vercel.app` (produção)

Se o domínio aparecer em outro projeto, movê-lo no painel da Vercel —
o domínio é propriedade do **projeto**, não do deployment.

Variáveis de ambiente (Production):

| Variável             | Quando definir                              |
|----------------------|---------------------------------------------|
| `VITE_DATA_MODE`     | `api` quando o backend `/api/*` estiver no ar; caso contrário deixe `mock` |
| `VITE_SUPABASE_URL`  | antes de habilitar `/admin` para mutação real |
| `VITE_SUPABASE_ANON_KEY` | idem                                    |

## 5. Após o push na `main`

- A Vercel dispara deploy automático. Conferir o log em
  `https://vercel.com/william-gebowski/nexus-dashboard`.
- O deployment válido expõe a nova versão em
  `https://nexus-dashboard-dev.vercel.app` com cache invalidado em ~30 s.
- Smoke-test em produção:

  ```bash
  npm run smoke:prod
  ```

  Cinco checks: status `200` na home, ausência de `x-vercel-error`, ausência
  de redirect para o SSO da Vercel, `Nexus` no HTML, e `200` em `/routine`
  (rewrite SPA). Aceita URL alternativa — `npm run smoke:prod -- <url>`.
  O mesmo check roda a cada 6h em `.github/workflows/uptime.yml`.

- Se o `vercel.json` retornar erro de "invalid route destination segment",
  conferir se há alguma regra com `/:N` ou capturas de regex malformadas
  (Vercel usa `$1`, `$2`... para regex, não `:1`).

## 6. Pendências fora do escopo local

Itens que **não** podem ser resolvidos daqui — precisam do William em outro
terminal (com 2FA) ou na Vercel:

1. **`gh auth login -h github.com`** — se o token `gh` expirar,
   `git push` falha. Re-autorizar e então:
   ```bash
   git push -u origin main
   ```
2. **Associação do domínio `nexus-dashboard-dev.vercel.app`** — se o push
   republica com sucesso mas o domínio continua no deployment antigo,
   conferir a aba "Domains" do projeto `nexus-dashboard` na Vercel. O
   domínio precisa estar listado lá, não em outro projeto.
3. **Backend `/api/*` real** — enquanto não existir, o front opera em
   modo `mock` (MSW ativo, badge "Dados de demonstração" visível). O
   coletor sanitizado do Hermes ainda precisa ser publicado como API
   pública somente-leitura antes de mudar `VITE_DATA_MODE=api`.

## 7. Diagnóstico: site fora do ar

Primeiro passo, sempre — separa os modos de falha em um comando:

```bash
curl -sI https://nexus-dashboard-dev.vercel.app/ | grep -iE 'HTTP/|x-vercel-error|location'
```

| Sintoma | Significado | Correção |
|---|---|---|
| `404` + `x-vercel-error: DEPLOYMENT_NOT_FOUND` | Nenhum deployment atende esse hostname. O alias foi liberado (troca de escopo, rename ou remoção do projeto). | Settings → Domains → Add → `nexus-dashboard-dev.vercel.app` |
| `302` + `location: …vercel.com/sso-api…` | O deployment está saudável, mas atrás da autenticação da Vercel. | Settings → Deployment Protection → Vercel Authentication → `Disabled` |
| `200`, mas o HTML é outro conteúdo | O domínio está apontando para outro projeto. | Conferir Domains do projeto correto (§4) |
| `404` sem `x-vercel-error` em uma rota SPA | O rewrite catch-all do `vercel.json` não pegou. | Conferir `rewrites` em `vercel.json` |

O que **não** diagnostica nada: o status do build. Um deploy verde na Vercel
e no GitHub (`gh api repos/<owner>/<repo>/commits/main/status`) é compatível
com o site totalmente inacessível — foi exatamente o caso em 2026-08-06.

Para descobrir a URL real do último deploy de produção sem abrir o painel:

```bash
gh api repos/william-gebowski-dev/Nexus-Dashboard/deployments \
  --jq '.[0].id' \
| xargs -I{} gh api repos/william-gebowski-dev/Nexus-Dashboard/deployments/{}/statuses \
  --jq '.[0].environment_url'
```

## 8. Rollback

Vercel mantém o histórico de deploys; o rollback é um clique no painel.
Localmente, basta `git revert` do commit problemático e `git push`.
