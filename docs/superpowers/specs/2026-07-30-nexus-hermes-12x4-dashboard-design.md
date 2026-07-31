# Nexus Hermes 12×4 Dashboard Design

## 1. Contexto

O projeto alvo é `/home/william/Área de trabalho/dev/nexus-public`, publicado na Vercel como painel Nexus. A stack atual é Vite + React 18 + TypeScript + Tailwind CSS, com TanStack Query para refresh, React Router para rotas e MSW para mock API. O projeto já possui Shell com sidebar fixa no desktop e drawer mobile, tokens visuais Nexus em `src/styles/tokens.css`, sanitização de mocks em `src/lib/sanitize.ts` e documento legado preservado em `/docs`.

A página inicial atual é um painel operacional genérico. Ela não deve continuar como documento nem como landing page. A nova página inicial deve funcionar como centro de comando para monitorar a rotina automatizada Hermes Agent 12×4.

A rotina Hermes real possui:

- 12 blocos operacionais;
- 4 tarefas por bloco;
- 48 execuções por dia;
- execução a cada 30 minutos;
- primeira execução às `00:00`;
- última execução às `23:30`;
- jobs existentes de `job-30m-01` a `job-30m-48`;
- configuração atual dos 48 jobs: `provider=custom`, `model=9Router`, `deliver=local`.

O frontend não deve criar jobs nem permitir alterações críticas do Hermes nesta primeira versão.

---

## 2. Decisão de produto

A abordagem escolhida é híbrida:

- A home (`/`) será pública/sanitizada e mostrará um estado operacional seguro do Hermes.
- Áreas sensíveis, logs completos, ações críticas e detalhes privados ficarão bloqueados, resumidos ou preparados para autenticação futura.
- A documentação anterior será preservada fora da home em `/knowledge` e `/docs`.

Esta versão deve usar dados mockados centralizados enquanto as APIs reais não estiverem disponíveis, mas a arquitetura deve permitir troca simples para backend real.

---

## 3. Objetivo UX

Ao abrir `/`, o usuário deve entender o estado geral do Hermes em menos de 10 segundos:

1. O sistema está operacional?
2. Quantos dos 48 jobs estão ativos?
3. Qual execução está acontecendo agora?
4. Qual é a próxima execução?
5. O dia está avançando normalmente?
6. Houve falhas?
7. O gateway e o cron estão saudáveis?
8. Quais artefatos ou resultados foram produzidos?
9. Há decisões humanas pendentes?

A interface deve parecer um sistema operacional de acompanhamento, não uma landing page nem um documento Markdown.

---

## 4. Identidade visual

Usar os tokens já existentes em `src/styles/tokens.css`, que correspondem à identidade solicitada:

```yaml
name: Nexus
colors:
  primary: "#C6613F"
  secondary: "#3898EC"
  accent: "#D97757"
  background: "#F0EEE6"
  textPrimary: "#141413"
  textSecondary: "#6B7280"
  link: "#D97757"
  inverse: "#FFFFFF"
  surface: "#FFFFFF"
```

Direção visual:

- minimalista;
- profissional;
- tecnológica;
- elegante;
- inspirada na linguagem visual da Anthropic;
- bordas discretas;
- poucas sombras;
- espaçamento amplo;
- tipografia legível;
- hierarquia forte;
- sem gradientes chamativos;
- sem excesso de ícones;
- sem aparência genérica SaaS.

A base atual em `globals.css` possui um radial gradient discreto no `body`. Ele pode permanecer se não competir com o dashboard; se poluir a leitura, reduzir sua opacidade.

---

## 5. Navegação e rotas

Atualizar a navegação principal para os itens oficiais:

1. Visão geral — `/`
2. Rotina 12×4 — `/routine`
3. Execuções — `/executions`
4. Infraestrutura — `/infrastructure`
5. Agentes — `/agents`
6. MCPs — `/mcps`
7. Skills — `/skills`
8. Automações — `/automations`
9. Projetos — `/projects`
10. Atividades — `/activities`
11. Conhecimento — `/knowledge`
12. Configurações — `/settings`

Para compatibilidade com rotas portuguesas existentes, manter redirects ou aliases:

- `/infraestrutura` → `/infrastructure`
- `/agentes` → `/agents`
- `/automacoes` → `/automations`
- `/projetos` → `/projects`
- `/atividades` → `/activities`
- `/execucoes` → `/executions`
- `/configuracoes` → `/settings`

