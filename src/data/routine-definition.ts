import type { RoutineBlock, RoutineTask, RoutineSlot } from "@/types";

export const ROUTINE_TIMEZONE = "America/Sao_Paulo" as const;

const SLOT_SEQUENCE: readonly RoutineSlot[] = ["coletar", "analisar", "produzir", "consolidar"];

const BLOCK_CATALOG: readonly {
  id: number;
  name: string;
  description: string;
  windowStart: string;
  windowEnd: string;
  tasks: readonly { title: string; description: string; scheduledTime: string }[];
}[] = [
  {
    id: 1,
    name: "Planejamento e organização diária",
    description: "Abertura operacional do dia: diagnóstico, priorização, plano e validação do planejamento matinal.",
    windowStart: "00:00",
    windowEnd: "01:30",
    tasks: [
      { title: "Diagnóstico do novo dia", description: "Levar em conta agenda, energia e pendências críticas para iniciar o dia com clareza sobre o cenário.", scheduledTime: "00:00" },
      { title: "Definição de prioridades", description: "Classificar tarefas por impacto e urgência, identificando o que precisa ser entregue no expediente.", scheduledTime: "00:30" },
      { title: "Construção do plano diário", description: "Montar o plano do dia em blocos, alinhando janelas de foco e descansos com as prioridades definidas.", scheduledTime: "01:00" },
      { title: "Validação do planejamento", description: "Conferir dependências, recursos e janelas críticas antes de liberar o plano para execução.", scheduledTime: "01:30" },
    ],
  },
  {
    id: 2,
    name: "Inteligência artificial e tecnologia",
    description: "Bloco dedicado ao monitoramento do ecossistema de IA, agentes, RAG e tendências técnicas aplicáveis.",
    windowStart: "02:00",
    windowEnd: "03:30",
    tasks: [
      { title: "Monitoramento de novidades em IA", description: "Capturar lançamentos, papers e atualizações relevantes de provedores e modelos de fronteira.", scheduledTime: "02:00" },
      { title: "Monitoramento de agentes e RAG", description: "Acompanhar evolução de frameworks de agentes, pipelines RAG e ferramentas de orquestração.", scheduledTime: "02:30" },
      { title: "Análise de aplicabilidade", description: "Avaliar quais novidades têm encaixe real nos projetos em andamento e quais são apenas curiosidade.", scheduledTime: "03:00" },
      { title: "Boletim técnico de IA", description: "Consolidar achados do turno em um boletim curto, priorizando o que merece ação ou estudo.", scheduledTime: "03:30" },
    ],
  },
  {
    id: 3,
    name: "Infraestrutura e agente operacional",
    description: "Bloco de saúde da infraestrutura: hardware, agente operacional, logs e relatórios de estabilidade.",
    windowStart: "04:00",
    windowEnd: "05:30",
    tasks: [
      { title: "Saúde do notebook Orion", description: "Verificar CPU, memória, disco e temperatura do equipamento principal antes do expediente.", scheduledTime: "04:00" },
      { title: "Integridade do agente operacional", description: "Conferir se o agente local responde, se o gateway está ativo e se o roteador de modelos está saudável.", scheduledTime: "04:30" },
      { title: "Logs e falhas operacionais", description: "Varrer logs recentes em busca de erros, exceções recorrentes ou sinais de degradação.", scheduledTime: "05:00" },
      { title: "Relatório de infraestrutura", description: "Fechar o bloco com um relatório curto do estado da infraestrutura e ações pendentes.", scheduledTime: "05:30" },
    ],
  },
  {
    id: 4,
    name: "Estudos e desenvolvimento técnico",
    description: "Bloco focado em estudo contínuo: curadoria, trilha, atividade e preparação da sessão prática do dia.",
    windowStart: "06:00",
    windowEnd: "07:30",
    tasks: [
      { title: "Curadoria de materiais", description: "Selecionar artigos, cursos e documentações alinhados com o foco de estudo do mês atual.", scheduledTime: "06:00" },
      { title: "Organização da trilha de estudos", description: "Atualizar trilha de aprendizado, realocando tópicos conforme progresso e prioridades.", scheduledTime: "06:30" },
      { title: "Definição da atividade de estudo", description: "Escolher uma atividade prática ou teórica de alto impacto para a sessão do dia.", scheduledTime: "07:00" },
      { title: "Preparação da sessão de estudo", description: "Separar material, ambiente e ferramentas para começar a sessão sem atrito.", scheduledTime: "07:30" },
    ],
  },
  {
    id: 5,
    name: "Trabalho e carreira profissional",
    description: "Bloco de organização do trabalho e da carreira: expediente, prioridades, comunicação e monitoramento.",
    windowStart: "08:00",
    windowEnd: "09:30",
    tasks: [
      { title: "Preparação do expediente", description: "Revisar agenda, compromissos e pendências para entrar no expediente com o contexto completo.", scheduledTime: "08:00" },
      { title: "Priorização das entregas", description: "Organizar fila de entregas do dia, separando o que é obrigatório do que é desejável.", scheduledTime: "08:30" },
      { title: "Preparação de comunicações", description: "Rascunhar e revisar e-mails, mensagens e atualizações que precisam sair ao longo do dia.", scheduledTime: "09:00" },
      { title: "Monitoramento de carreira", description: "Conferir indicadores de carreira: posicionamento, portfólio, conversas-chave e oportunidades.", scheduledTime: "09:30" },
    ],
  },
  {
    id: 6,
    name: "Pesquisa de conteúdo",
    description: "Bloco de descoberta e curadoria: tendências, dúvidas do público, seleção e banco de pautas.",
    windowStart: "10:00",
    windowEnd: "11:30",
    tasks: [
      { title: "Descoberta de tendências", description: "Mapear temas em alta nas plataformas-alvo e identificar ganchos com o público certo.", scheduledTime: "10:00" },
      { title: "Pesquisa de dúvidas do público", description: "Coletar dúvidas reais em comentários, fóruns e perguntas frequentes para transformar em pauta.", scheduledTime: "10:30" },
      { title: "Seleção das melhores ideias", description: "Filtrar pautas por relevância, originalidade e potencial de crescimento antes de produzir.", scheduledTime: "11:00" },
      { title: "Formação do banco de pautas", description: "Atualizar o banco de pautas com as melhores ideias do turno, prontas para produção.", scheduledTime: "11:30" },
    ],
  },
  {
    id: 7,
    name: "Produção de conteúdo",
    description: "Bloco de execução do conteúdo do dia: pauta principal, Instagram, LinkedIn e revisão editorial.",
    windowStart: "12:00",
    windowEnd: "13:30",
    tasks: [
      { title: "Desenvolvimento da pauta principal", description: "Construir a peça principal do dia com estrutura, argumentos e exemplos consistentes.", scheduledTime: "12:00" },
      { title: "Produção para Instagram", description: "Adaptar a pauta principal para o formato curto e visual do Instagram do dia.", scheduledTime: "12:30" },
      { title: "Produção para LinkedIn", description: "Adaptar a pauta principal para o tom e o ritmo do LinkedIn, com foco em clareza e autoridade.", scheduledTime: "13:00" },
      { title: "Revisão editorial", description: "Revisar as peças do turno com olhar editorial: clareza, gramática, ritmo e consistência.", scheduledTime: "13:30" },
    ],
  },
  {
    id: 8,
    name: "AI Career Hub e produto",
    description: "Bloco dedicado ao produto principal: pesquisa de necessidades, oportunidades, oferta e roadmap.",
    windowStart: "14:00",
    windowEnd: "15:30",
    tasks: [
      { title: "Pesquisa de necessidades do público", description: "Investigar dores reais do público-alvo que ainda não estão cobertas pela oferta atual.", scheduledTime: "14:00" },
      { title: "Identificação de oportunidades", description: "Cruzar necessidades com o que já existe no mercado para encontrar lacunas aproveitáveis.", scheduledTime: "14:30" },
      { title: "Desenvolvimento da oferta", description: "Avançar na oferta do dia: página, copy, módulo ou fluxo crítico do produto.", scheduledTime: "15:00" },
      { title: "Atualização do roadmap", description: "Atualizar o roadmap com base no que avançou e no que foi aprendido no turno.", scheduledTime: "15:30" },
    ],
  },
  {
    id: 9,
    name: "Marketing, leads e vendas",
    description: "Bloco do funil comercial: monitoramento de leads, qualificação, follow-up e performance comercial.",
    windowStart: "16:00",
    windowEnd: "17:30",
    tasks: [
      { title: "Monitoramento de leads", description: "Acompanhar leads novos, identificar padrões de origem e marcar os mais quentes.", scheduledTime: "16:00" },
      { title: "Qualificação de leads", description: "Classificar leads por fit, intenção e timing para priorizar o atendimento humano.", scheduledTime: "16:30" },
      { title: "Preparação de follow-ups", description: "Preparar follow-ups personalizados para os leads qualificados, com contexto e próxima ação.", scheduledTime: "17:00" },
      { title: "Monitoramento comercial", description: "Fechar o bloco com indicadores comerciais: conversão, ticket médio e gargalos do funil.", scheduledTime: "17:30" },
    ],
  },
  {
    id: 10,
    name: "Projetos e automações",
    description: "Bloco dos projetos em andamento: estado, bloqueios, próximos passos e atualização documental.",
    windowStart: "18:00",
    windowEnd: "19:30",
    tasks: [
      { title: "Estado dos projetos ativos", description: "Revisar o estado atual dos projetos ativos, identificando o que está verde, amarelo ou vermelho.", scheduledTime: "18:00" },
      { title: "Identificação de bloqueios", description: "Mapear bloqueios concretos que estão atrasando entregas ou gerando retrabalho.", scheduledTime: "18:30" },
      { title: "Definição dos próximos passos", description: "Definir próximos passos acionáveis para destravar bloqueios e manter o ritmo dos projetos.", scheduledTime: "19:00" },
      { title: "Atualização da documentação", description: "Atualizar documentação e status dos projetos para refletir o estado real do dia.", scheduledTime: "19:30" },
    ],
  },
  {
    id: 11,
    name: "Conhecimento e sistema pessoal",
    description: "Bloco do sistema pessoal: processamento de informações, organização, formação e base de contexto.",
    windowStart: "20:00",
    windowEnd: "21:30",
    tasks: [
      { title: "Processamento de informações", description: "Transformar inputs do dia em notas estruturadas, capturando aprendizados e decisões.", scheduledTime: "20:00" },
      { title: "Organização no Notion e Obsidian", description: "Mover notas para os lugares certos do vault e do workspace, mantendo o sistema limpo.", scheduledTime: "20:30" },
      { title: "Formação de conhecimento", description: "Sintetizar o que foi aprendido em princípios, frameworks ou modelos reutilizáveis.", scheduledTime: "21:00" },
      { title: "Atualização da base de contexto", description: "Atualizar a base de contexto com os insights do dia para alimentar o agente e futuros prompts.", scheduledTime: "21:30" },
    ],
  },
  {
    id: 12,
    name: "Revisão e encerramento diário",
    description: "Bloco de fechamento: revisão das execuções, avaliação, relatório diário e transição para o dia seguinte.",
    windowStart: "22:00",
    windowEnd: "23:30",
    tasks: [
      { title: "Revisão das execuções", description: "Conferir se todas as tarefas do dia rodaram como esperado e identificar lacunas.", scheduledTime: "22:00" },
      { title: "Avaliação dos resultados", description: "Avaliar qualidade dos resultados entregues, marcando o que funcionou e o que precisa ajuste.", scheduledTime: "22:30" },
      { title: "Preparação do relatório diário", description: "Montar o relatório diário com destaques, descobertas, incidentes e pendências.", scheduledTime: "23:00" },
      { title: "Encerramento e transição", description: "Encerrar o dia com a transição organizada: plano do dia seguinte já rascunhado e ritual feito.", scheduledTime: "23:30" },
    ],
  },
] as const;

