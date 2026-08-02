import crypto from "node:crypto";
import { z } from "zod";
import { getSupabaseServer } from "../_shared/supabaseServer";
import { type ApiRequest, type ApiResponse } from "../_shared/http";

/**
 * Endpoint de escrita do snapshot operacional.
 *
 * O coletor do Hermes (script externo) chama este POST com HMAC-SHA256
 * para popular a tabela `system_status_snapshots`. O GET
 * `/api/system/status` lê a linha resultante.
 *
 * Autenticação segue o mesmo padrão de `/api/ai/ingest.ts`:
 *   - headers `x-nexus-timestamp`, `x-nexus-signature`
 *   - HMAC sobre `${timestamp}.${rawBody}` com secret compartilhado
 *   - drift tolerado: 5 minutos (timestamp replay defense)
 *
 * Diferenças em relação ao ingest:
 *   - sem `x-nexus-idempotency-key`: o upsert (id=1) é naturalmente
 *     idempotente; a última escrita sempre vence.
 *   - payload validado por um schema Zod local (sem sanitize global,
 *     pois os campos aqui vêm do Hermes — fontes controladas).
 *
 * Env var de segredo (servidor): `SYSTEM_STATUS_SECRET`.
 * A Vercel deve compartilhar este valor com o coletor.
 */

const MAX_BODY_BYTES = 64 * 1024; // 64 KiB — payload pequeno, JSON único
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

// === Schema do payload recebido =========================================
// Aceita exatamente os campos que o endpoint público consome. Não impomos
// o `NexusSystemStatusSchema` completo aqui porque queremos que o
// coletor envie apenas o que sabe produzir (counts/technicalSummary)
// sem ter que preencher telemetria de infraestrutura opcional.

const CountsSchema = z.object({
  servicesOperational: z.number().int().nonnegative(),
  servicesAttention: z.number().int().nonnegative(),
  servicesUnavailable: z.number().int().nonnegative(),
  agentsActive: z.number().int().nonnegative(),
  mcpsActive: z.number().int().nonnegative(),
  skillsActive: z.number().int().nonnegative(),
  automationsActive: z.number().int().nonnegative(),
  projectsActive: z.number().int().nonnegative(),
  executionsLast24h: z.number().int().nonnegative(),
});

const TechnicalSummarySchema = z.object({
  activeMcps: z.number().int().nonnegative(),
  activeSkills: z.number().int().nonnegative(),
  activeAgents: z.number().int().nonnegative(),
  runningAutomations: z.number().int().nonnegative(),
  activeContainers: z.number().int().nonnegative(),
  lastSyncAt: z.string().datetime({ offset: true }).nullable(),
  lastBackupAt: z.string().datetime({ offset: true }).nullable(),
  lastFailureAt: z.string().datetime({ offset: true }).nullable(),
});

const StatusWriteSchema = z.object({
  status: z.enum(["operational", "attention_required", "unavailable", "maintenance"]),
  message: z.string().min(1).max(500),
  generatedAt: z.string().datetime({ offset: true }).nullable(),
  lastUpdate: z.string().datetime({ offset: true }).nullable(),
  source: z.enum(["live", "partial", "periodic", "simulated", "unavailable"]).default("live"),
  counts: CountsSchema,
  technicalSummary: TechnicalSummarySchema,
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  // 1. Headers obrigatórios.
  const timestampHeader = req.headers["x-nexus-timestamp"];
  const signatureHeader = req.headers["x-nexus-signature"];

  if (!timestampHeader || !signatureHeader) {
    return res.status(401).json({ error: "Headers de autenticação HMAC ausentes" });
  }
  if (typeof timestampHeader !== "string" || typeof signatureHeader !== "string") {
    return res.status(401).json({ error: "Headers HMAC em formato inválido" });
  }

  // 2. Timestamp drift.
  const reqTime = new Date(timestampHeader).getTime();
  const now = Date.now();
  if (Number.isNaN(reqTime) || Math.abs(now - reqTime) > MAX_TIMESTAMP_DRIFT_MS) {
    return res.status(401).json({ error: "Timestamp expirado ou desalinhado" });
  }

  // 3. Limite de payload.
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (typeof rawBody !== "string" || Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Payload Too Large" });
  }

  // 4. HMAC.
  const secret = process.env.SYSTEM_STATUS_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Segredo de Status não configurado no servidor" });
  }

  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  const provided = Buffer.from(signatureHeader, "hex");
  const expected = Buffer.from(expectedHmac, "hex");

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return res.status(403).json({ error: "Assinatura HMAC inválida" });
  }

  // 5. Schema Zod.
  const parseResult = StatusWriteSchema.safeParse(JSON.parse(rawBody));
  if (!parseResult.success) {
    return res.status(422).json({
      error: "Contrato de payload inválido",
      issues: parseResult.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }

  const payload = parseResult.data;

  // 6. Persistência.
  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (err) {
    console.error("[status-write] Supabase indisponível", (err as Error).message);
    return res.status(500).json({ error: "Persistência indisponível" });
  }

  const { data, error } = await supabase.rpc("upsert_system_status", {
    p_status: payload.status,
    p_message: payload.message,
    p_generated_at: payload.generatedAt,
    p_last_update: payload.lastUpdate,
    p_source: payload.source,
    p_counts: payload.counts,
    p_technical_summary: payload.technicalSummary,
  });

  if (error) {
    console.error("[status-write] erro ao persistir", error.message);
    return res.status(500).json({ error: "Falha ao persistir snapshot" });
  }

  // data = timestamptz string com o `clock_timestamp()` da escrita.
  return res.status(200).json({
    ok: true,
    persistedAt: data,
    status: payload.status,
  });
}
