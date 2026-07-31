import type { ReactNode } from "react";

export interface KnowledgeSection {
  /** Slug kebab-case — usado para âncoras e sidebar. */
  id: string;
  /** Rótulo exibido tanto na sidebar quanto no h2. */
  title: string;
  /** Resumo opcional de 1 linha mostrado na sidebar antes do título. */
  summary?: string;
  /** Conteúdo renderizado como JSX. */
  content: ReactNode;
}

export const KNOWLEDGE_LAST_UPDATED = "2026-07-30";

export const KNOWLEDGE_SECTIONS: readonly KnowledgeSection[] = [
  {
    id: "visao-geral",
    title: "Visão geral",
    summary:
      "Propósito do notebook como ambiente principal de IA, separação em duas contas e relação com a central de agentes.",
    content: (
      <>
        <p>
          O objetivo é transformar o notebook com Zorin OS no ambiente
          principal para desenvolvimento, projetos de inteligência
          artificial, agentes e automações, estudos, controle da cloud,
          acesso remoto, gestão dos projetos, execução de tarefas
          recorrentes e operação da carreira.
        </p>
        <p>
          O Kali Linux permanece separado, instalado em um pendrive, para
          estudos e testes relacionados à segurança.
        </p>
        <p>A organização é dividida entre dois ecossistemas:</p>
        <ul>
          <li>
            <code>.geb</code> — uso pessoal, conhecimento e dispositivos.
          </li>
          <li>
            <code>.dev</code> — desenvolvimento, projetos, infraestrutura
            e operação digital.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "dispositivos",
    title: "Equipamentos e sistemas operacionais",
    summary:
      "Notebook principal, Kali no pendrive e demais dispositivos conectados pela rede privada.",
    content: (
      <>
        <h3>Notebook principal</h3>
        <p>
          <strong>Sistema operacional:</strong> Zorin OS.
        </p>
        <p>O notebook é utilizado para:</p>
        <ul>
          <li>desenvolvimento cotidiano</li>
          <li>faculdade</li>
          <li>projetos de IA</li>
          <li>agentes</li>
          <li>automações</li>
          <li>GitHub</li>
          <li>produção de conteúdo</li>
          <li>conexão com a cloud</li>
          <li>acesso remoto</li>
          <li>execução de modelos locais, quando possível</li>
          <li>armazenamento local da memória da central de agentes</li>
          <li>migração gradual de tarefas que rodam na cloud</li>
        </ul>
        <p>
          O Zorin é o sistema <strong>principal</strong>, não um ambiente
          temporário.
        </p>

        <h3>Kali Linux</h3>
        <p>
          <strong>Local:</strong> pendrive separado.
        </p>
        <p>Finalidades:</p>
        <ul>
          <li>estudos de segurança</li>
          <li>testes controlados</li>
          <li>laboratórios</li>
          <li>ferramentas específicas de cibersegurança</li>
          <li>aprendizado técnico</li>
        </ul>
        <p>
          O Kali não é usado como sistema operacional principal nem como
          local central para credenciais, projetos ou arquivos importantes.
        </p>

        <h3>Outros dispositivos</h3>
        <p>O ecossistema também envolve:</p>
        <ul>
          <li>PC principal</li>
          <li>celular</li>
          <li>notebook com Zorin</li>
          <li>cloud</li>
          <li>outros dispositivos conectados pela rede privada</li>
        </ul>
      </>
    ),
  },
  {
    id: "contas",
    title: "Separação das contas",
    summary:
      "A regra .geb para vida pessoal e .dev para projetos técnicos, com fronteiras claras entre as duas.",
    content: (
      <>
        <h3>
          Conta pessoal <code>.geb</code>
        </h3>
        <p>
          <strong>Abreviação oficial:</strong> <code>.geb</code>
        </p>
        <p>Serviços vinculados:</p>
        <ul>
          <li>Notion</li>
          <li>NotebookLM</li>
          <li>Obsidian</li>
          <li>rede privada</li>
          <li>conhecimento pessoal</li>
          <li>estudos</li>
          <li>faculdade</li>
          <li>planejamento pessoal</li>
          <li>dispositivos</li>
          <li>acesso remoto pessoal</li>
        </ul>
        <p>
          A conta <code>.geb</code> representa a pessoa: conhecimento,
          aprendizado, pesquisas, anotações, organização, dispositivos,
          acesso remoto, rede pessoal e informações privadas.
        </p>

        <h3>
          Conta técnica <code>.dev</code>
        </h3>
        <p>
          <strong>Abreviação oficial:</strong> <code>.dev</code>
        </p>
        <p>Serviços e ativos vinculados:</p>
        <ul>
          <li>GitHub</li>
          <li>repositórios</li>
          <li>projetos de IA</li>
          <li>agentes</li>
          <li>automações</li>
          <li>APIs</li>
          <li>serviços técnicos</li>
          <li>cloud</li>
          <li>infraestrutura</li>
          <li>armazenamento técnico</li>
          <li>backups dos projetos</li>
          <li>landing pages</li>
          <li>domínios</li>
          <li>ferramentas de publicação</li>
          <li>métricas</li>
          <li>integrações</li>
          <li>ativos digitais</li>
          <li>operação técnica</li>
          <li>operação comercial dos projetos</li>
        </ul>
        <p>
          A conta <code>.dev</code> representa: desenvolvimento, projetos,
          execução, publicação, infraestrutura, automações, produtos
          digitais e operação comercial.
        </p>

        <h3>Regra resumida</h3>
        <p>
          <code>.geb</code> pensa, pesquisa, organiza e conecta os
          dispositivos.
        </p>
        <p>
          <code>.dev</code> desenvolve, executa, publica e preserva os
          projetos.
        </p>
      </>
    ),
  },
  {
    id: "conhecimento",
    title: "Sistemas de conhecimento",
    summary:
      "Notion, NotebookLM, Obsidian e a rede privada — funções e fronteiras de cada camada.",
    content: (
      <>
        <h3>Notion</h3>
        <p>
          Função principal: painel de organização, gestão de projetos,
          objetivos, prioridades, cronogramas, tarefas de alto nível,
          planejamento pessoal, planejamento de conteúdo e visão geral
          das iniciativas.
        </p>
        <p>
          O Notion funciona como a camada de{" "}
          <strong>gestão e planejamento</strong>.
        </p>

        <h3>NotebookLM</h3>
        <p>
          Função principal: análise de fontes, leitura de livros, leitura
          de PDFs, estudo de artigos, documentação, materiais de cursos,
          comparação de fontes, produção de resumos, sínteses e pesquisa
          assistida por IA.
        </p>
        <p>
          O NotebookLM funciona como a camada de{" "}
          <strong>pesquisa e análise de materiais</strong>.
        </p>

        <h3>Obsidian</h3>
        <p>
          Função principal: segundo cérebro, conhecimento permanente,
          estudos, ideias, aprendizados, anotações, relações entre
          conceitos, referências, decisões pessoais e conhecimento técnico
          selecionado.
        </p>
        <p>
          O Obsidian funciona como a camada de{" "}
          <strong>conhecimento conectado e permanente</strong>.
        </p>
        <p>Dentro do Obsidian, é recomendável manter uma separação entre:</p>
        <ul>
          <li>conteúdo estritamente pessoal</li>
          <li>conhecimento técnico</li>
          <li>materiais que podem ser compartilhados com agentes</li>
          <li>conteúdos que podem virar documentação oficial dos projetos</li>
        </ul>
        <p>
          Foi sugerida a criação de um segundo vault técnico, por
          exemplo: <code>William Dev Knowledge</code>. Esse vault conteria
          somente informações que poderiam ser compartilhadas com agentes
          de IA: visão dos projetos, pesquisas técnicas, decisões,
          referências, arquitetura, resumos, documentação e próximos
          passos.
        </p>
        <p>
          O vault estritamente pessoal <strong>não</strong> deve ser
          entregue integralmente aos agentes.
        </p>

        <h3>Rede privada</h3>
        <p>
          Função principal: rede privada entre dispositivos, acesso
          remoto, conexão entre celular, notebook, PC e cloud, redução da
          necessidade de expor serviços diretamente na internet.
        </p>
        <p>
          A rede privada pertence ao ambiente pessoal porque conecta os
          dispositivos pessoais.
        </p>
      </>
    ),
  },
  {
    id: "engenharia-contexto",
    title: "Engenharia de contexto e ritual de início",
    summary:
      "Documentos Markdown por projeto, ritual de início de tarefa e a memória em três níveis.",
    content: (
      <>
        <p>
          A melhor forma de dar contexto às IAs é utilizar{" "}
          <strong>engenharia de contexto</strong>, principalmente por meio
          de arquivos Markdown organizados em cada projeto.
        </p>
        <pre>
{`Projeto
├── README.md
├── AGENTS.md
├── CLAUDE.md
└── docs
    ├── PRODUCT.md
    ├── ARCHITECTURE.md
    ├── CONTEXT.md
    ├── DECISIONS.md
    └── TASKS.md`}
        </pre>
        <p>Esses arquivos são documentos de orientação, não código.</p>

        <h3>Função de cada arquivo</h3>
        <ul>
          <li>
            <code>README.md</code> — apresentação geral do projeto: o que
            é, problema que resolve, situação atual, estrutura, visão de
            uso e instruções básicas.
          </li>
          <li>
            <code>AGENTS.md</code> — manual principal para os agentes:
            objetivo, forma de trabalho, documentos obrigatórios,
            permissões, restrições, procedimentos de validação, ações que
            exigem autorização e ações proibidas.
          </li>
          <li>
            <code>CLAUDE.md</code> — arquivo específico para o Claude:
            instruções particulares, referência ao AGENTS.md, contexto que
            deve ser carregado e regras específicas da ferramenta.
          </li>
          <li>
            <code>PRODUCT.md</code> — descrição do produto: público,
            problema, proposta de valor, funcionalidades, modelo de
            negócio, métricas e limites de escopo.
          </li>
          <li>
            <code>ARCHITECTURE.md</code> — visão técnica: componentes,
            integrações, serviços, modelos de IA, bancos, fluxos,
            dependências e limites técnicos.
          </li>
          <li>
            <code>CONTEXT.md</code> — resumo executivo do estado atual:
            situação, últimas mudanças, problema atual, riscos,
            bloqueios, próximos passos e documentos relevantes.
          </li>
          <li>
            <code>DECISIONS.md</code> — registro das decisões: decisão
            tomada, justificativa, alternativas descartadas, impactos,
            data e possíveis revisões futuras.
          </li>
          <li>
            <code>TASKS.md</code> — controle operacional: pendências,
            prioridades, tarefas em andamento, bloqueios, critérios de
            conclusão e próximos marcos.
          </li>
        </ul>

        <h3>Ritual de início de tarefa</h3>
        <p>Antes de trabalhar em uma tarefa, o agente deve:</p>
        <ol>
          <li>ler o AGENTS.md</li>
          <li>ler o CONTEXT.md</li>
          <li>consultar o PRODUCT.md</li>
          <li>consultar o ARCHITECTURE.md se a atividade for técnica</li>
          <li>verificar o DECISIONS.md</li>
          <li>verificar o TASKS.md</li>
          <li>analisar apenas os arquivos relevantes</li>
          <li>apresentar um plano antes de alterações importantes</li>
          <li>executar somente o que estiver autorizado</li>
          <li>
            atualizar contexto, decisões e tarefas ao concluir
          </li>
          <li>solicitar revisão humana em ações críticas</li>
        </ol>
        <p>
          A orientação é evitar pedidos vagos como{" "}
          <em>"Analise tudo."</em> O agente deve consultar documentos
          específicos e carregar apenas o contexto necessário.
        </p>

        <h3>Memória em três níveis</h3>
        <p>
          <strong>Memória global</strong> — preferências válidas para
          todos os projetos: comunicação em português, explicar antes de
          alterações importantes, priorizar soluções simples, evitar
          mudanças desnecessárias, não apagar arquivos sem autorização,
          não publicar automaticamente, não expor credenciais, registrar
          decisões relevantes, manter revisão humana e usar um agente
          principal com agentes complementares limitados.
        </p>
        <p>
          <strong>Memória do projeto</strong> — informações duradouras:
          propósito, produto, arquitetura, ferramentas, integrações,
          decisões, restrições, estado atual, riscos e tarefas.
        </p>
        <p>
          <strong>Memória da tarefa</strong> — informações temporárias:
          atividade atual, resultado esperado, arquivos envolvidos,
          prioridade, prazo, critérios de conclusão e validações
          necessárias.
        </p>
      </>
    ),
  },
  {
    id: "modelo-agentes",
    title: "Modelo operacional dos agentes",
    summary:
      "Permissões divididas em três faixas: o que o agente pode, o que precisa pedir e o que nunca pode.",
    content: (
      <>
        <p>A preferência definida é:</p>
        <ul>
          <li>um agente principal</li>
          <li>
            no máximo uma tarefa ou agente complementar por execução
          </li>
          <li>revisão humana</li>
          <li>registro das atividades</li>
          <li>controle de custos</li>
          <li>permissões restritas</li>
          <li>ações críticas somente com aprovação</li>
        </ul>

        <h3>O agente pode fazer</h3>
        <ul>
          <li>ler documentos autorizados</li>
          <li>analisar</li>
          <li>resumir</li>
          <li>organizar</li>
          <li>sugerir</li>
          <li>planejar</li>
          <li>documentar</li>
          <li>executar tarefas reversíveis</li>
          <li>atualizar registros autorizados</li>
        </ul>

        <h3>Precisa pedir autorização</h3>
        <ul>
          <li>alterar arquitetura</li>
          <li>adicionar dependências importantes</li>
          <li>acessar serviços externos</li>
          <li>publicar conteúdo</li>
          <li>enviar mensagens</li>
          <li>gerar despesas</li>
          <li>alterar produção</li>
          <li>excluir arquivos</li>
          <li>copiar dados da .geb para a .dev</li>
          <li>modificar permissões</li>
          <li>alterar infraestrutura</li>
          <li>realizar ações não reversíveis</li>
        </ul>

        <h3>O agente nunca pode</h3>
        <ul>
          <li>revelar credenciais</li>
          <li>publicar informações privadas</li>
          <li>registrar senhas em repositórios</li>
          <li>expor tokens</li>
          <li>enviar documentos pessoais</li>
          <li>apagar backups</li>
          <li>executar ações irreversíveis sem autorização</li>
          <li>misturar dados pessoais e comerciais sem revisão</li>
        </ul>
      </>
    ),
  },
  {
    id: "central-agentes",
    title: "Central de agentes como solução central",
    summary:
      "Por que a central de agentes no notebook substitui a ideia de um app próprio, e como celular, PC e cloud participam.",
    content: (
      <>
        <p>
          Inicialmente foi considerada a criação de um aplicativo próprio
          parecido com o ChatGPT. A motivação é que canais de mensagem
          podem ficar ineficientes no longo prazo por apresentar
          limitações como histórico pouco organizado, mistura de assuntos,
          dificuldade de separar projetos, experiência limitada com
          documentos, pouca visibilidade de tarefas, dificuldade de
          acompanhar agentes, interface pouco adequada para fluxos
          complexos e pouco controle sobre contexto e memória.
        </p>
        <p>
          Foi considerada uma solução completa com aplicativo, banco de
          dados, sincronização, tarefas, agentes, RAG e mecanismos de
          sync. Essa alternativa foi considerada complexa demais para a
          necessidade atual.
        </p>
        <p>
          O objetivo imediato é ter uma experiência mobile melhor para
          utilizar a central de agentes, mantendo o notebook como cérebro
          principal.
        </p>

        <h3>A solução selecionada</h3>
        <pre>
{`Central de agentes no Zorin
  +
WebUI
  +
Rede privada
  =
Central de agentes disponível no celular e no PC`}
        </pre>

        <h3>Papel do Zorin</h3>
        <p>
          O Zorin é o servidor principal da central de agentes: agente,
          memória, conversas, skills, tarefas, projetos, arquivos de
          contexto, histórico, ferramentas, modelos e automações.
        </p>

        <h3>Papel do celular</h3>
        <p>
          O celular é um cliente remoto: chat, histórico, envio de
          mensagens, envio de arquivos, envio de áudio, consulta aos
          projetos, acompanhamento de tarefas, aprovações, interrupção de
          tarefas e continuação de conversas.
        </p>
        <p>O celular não precisa executar a central de agentes completa.</p>

        <h3>Papel do PC</h3>
        <p>
          O PC pode acessar a mesma WebUI: continuar conversas, consultar
          o histórico, acessar projetos, interagir com o mesmo agente e
          visualizar os mesmos dados.
        </p>

        <h3>Papel da rede privada</h3>
        <p>
          A rede privada é a conexão entre celular, Zorin, PC e cloud.
        </p>
        <p>
          A central de agentes não precisa ser exposta diretamente à
          internet.
        </p>
      </>
    ),
  },
  {
    id: "memoria-dados",
    title: "Memória, dados e backup",
    summary:
      "Onde a memória fica, como celular e PC compartilham tudo, e por que o backup é obrigatório.",
    content: (
      <>
        <p>
          Os dados da central de agentes ficam localmente no notebook com
          Zorin, em uma pasta dedicada de dados dentro do diretório do
          usuário.
        </p>

        <h3>Memória permanente</h3>
        <p>
          Dois arquivos Markdown abrigam a memória duradoura: um para
          informações do ambiente, convenções, detalhes importantes dos
          projetos, aprendizados e fatos operacionais; outro para
          preferências, estilo de comunicação, expectativas, perfil do
          usuário e forma de trabalho.
        </p>
        <ul>
          <li>
            <code>MEMORY.md</code> pode conter: informações do ambiente,
            convenções, detalhes importantes dos projetos, aprendizados e
            fatos operacionais.
          </li>
          <li>
            <code>USER.md</code> pode conter: preferências, estilo de
            comunicação, expectativas, perfil do usuário e forma de
            trabalho.
          </li>
        </ul>

        <h3>Conversas e sessões</h3>
        <p>
          Um banco local dedicado armazena sessões, títulos, histórico
          de mensagens, modelos, chamadas de ferramentas, resultados, uso
          de tokens, datas, origens das sessões, custos estimados e
          configuração utilizada.
        </p>

        <h3>Outros conteúdos</h3>
        <p>
          Dentro da estrutura também podem existir: skills, configurações,
          arquivos operacionais, referências, tarefas e outros dados
          criados pelo agente. A estrutura específica pode variar conforme
          versão e configuração.
        </p>

        <h3>Memória compartilhada entre mobile e PC</h3>
        <p>
          Se o celular e o PC acessarem a mesma instalação da central de
          agentes no Zorin, as conversas, a memória, o histórico, as
          tarefas, os projetos, as skills e o workspace são todos
          compartilhados. O celular não possui uma memória independente —
          ele consulta o mesmo servidor.
        </p>
        <p>Situações que criariam memórias separadas:</p>
        <ul>
          <li>instalar a central de agentes completa no celular</li>
          <li>instalar outra instalação independente no PC</li>
          <li>usar servidores diferentes</li>
          <li>usar perfis diferentes</li>
          <li>utilizar diretórios de dados diferentes</li>
          <li>conectar cada dispositivo a um backend separado</li>
        </ul>
        <p>A decisão é manter uma única central de agentes central.</p>

        <h3>Localidade e privacidade</h3>
        <p>
          Os dados ficam locais no Zorin. O celular e o PC somente
          acessam esses dados por meio da WebUI.
        </p>
        <p>
          Mesmo com memória e histórico locais, quando um modelo de IA
          externo é utilizado, o conteúdo necessário para produzir a
          resposta é enviado ao provedor da API. Portanto:
        </p>
        <ul>
          <li>
            armazenamento local não significa processamento totalmente
            local
          </li>
          <li>informações sensíveis devem ser tratadas com cuidado</li>
          <li>
            modelos locais podem ser utilizados para conteúdos privados
          </li>
          <li>
            modelos externos podem ser utilizados em tarefas não
            sensíveis
          </li>
          <li>
            credenciais não devem ser inseridas diretamente nas conversas
          </li>
        </ul>

        <h3>Disponibilidade</h3>
        <p>Se a central de agentes estiver apenas no Zorin:</p>
        <ul>
          <li>funcionará enquanto o notebook estiver ligado</li>
          <li>poderá ficar indisponível durante suspensão</li>
          <li>ficará inacessível quando o notebook estiver desligado</li>
          <li>tarefas locais aguardarão o retorno da máquina</li>
        </ul>
        <p>
          Evolução futura: hospedagem principal na cloud, celular acessa a
          cloud, Zorin executa tarefas locais quando estiver conectado, e
          o histórico principal fica no servidor escolhido. Esta decisão
          não precisa ser tomada agora.
        </p>

        <h3>Backup</h3>
        <p>
          Como os dados ficam no notebook, o backup é{" "}
          <strong>obrigatório</strong>.
        </p>
        <p>
          Conteúdo mínimo do backup: a pasta de memórias e o banco local
          de sessões.
        </p>
        <p>
          Backup recomendado: a pasta completa de dados, podendo incluir
          memória, conversas, preferências, skills, configurações,
          histórico e informações operacionais.
        </p>
        <p>
          A infraestrutura de backup pertence à <code>.dev</code>, mas o
          conteúdo deve ser criptografado, protegido, separado dos
          repositórios públicos, restrito e tratado como informação
          sensível.
        </p>
      </>
    ),
  },
  {
    id: "ordem-configuracao",
    title: "Ordem recomendada de configuração",
    summary:
      "Sequência recomendada para preparar o Zorin, instalar a central de agentes e validar a operação.",
    content: (
      <>
        <ol>
          <li>atualizar o Zorin</li>
          <li>verificar drivers e hardware</li>
          <li>configurar segurança</li>
          <li>organizar os perfis .geb e .dev</li>
          <li>configurar gerenciador de senhas</li>
          <li>ativar autenticação em dois fatores</li>
          <li>configurar GitHub pela .dev</li>
          <li>organizar as pastas dos projetos</li>
          <li>preparar documentos de contexto</li>
          <li>configurar Notion, NotebookLM e Obsidian pela .geb</li>
          <li>configurar a rede privada pela .geb</li>
          <li>conectar o Zorin à cloud</li>
          <li>configurar backups pessoais e técnicos</li>
          <li>testar uma aplicação pequena</li>
          <li>instalar e validar a central de agentes</li>
          <li>configurar a WebUI</li>
          <li>acessar a WebUI pelo celular</li>
          <li>validar memória compartilhada</li>
          <li>testar backup</li>
          <li>migrar gradualmente tarefas da cloud para o notebook</li>
        </ol>
      </>
    ),
  },
  {
    id: "decisoes-pontos",
    title: "Decisões consolidadas e pontos em aberto",
    summary:
      "O que já está decidido, o que ainda precisa de análise e a direção para a IA pessoal.",
    content: (
      <>
        <h3>Decisões atualmente consolidadas</h3>
        <ul>
          <li>Zorin OS é o ambiente principal.</li>
          <li>Kali Linux permanece no pendrive.</li>
          <li>
            <code>.geb</code> é a abreviação da conta pessoal.
          </li>
          <li>
            <code>.dev</code> é a abreviação da conta técnica.
          </li>
          <li>Notion, NotebookLM, Obsidian e a rede privada ficam na .geb.</li>
          <li>GitHub fica na .dev.</li>
          <li>Backups técnicos e dos projetos ficam na .dev.</li>
          <li>
            Materiais pessoais permanecem separados dos projetos.
          </li>
          <li>
            O Obsidian pessoal não deve ser analisado integralmente pelos
            agentes.
          </li>
          <li>
            O contexto técnico deve ser revisado antes de ser
            compartilhado.
          </li>
          <li>Arquivos Markdown serão usados para organizar contexto.</li>
          <li>Um agente principal coordenará as tarefas.</li>
          <li>Ações críticas exigem revisão humana.</li>
          <li>
            A central de agentes no Zorin é a solução preferida para o
            agente pessoal.
          </li>
          <li>A WebUI será usada como interface principal.</li>
          <li>A rede privada conectará celular, PC e Zorin.</li>
          <li>
            A memória oficial da central de agentes ficará local no
            Zorin.
          </li>
          <li>Mobile e PC acessarão a mesma memória.</li>
          <li>Não há necessidade imediata de criar outro GPT completo.</li>
          <li>
            O backup da pasta da central de agentes é essencial.
          </li>
        </ul>

        <h3>Pontos ainda abertos</h3>
        <p>
          <strong>Ambiente técnico:</strong> especificações completas do
          notebook, capacidade de RAM, GPU, armazenamento, compatibilidade
          com modelos locais, estratégia de suspensão e energia,
          necessidade de deixar o notebook ligado e divisão exata entre
          notebook e cloud.
        </p>
        <p>
          <strong>Central de agentes:</strong> versão a ser instalada,
          localização definitiva dos arquivos, estratégia de backup,
          autenticação da WebUI, comportamento de anexos, suporte a áudio,
          modelos de IA usados, fornecedores de API, custos, contexto
          inicial, regras operacionais, skills iniciais e política de
          retenção das conversas.
        </p>
        <p>
          <strong>Conhecimento:</strong> criação ou não de vault técnico
          separado, quais notas podem sair da .geb, processo de revisão,
          integração futura com Notion, integração futura com Obsidian e
          necessidade futura de RAG.
        </p>

        <h3>Direção para a IA pessoal</h3>
        <p>
          Não construir outro GPT agora. Usar a central de agentes no
          Zorin, acessar pelo mobile com a WebUI e manter memória e
          histórico locais, compartilhados entre os dispositivos.
        </p>
        <p>
          Não entregar todo o conhecimento pessoal à IA. Selecionar,
          revisar, documentar e permitir acesso somente ao contexto
          necessário para cada projeto.
        </p>
      </>
    ),
  },
];

export function KnowledgeContent() {
  return (
    <article className="prose-nx space-y-6">
      {KNOWLEDGE_SECTIONS.map((s) => (
        <section
          key={s.id}
          id={s.id}
          className="nx-card p-5 space-y-3 scroll-mt-4"
        >
          <h2 className="font-mono text-lg font-semibold text-text">
            {s.title}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-text-dim">
            {s.content}
          </div>
        </section>
      ))}
    </article>
  );
}