const TASK_IDS_BY_INDEX: readonly string[] = Array.from({ length: 48 }, (_, i) => `job-30m-${String(i + 1).padStart(2, "0")}`);

function buildTask(blockId: number, slotIndex: number): RoutineTask {
  const block = BLOCK_CATALOG[blockId - 1];
  const taskMeta = block.tasks[slotIndex - 1];
  const id = TASK_IDS_BY_INDEX[(blockId - 1) * 4 + (slotIndex - 1)];
  const previousId = slotIndex === 1 ? [] : [TASK_IDS_BY_INDEX[(blockId - 1) * 4 + (slotIndex - 2)]];
  return {
    id,
    jobName: id,
    blockId,
    slot: SLOT_SEQUENCE[slotIndex - 1],
    scheduledTime: taskMeta.scheduledTime,
    title: taskMeta.title,
    description: taskMeta.description,
    status: "scheduled",
    provider: "custom",
    model: "9Router",
    delivery: "local",
    dependsOn: previousId,
  };
}

function buildBlock(blockId: number): RoutineBlock {
  const block = BLOCK_CATALOG[blockId - 1];
  const tasks = [1, 2, 3, 4].map((slotIndex) => buildTask(blockId, slotIndex));
  return {
    id: blockId,
    name: block.name,
    windowStart: block.windowStart,
    windowEnd: block.windowEnd,
    tasks,
    status: "scheduled",
    completedCount: 0,
    failedCount: 0,
  };
}

export const ROUTINE_BLOCKS: readonly RoutineBlock[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(buildBlock);

export const TIME_SLOTS: readonly string[] = TASK_IDS_BY_INDEX.map((_, idx) => {
  const blockIdx = Math.floor(idx / 4);
  const slotIdx = idx % 4;
  return BLOCK_CATALOG[blockIdx].tasks[slotIdx].scheduledTime;
});

export const ROUTINE_TASKS: readonly RoutineTask[] = ROUTINE_BLOCKS.flatMap((b) => b.tasks);

export function getTaskByJobId(jobId: string): RoutineTask | undefined {
  return ROUTINE_TASKS.find((t) => t.id === jobId);
}

export function getBlockById(id: number): RoutineBlock | undefined {
  return ROUTINE_BLOCKS.find((b) => b.id === id);
}