O documento legado atual permanece em `/docs`. A rota `/knowledge` deve funcionar como área documental sanitizada/protegida e não como home.

---

## 6. Arquitetura de dados

Separar definição fixa da rotina dos dados dinâmicos de execução.

### 6.1 Definição estática

Criar:

```text
src/data/routine-definition.ts
```

Responsável por exportar os 12 blocos oficiais e suas 48 tarefas, incluindo:

- número do bloco;
- nome do bloco;
- horário do bloco;
- `jobName`;
- horário da tarefa;
- título;
- descrição;
- etapa do fluxo (`collect`, `analyze`, `produce`, `consolidate`);
- dependências entre tarefas via `dependsOn`.

Cada bloco deve ter exatamente 4 tarefas. O arquivo deve ser a fonte única para validar a estrutura 12×4.

### 6.2 Dados mockados

Criar:

```text
src/data/mock-routine.ts
```

Responsável por exportar mocks sanitizados para:

- `SystemStatus`;
- `CronStatus`;
- `RoutineDay`;
- execuções recentes;
- infraestrutura;
- atividades;
- artefatos;
- relatório diário;
- agentes;
- MCPs;
- skills;
- automações;
- projetos.

Incluir:

```ts
export const USE_MOCK_DATA = true;
```

Quando `USE_MOCK_DATA` for verdadeiro, a interface deve exibir discretamente `Dados de demonstração`.

### 6.3 Serviços de API

Evoluir `src/services/nexus-api.ts` para expor endpoints sugeridos:

```text
GET /api/system/status
GET /api/cron/status
GET /api/routine/today
GET /api/routine/:date
GET /api/executions
GET /api/executions/:id
GET /api/activities
GET /api/infrastructure
GET /api/reports/daily/:date
GET /api/projects
GET /api/agents
GET /api/mcps
GET /api/skills
```

Enquanto não houver backend real, MSW deve responder usando `src/data/mock-routine.ts` ou adapters que convertem esses dados para o contrato público.

---

## 7. Tipos TypeScript

Criar ou expandir tipos em:

```text
src/types/nexus.ts
```

Tipos obrigatórios:

```ts
type ExecutionStatus =
  | "scheduled"
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled"
  | "skipped"
  | "unknown";
```

Traduções obrigatórias:

```ts
scheduled = "Agendado"
running = "Em execução"
completed = "Concluído"
partial = "Parcial"
failed = "Falhou"
cancelled = "Cancelado"
skipped = "Ignorado"
unknown = "Sem dados"
```

Também criar:

- `SystemStatus`
- `CronStatus`
- `RoutineDay`
- `RoutineBlock`
- `RoutineTask`
- `Execution`
- `ExecutionResult`
- `InfrastructureService`
- `AvailabilityRecord`
- `Activity`
- `GeneratedArtifact`
- `DailyReport`
- `Agent`
- `MCP`
- `Skill`
- `Automation`
- `Project`

Estrutura mínima de `RoutineTask`:

```ts
interface RoutineTask {
  id: string;
  jobName: string;
  blockId: number;
  scheduledTime: string;
  title: string;
  description: string;
  status: ExecutionStatus;
  provider: string;
  model: string;
  delivery: string;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
  dependsOn?: string[];
  projectId?: string;
  resultSummary?: string;
  artifactIds?: string[];
}
```

O tipo antigo `ExecutionStatus = "success" | "running" | "failed" | "cancelled" | "queued"` deve ser migrado ou adaptado para o enum oficial. Não deixar dois conceitos incompatíveis sem mapper explícito.

---

## 8. Hooks

Criar hooks específicos, mantendo TanStack Query e `REFRESH_MS`:

```text
src/hooks/useSystemStatus.ts
src/hooks/useCronStatus.ts
src/hooks/useRoutine.ts
src/hooks/useExecutions.ts
src/hooks/useActivities.ts
```

Responsabilidades:

- Encapsular chamadas de API.
- Expor `isLoading`, `isFetching`, `isError`, `data`, `refetch`.
- Não montar dados falsos dentro dos componentes.
- Preparar troca de mock para API real.

`useNexusDashboard` pode continuar existindo, mas deve ser simplificado para compor os hooks novos ou ser substituído por hooks específicos na home.

---

## 9. Página inicial `/`

Reconstruir `src/pages/Overview.tsx` como dashboard Hermes-first.

### 9.1 Ordem das seções

