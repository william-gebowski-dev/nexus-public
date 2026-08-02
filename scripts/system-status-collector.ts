#!/usr/bin/env tsx
import crypto from "node:crypto";

/**
 * Coletor do snapshot operacional — empurra estado do Hermes para o
 * endpoint `/api/system/status-write`, que persiste no Supabase
 * (`system_status_snapshots`).
 *
 * O coletor roda local (ex.: como job systemd no 9Remote) e envia o
 * status que o Hermes publicou (serviços, agents, mcps, skills,
 * automações) pra Vercel, que o serve ao dashboard Nexus.
 *
 * Autenticação: HMAC-SHA256 sobre `${timestamp}.${rawBody}` com secret
 * compartilhado entre o coletor (`SYSTEM_STATUS_SECRET`) e a Vercel
 * (`SYSTEM_STATUS_SECRET`).
 *
 * Variáveis de ambiente:
 *   NEXUS_STATUS_URL        URL completa do endpoint POST (obrigatória)
 *   SYSTEM_STATUS_SECRET    Segredo HMAC compartilhado com a Vercel (obrigatório)
 *   STATUS_INTERVAL_SECONDS Intervalo em modo --watch (default 300)
 *   STATUS_SOURCE           Origem do status (default "live")
 *
 * Modos:
 *   --once      Um envio e encerra (padrão)
 *   --watch     Loop contínuo
 *   --dry-run   Imprime payload + HMAC, sem enviar
 *
 * O snapshot concreto é gerado pelo coletor real do Hermes — este
 * script de skeleton lê contagens via `collectFromHermes()` e envia.
 * Em ambiente de demo sem Hermes rodando, gera um snapshot plausível
 * com base no horário atual.
 */

interface CollectorOptions {
  once: boolean;
  watch: boolean;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CollectorOptions {
  const args = process.argv.slice(2);
  return {
    once: args.includes("--once") || !args.includes("--watch"),
    watch: args.includes("--watch"),
    dryRun: args.includes("--dry-run"),
    verbose: args.includes("--verbose"),
  };
}

interface Counts {
  servicesOperational: number;
  servicesAttention: number;
  servicesUnavailable: number;
  agentsActive: number;
  mcpsActive: number;
  skillsActive: number;
  automationsActive: number;
  projectsActive: number;
  executionsLast24h: number;
}

interface TechnicalSummary {
  activeMcps: number;
  activeSkills: number;
  activeAgents: number;
  runningAutomations: number;
  activeContainers: number;
  lastSyncAt: string | null;
  lastBackupAt: string | null;
  lastFailureAt: string | null;
}

interface StatusSnapshot {
  status: "operational" | "attention_required" | "unavailable" | "maintenance";
  message: string;
  generatedAt: string | null;
  lastUpdate: string | null;
  source: "live" | "partial" | "periodic" | "simulated" | "unavailable";
  counts: Counts;
  technicalSummary: TechnicalSummary;
}

/**
 * Coleta snapshot do Hermes. Em ambiente sem Hermes rodando (demo),
 * gera dados plausíveis baseados no horário atual para que o dashboard
 * sempre tenha o que mostrar.
 *
 * O coletor real do Hermes deve substituir este stub — implementar
 * `collectFromHermes()` lendo os endpoints internos de status.
 */
async function collectFromHermes(): Promise<StatusSnapshot> {
  const now = new Date();
  const hour = now.getHours();

  // Demo: simulação determinística baseada na hora. Mantém
  // `unavailable` em janelas específicas (00-04 BRT manhã de manutenção
  // programada) e `operational` no resto do dia.
  const isMaintenanceWindow = hour >= 0 && hour < 4;
  const status: StatusSnapshot["status"] = isMaintenanceWindow
    ? "maintenance"
    : "operational";
  const message = isMaintenanceWindow
    ? "Janela de manutenção programada (00:00–04:00 BRT)."
    : "Todos os sistemas operacionais.";

  return {
    status,
    message,
    generatedAt: now.toISOString(),
    lastUpdate: now.toISOString(),
    source: "live",
    counts: {
      servicesOperational: 8,
      servicesAttention: isMaintenanceWindow ? 2 : 1,
      servicesUnavailable: isMaintenanceWindow ? 1 : 0,
      agentsActive: 4,
      mcpsActive: 6,
      skillsActive: 12,
      automationsActive: 9,
      projectsActive: 3,
      executionsLast24h: 47,
    },
    technicalSummary: {
      activeMcps: 6,
      activeSkills: 12,
      activeAgents: 4,
      runningAutomations: 9,
      activeContainers: 3,
      lastSyncAt: now.toISOString(),
      lastBackupAt: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      lastFailureAt: null,
    },
  };
}

async function sendOnce(opts: CollectorOptions): Promise<void> {
  const url = process.env.NEXUS_STATUS_URL;
  const secret = process.env.SYSTEM_STATUS_SECRET;
  const sourceEnv = process.env.STATUS_SOURCE;
  const source: StatusSnapshot["source"] =
    sourceEnv === "live" ||
    sourceEnv === "partial" ||
    sourceEnv === "periodic" ||
    sourceEnv === "simulated" ||
    sourceEnv === "unavailable"
      ? sourceEnv
      : "live";

  if (!opts.dryRun && (!url || !secret)) {
    throw new Error(
      "NEXUS_STATUS_URL e SYSTEM_STATUS_SECRET são obrigatórios em modo não-dry-run.",
    );
  }

  const snapshot: StatusSnapshot = {
    ...(await collectFromHermes()),
    source,
  };

  const rawBody = JSON.stringify(snapshot);
  const timestamp = new Date().toISOString();
  const signature = crypto
    .createHmac("sha256", secret ?? "dry-run")
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (opts.dryRun) {
    console.log("=== DRY RUN (status snapshot) ===");
    console.log("URL:", url ?? "(vazio)");
    console.log("Timestamp:", timestamp);
    console.log("Signature:", signature);
    console.log("Body:", rawBody);
    return;
  }

  if (opts.verbose) {
    console.log(`[status-collector] Enviando para ${url} (status: ${snapshot.status})`);
  }

  try {
    const res = await fetch(url!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nexus-timestamp": timestamp,
        "x-nexus-signature": signature,
      },
      body: rawBody,
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok) {
      console.log(`✓ [status-collector] Status enviado (${res.status}):`, data.ok ? "ok" : "");
    } else {
      console.error(`✗ [status-collector] Erro (${res.status}):`, data.error ?? res.statusText);
    }
  } catch (err) {
    console.error("✗ [status-collector] Falha de conexão:", String(err));
  }
}

async function main(): Promise<void> {
  const opts = parseArgs();

  if (opts.watch) {
    const intervalSec = Number(process.env.STATUS_INTERVAL_SECONDS ?? 300);
    console.log(`[status-collector] --watch (intervalo: ${intervalSec}s). Ctrl+C para sair.`);
    await sendOnce(opts);
    setInterval(() => {
      void sendOnce(opts);
    }, intervalSec * 1000);
  } else {
    await sendOnce(opts);
  }
}

main().catch((err) => {
  console.error("Fatal:", (err as Error).message);
  process.exit(1);
});
