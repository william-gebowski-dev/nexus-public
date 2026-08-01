import crypto from "node:crypto";
import { AiIngestPayloadSchema } from "../../src/lib/schemas";
import { checkPayload } from "../../src/lib/sanitize";

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => { json: (body: unknown) => void };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const timestampHeader = getHeader(req.headers, "x-nexus-timestamp");
  const signatureHeader = getHeader(req.headers, "x-nexus-signature");
  const idempotencyHeader = getHeader(req.headers, "x-nexus-idempotency-key");

  if (!timestampHeader || !signatureHeader || !idempotencyHeader) {
    return res.status(401).json({ error: "Headers de autenticação HMAC ausentes" });
  }

  // 1. Timestamp Drift Verification (max 5 minutes)
  const reqTime = new Date(timestampHeader).getTime();
  const now = Date.now();
  if (isNaN(reqTime) || Math.abs(now - reqTime) > 300_000) {
    return res.status(401).json({ error: "Timestamp expirado ou desalinhado (>5 minutos)" });
  }

  // 2. HMAC-SHA256 Signature Verification
  const secret = process.env.AI_INGEST_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Segredo de Ingestão não configurado no servidor" });
  }

  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedHmac))) {
    return res.status(403).json({ error: "Assinatura HMAC inválida" });
  }

  // 3. Data Sanitization Check
  const sanitization = checkPayload(rawBody);
  if (!sanitization.ok) {
    return res.status(400).json({
      error: "Payload contém dados sensíveis não sanitizados",
      details: sanitization.failures.map((f) => f.label),
    });
  }

  // 4. Zod Schema Validation
  const parseResult = AiIngestPayloadSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(422).json({
      error: "Contrato de payload inválido",
      issues: parseResult.error,
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Snapshot de observabilidade ingerido com sucesso",
    idempotencyKey: idempotencyHeader,
    receivedAt: new Date().toISOString(),
  });
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | null {
  const val = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(val)) return val[0] ?? null;
  return val ?? null;
}