1. Cabeçalho operacional.
2. Indicadores principais.
3. Card “Agora no Hermes”.
4. Progresso diário 12×4.
5. Saúde do Hermes Cron.
6. Infraestrutura crítica.
7. Disponibilidade.
8. Execuções recentes, limitado a 10.
9. Atividades recentes.
10. Artefatos gerados.
11. Relatório diário.
12. Decisões humanas necessárias.

### 9.2 Cabeçalho

Mostrar:

- `Nexus`;
- `Centro operacional do ecossistema Hermes`;
- estado geral em linguagem humana;
- data e hora atual;
- última atualização;
- botão `Atualizar`;
- indicador de sincronização;
- próxima execução prevista.

Exemplos de mensagens permitidas:

- `Todos os 48 jobs estão ativos.`
- `Uma execução falhou nas últimas 24 horas.`
- `O gateway não respondeu à última verificação.`

Evitar mensagens vagas como `Sistema parcialmente degradado` sem explicação.

### 9.3 Indicadores principais

Cards compactos para:

- Jobs ativos;
- Execuções concluídas hoje;
- Execuções com erro;
- Blocos concluídos;
- Agentes ativos;
- MCPs ativos;
- Skills ativas;
- Automações ativas.

Valores vêm de `RoutineDay`, `CronStatus` e entidades relacionadas; não hardcodar nos componentes.

### 9.4 Card “Agora no Hermes”

Componente prioritário:

```text
Agora
19:00
Definição dos próximos passos
Bloco 10 — Projetos e automações
Em execução há 4 minutos
```

Mostrar:

- horário;
- nome da tarefa;
- bloco;
- descrição curta;
- estado;
- tempo de execução;
- job relacionado;
- provider;
- modelo;
- delivery;
- botão `Abrir execução`.

Também mostrar próxima execução:

```text
Próxima execução
19:30
Atualização da documentação
```

Quando não houver tarefa ativa:

```text
Nenhuma execução ativa no momento
```

### 9.5 Progresso diário 12×4

Criar visualização horizontal do dia completo, com os 12 blocos:

```text
00h 02h 04h 06h 08h 10h 12h 14h 16h 18h 20h 22h
```

Cada bloco mostra:

- número;
- nome;
- horário;
- estado;
- progresso das 4 tarefas;
- quantidade concluída;
- quantidade com erro.

Estados possíveis:

- Concluído;
- Em execução;
- Parcial;
- Pendente;
- Falhou;
- Ignorado;
- Sem dados.

No mobile, rolagem horizontal deve existir apenas nesse componente, sem scroll horizontal global.

---

## 10. Página `/routine`

Criar `src/pages/Routine.tsx` ou reconstruir se já existir.

Cada bloco será um componente expansível.

### 10.1 Bloco fechado

Mostrar:

- nome;
- horário;
- progresso;
- estado;
- duração total;
- quantidade de erros.

### 10.2 Bloco aberto

Mostrar as 4 tarefas com:

- número do job;
- horário;
- nome;
- objetivo;
- estado;
- início real;
- fim real;
- duração;
- provider;
- modelo;
- delivery;
- resultado resumido;
- artefatos gerados;
- projeto relacionado;
- botão `Abrir logs`.

O botão `Abrir logs` não deve revelar logs reais nesta versão pública. Ele pode abrir um estado bloqueado/sanitizado:

```text
Logs detalhados exigem autenticação.
```

### 10.3 Dependências

Representar visualmente dentro de cada bloco:

```text
Coletar → Analisar → Produzir → Consolidar
```

Cada tarefa após a primeira deve ter `dependsOn` apontando para a anterior:

```json
{
  "id": "job-30m-38",
  "dependsOn": ["job-30m-37"]
}
```

Se uma dependência falhar, mostrar:

- `Aguardando resultado da tarefa anterior`; ou
- `Executada com contexto incompleto`.

---

## 11. Página `/executions`

Manter paginação. A home deve mostrar somente 10 execuções recentes.

Na página completa:

- usar paginação;
- não carregar milhares de execuções;
- filtros por data, estado, bloco, job, projeto e agente;
- desktop em tabela;
- mobile em cards.

Colunas desktop:

- horário;
- job;
- tarefa;
- bloco;
- duração;
- estado;
- ação.

Estados devem mostrar texto e indicação visual acessível; nunca depender só de cor.

---

## 12. Infraestrutura e Hermes Cron

### 12.1 Hermes Cron

