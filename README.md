# nexus-public

Saídas públicas da plataforma **Hermes Nexus** — a página de status, sem
segredos. É a visão externa; o painel administrativo interno (`:8100`) fica na
Tailscale e **não** vai para cá.

- **Deploy:** [nexus-public-mu.vercel.app](https://nexus-public-mu.vercel.app)
  (Vercel, a partir deste repositório).
- **Conteúdo:** `index.html` — um snapshot estático de status (serviços,
  execuções, saúde), atualizado periodicamente.

## Gerado automaticamente — não editar à mão

O `index.html` é **produzido e publicado por automação** no monorepo
`hermes-nexus-os` (`scripts/status-page-publish.sh`, disparado pelo timer
systemd `status-page-publish.timer`). Qualquer edição manual aqui é sobrescrita
no próximo ciclo de publicação.

Para mudar o conteúdo ou o visual da página, altere o gerador no monorepo, não
este repositório.
