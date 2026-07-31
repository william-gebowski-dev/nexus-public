/**
 * Source-of-truth para todos os caminhos do painel. Qualquer string de rota
 * no app deve vir daqui — Sidebar, Topbar, SearchCommand, cards, CTAs e
 * links internos. Isso evita o problema visto na auditoria (busca emitindo
 * `/projetos`, `/agentes` etc. e quebrando 404).
 */

export const ROUTES = {
  home: "/",
  routine: "/routine",
  executions: "/executions",
  executionDetail: (id: string) => `/executions/${encodeURIComponent(id)}`,
  infrastructure: "/infrastructure",
  agents: "/agents",
  mcps: "/mcps",
  skills: "/skills",
  automations: "/automations",
  projects: "/projects",
  activities: "/activities",
  knowledge: "/knowledge",
  configs: "/configs",
  admin: "/admin",
  dailyReport: (date: string) => `/reports/daily/${encodeURIComponent(date)}`,
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