Criar seção específica com:

- gateway ativo/inativo;
- jobs ativos;
- total de jobs;
- próxima execução;
- último heartbeat;
- última execução;
- última falha;
- provider atual;
- modelo atual;
- delivery atual.

Exemplo de contrato:

```ts
interface CronStatus {
  gatewayRunning: boolean;
  activeJobs: number;
  totalJobs: number;
  nextRunAt: string;
  heartbeatSecondsAgo: number;
  lastExecutionAt?: string;
  lastFailureAt?: string;
  provider: string;
  model: string;
  delivery: string;
}
```

### 12.2 Infraestrutura

Cards para:

- Orion;
- Hermes Agent;
- Hermes Gateway;
- 9Router;
- Docker;
- Tailscale;
- Ollama;
- Banco de dados;
- Scheduler cron;
- Armazenamento local.

Cada serviço mostra:

- estado;
- última verificação;
- disponibilidade;
- versão quando aplicável;
- CPU;
- memória;
- armazenamento;
- tempo online;
- incidentes recentes.

Não repetir uptime em todos os lugares. Mostrar uptime real apenas no card principal de infraestrutura.

### 12.3 Disponibilidade

Reutilizar e evoluir `AvailabilityStrip` para linhas legíveis com blocos não finos demais.

Mostrar:

- últimas 24 horas;
- últimos 7 dias;
- percentual de disponibilidade;
- última interrupção;
- tempo acumulado indisponível.

Estados:

- Operacional;
- Instabilidade;
- Indisponível;
- Sem dados.

---

## 13. Atividades, artefatos e relatório diário

### 13.1 Atividades recentes

Timeline compacta com:

- origem;
- ação;
- horário;
- estado;
- projeto relacionado;
- link para detalhes.

Exemplos sanitizados:

- `Hermes concluiu “Estado dos projetos ativos”`;
- `Scheduler iniciou job-30m-38`;
- `9Router respondeu em 4,2 segundos`;
- `Uma execução falhou no Bloco 3`;
- `Relatório diário foi salvo`.

### 13.2 Artefatos gerados

Listar artefatos como:

- relatórios;
- boletins;
- roteiros de estudo;
- pautas;
- conteúdos;
- roadmaps;
- registros de leads;
- atualizações de projetos;
- notas de conhecimento;
- relatório diário.

Cada item mostra:

- nome;
- tipo;
- job de origem;
- data;
- projeto;
- caminho lógico;
- botão abrir.

Não expor paths absolutos privados. Converter caminhos internos em identificadores seguros, por exemplo:

```text
artifact://daily/2026-07-30/report
```

### 13.3 Relatório diário

Card específico com:

- execuções previstas;
- execuções concluídas;
- execuções com erro;
- blocos completos;
- principais entregas;
- principais descobertas;
- incidentes;
- pendências;
- decisões humanas necessárias.

Preparar rota:

```text
/reports/daily/:date
```

Nesta versão, a rota pode exibir mock sanitizado ou estado de acesso restrito.

---

## 14. Estados obrigatórios

Todas as áreas novas devem tratar:

- loading;
- skeleton loading;
- erro;
- sem dados;
- dados desatualizados;
- atualização;
- sucesso;
- API indisponível.

Mensagens permitidas:

- `Não foi possível atualizar os dados do Hermes.`
- `Nenhuma execução encontrada para este período.`
- `Os dados podem estar desatualizados.`

Não exibir stack trace, JSON bruto ou erro técnico diretamente ao usuário.

---

## 15. Segurança e sanitização

Nunca expor no frontend público:

- tokens;
- chaves de API;
- senhas;
- chat IDs;
- IP público;
- credenciais;
- variáveis de ambiente;
- caminhos absolutos privados;
- configurações sensíveis;
- conteúdo integral de logs sem sanitização;
- prompts internos com informações privadas.

Ações bloqueadas nesta versão:

- excluir job;
- alterar provider;
- alterar modelo;
- alterar delivery;
- reiniciar serviços;
- editar cron;
- enviar mensagens externas.

Botões de ação crítica devem estar ausentes ou mostrar mensagem de acesso restrito.

Manter o gate existente:

- tipos públicos sem campos sensíveis;
- mocks sanitizados;
- `sanitizePayload`;
- `safeStringify`;
- `scripts/check-mocks.js`.

Adicionar mocks novos ao gate de sanitização.

---

## 16. Responsividade

