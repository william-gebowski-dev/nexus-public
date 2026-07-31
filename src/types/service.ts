/**
 * Tipos das entidades que alimentam o dashboard.
 *
 * IMPORTANTE (privacidade): os tipos **não carregam** campos que poderiam
 * vazar infraestrutura. Nenhum Service, Agent, Project etc. tem props
 * para IPs, paths, tokens, prompts, chat IDs. Toda entrada do tipo já
 * chega sanitizada.
 *
 * Convenções de status (todas canônicas, alinhadas com o status-page.py
 * do monorepo):
 *  - Estado geral do sistema: 'operational' | 'attention' | 'unstable'
 *    | 'unavailable' | 'no_recent_data'.
 *  - Estados de serviço/IA: 'healthy' | 'attention' | 'down'.
 *  - Estados de execução: 'success' | 'running' | 'failed' | 'cancelled' | 'queued'.
 *  - Estados de projeto: 'planning' | 'development' | 'validation'
 *    | 'operational' | 'paused' | 'archived'.
 *  - Prioridade: 'critical' | 'high' | 'medium' | 'low'.
 *  - Severidade de alerta: 'info' | 'warning' | 'critical'.
 *  - Fonte do dado: 'live' | 'periodic' | 'manual' | 'simulated'.
 */

export type ServiceCategory =
  | "vps"
  | "docker"
  | "tailscale"
  | "web"
  | "database"
  | "api"
  | "bot"
  | "automation"
  | "ai"
  | "cloud"
  | "containers"
  | "rede-privada";

export type ServiceStatus = "healthy" | "attention" | "down";

export type DataSource = "live" | "periodic" | "manual" | "simulated";

export interface Service {
  /** Identificador interno, kebab-case. Nunca exposto na UI pública. */
  id: string;
  /** Nome amigável exibido. */
  name: string;
  /** Categoria canônica para filtro. */
  category: ServiceCategory;
  /** Estado atual. */
  status: ServiceStatus;
  /** Latência mediana (ms). */
  latencyMs: number;
  /** Disponibilidade em % (0..100), janela 30d. */
  availabilityPct: number;
  /** ISO 8601 — última verificação. */
  lastCheckedAt: string;
  /** Descrição curta sanitizada. */
  description: string;
  /** Tendência curta: 'up' | 'down' | 'flat'. */
  trend: "up" | "down" | "flat";
  /** Sparkline 24h (12 pontos, 0..100). */
  sparkline24h: number[];
  /** Barras de uptime 7d (7 booleanos). */
  uptime7d: boolean[];
  /** Origem do dado. */
  source: DataSource;
}
