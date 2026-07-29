import type { DataSource } from "./service";

export type AgentStatus = "active" | "paused" | "disabled";

export interface Agent {
  id: string;
  name: string;
  /** Função curta (ex.: "Assistente pessoal e orquestrador"). */
  role: string;
  status: AgentStatus;
  /** Modelo canônico (ex.: "glm-5.2", "claude-haiku-4-5-20251001"). */
  model: string;
  /** ISO 8601 — última execução. */
  lastActivityAt: string;
  /** Tarefas concluídas (janela 14d). */
  completedCount: number;
  /** Tarefas com erro (janela 14d). */
  errorCount: number;
  /** Duração média (ms). */
  avgDurationMs: number;
  /** Origem do dado. */
  source: DataSource;
}

export type McpStatus = "connected" | "unavailable";

export interface Mcp {
  id: string;
  name: string;
  /** Categoria do MCP (ex.: "Observabilidade", "Busca"). */
  category: string;
  status: McpStatus;
  /** ISO 8601 — última atividade. */
  lastActivityAt: string;
  source: DataSource;
}

export interface Skill {
  id: string;
  name: string;
  /** Função curta. */
  purpose: string;
  /** Se está habilitada e em uso. */
  active: boolean;
  source: DataSource;
}

export interface ModelInfo {
  id: string;
  /** Nome amigável (ex.: "GLM 5.2"). */
  label: string;
  /** Status: 'available' | 'rate_limited' | 'offline'. */
  status: "available" | "rate_limited" | "offline";
  /** Chamadas (janela 14d). */
  callsLast14d: number;
  source: DataSource;
}