O mobile deve ser desenhado como experiência própria:

- sidebar vira menu lateral recolhível;
- cards em uma coluna;
- header compacto;
- KPIs em grade 2×N ou lista compacta;
- tabelas viram cards;
- timeline diária tem rolagem interna;
- filtros ficam recolhíveis;
- botões têm área de toque adequada;
- sem scroll horizontal global;
- sem textos cortados;
- sem métricas espremidas;
- sem gráficos ilegíveis.

Testar larguras:

```text
320 px
375 px
390 px
768 px
1024 px
1440 px
```

---

## 17. Componentes sugeridos

Criar ou evoluir:

```text
src/components/dashboard/SystemHeader.tsx
src/components/dashboard/PrimaryKpiGrid.tsx
src/components/dashboard/NowInHermesCard.tsx
src/components/dashboard/HermesCronCard.tsx
src/components/dashboard/DailyReportCard.tsx

src/components/routine/DailyRoutineTimeline.tsx
src/components/routine/RoutineBlockCard.tsx
src/components/routine/RoutineTaskRow.tsx
src/components/routine/TaskDependencyFlow.tsx

src/components/executions/ExecutionStatusBadge.tsx
src/components/executions/ExecutionFilters.tsx
src/components/executions/RecentExecutionsPanel.tsx
src/components/executions/ExecutionMobileCard.tsx

src/components/infrastructure/InfrastructureGrid.tsx
src/components/availability/AvailabilityPanel.tsx
src/components/activities/ActivityTimeline.tsx
src/components/reports/GeneratedArtifactsList.tsx
src/components/shared/RestrictedAction.tsx
src/components/shared/MockDataBadge.tsx
```

Reutilizar componentes existentes quando fizer sentido:

- `KpiCard`;
- `Pill`;
- `LoadingSkeleton`;
- `ErrorState`;
- `EmptyState`;
- `AvailabilityStrip`;
- `InfrastructureServiceCard`.

---

## 18. Critérios de aceitação

Antes de concluir a implementação:

1. A rota `/` mostra dashboard operacional Hermes 12×4, não documentação.
2. A rota `/routine` existe e mostra 12 blocos expansíveis.
3. Existem exatamente 12 blocos na definição estática.
4. Cada bloco possui exatamente 4 tarefas.
5. Existem exatamente 48 tarefas/jobs de `job-30m-01` a `job-30m-48`.
6. Os horários vão de `00:00` a `23:30` em intervalos de 30 minutos.
7. Todos os jobs mockados usam `provider=custom`, `model=9Router`, `delivery=local`.
8. A home mostra execução atual e próxima execução.
9. A home mostra timeline diária dos 12 blocos.
10. A home mostra somente as 10 execuções mais recentes.
11. A página `/executions` usa paginação e filtros.
12. Dados mockados ficam centralizados em `src/data/mock-routine.ts`.
13. Definição fixa fica separada em `src/data/routine-definition.ts`.
14. Nenhum componente contém dados falsos hardcoded.
15. Nenhuma informação sensível é pública.
16. A aplicação está preparada para APIs reais via `nexus-api.ts`.
17. Conteúdo documental anterior permanece fora da home em `/knowledge` ou `/docs`.
18. A responsividade funciona em 320, 375, 390, 768, 1024 e 1440 px.
19. Loading, erro, vazio, desatualizado e API indisponível possuem estados de UI.
20. `npm run typecheck`, `npm run lint`, `npm run check:mocks` e `npm run build` passam.

---

## 19. Fora do escopo desta primeira versão

- Criar jobs Hermes pelo frontend.
- Editar provider/model/delivery pelo dashboard.
- Reiniciar gateway ou serviços.
- Enviar Telegram.
- Mostrar logs completos.
- Mostrar prompts internos completos.
- Exibir caminhos absolutos locais.
- Conectar API real do Hermes se ela ainda não estiver disponível.
- Implementar autenticação completa se o projeto atual não estiver pronto; preparar áreas restritas é suficiente.

---

## 20. Próximo passo

Após aprovação desta spec, criar um plano de implementação com `superpowers:writing-plans`, quebrando o trabalho em tarefas pequenas:

1. Tipos + definição estática 12×4.
2. Mocks + API service/hooks.
3. Componentes base de status e rotina.
4. Reconstrução da home.
5. Página `/routine`.
6. Ajustes em `/executions`.
7. Preservação documental/rotas.
8. Responsividade, sanitização e verificação final.
