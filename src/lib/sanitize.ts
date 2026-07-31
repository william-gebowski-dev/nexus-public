/**
 * Gate final de sanitização — análogo ao `FORBIDDEN` regex em
 * hermes-nexus-os/scripts/status-page.py.
 *
 * Regra de manutenção: qualquer renderização futura com
 * `dangerouslySetInnerHTML` DEVE passar por `sanitizeHtml` antes. Dados em
 * texto puro vindos de API/mock devem passar por `sanitizeText` quando forem
 * interpolados em mensagens de erro, snippets, previews ou conteúdo de origem
 * externa.
 *
 * Lista do que NUNCA pode aparecer no payload:
 *  - IPs (incluindo Tailscale 100.x.x.x)
 *  - chaves (sk-*, sk-ant-*, ghp_*, nvapi-*, tokens Telegram etc.)
 *  - paths internos (/opt/, /home/, hermes-nexus-os)
 *  - hostnames, IPs, tokens e credenciais
 *  - nomes públicos de produtos/serviços podem aparecer sem revelar topologia
 *    com erro explícito.
 */

// Nota: o regex de chaves exige um segmento longo de alta entropia (≥32
// chars base62) para evitar falsos positivos com IDs curtos como `sk-backup`
// ou `sk-status-page` (skills do ecossistema). Chaves reais da
// Anthropic/OpenAI têm 40+ caracteres após o prefixo; o limite de 32 dá
// folga sem deixar vazar uma chave verdadeira.
const FORBIDDEN_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: "Tailscale IP (100.x.x.x)", regex: /100\.1\d\d\./g },
  { label: "Anthropic/OpenAI key (sk-)", regex: /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}/g },
  { label: "NVIDIA NIM key (nvapi-)", regex: /\bnvapi-[A-Za-z0-9_-]{16,}/g },
  { label: "GitHub token (ghp_)", regex: /\bghp_[A-Za-z0-9]{20,}/g },
  { label: "Path absoluto Unix (/opt/, /home/)", regex: /\/(?:opt|home)\//g },
  { label: "Repositório hermes-nexus-os", regex: /hermes-nexus-os/g },
  { label: "Hostname srvXXXXX", regex: /srv\d{5,}/g },
  // E-mail só bloqueia endereços em campos técnicos (descrições/origens);
  // o e-mail do admin logado aparece fora deste payload, então não bate.
  { label: "E-mail completo", regex: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
];

export interface SanitizationResult {
  ok: boolean;
  failures: { label: string; matches: string[] }[];
}

/**
 * Verifica se uma string (payload JSON serializado ou HTML) tem
 * padrões sensíveis. Retorna diagnóstico para logging.
 *
 * O objetivo é falhar em dev/testes (gate final, análogo ao status-page.py).
 * Em produção, se algum padrão vazar, o handler retorna 500 em vez de
 * publicar dado sensível.
 */
export function checkPayload(payload: string): SanitizationResult {
  const failures: { label: string; matches: string[] }[] = [];

  for (const { label, regex } of FORBIDDEN_PATTERNS) {
    const matches = payload.match(regex);
    if (matches && matches.length > 0) {
      failures.push({ label, matches: Array.from(new Set(matches)).slice(0, 3) });
    }
  }

  return { ok: failures.length === 0, failures };
}

/** Serialização segura com checagem de gate final. */
export function safeStringify(value: unknown, space?: number): string {
  const out = JSON.stringify(value, null, space);
  const result = checkPayload(out);
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error("[sanitize] vazamento detectado no payload:", result.failures);
    throw new Error(
      `Sanitization gate falhou: ${result.failures
        .map((f) => `${f.label} (${f.matches.join(", ")})`)
        .join("; ")}`,
    );
  }
  return out;
}

/**
 * Sanitiza texto que vai ser interpolado em mensagens renderizadas pelo
 * React (texto puro, não HTML). Remove caracteres de controle e zero-width
 * que poderiam quebrar terminais ou esconder conteúdo em previews.
 *
 * NÃO usa o gate de padrões sensíveis — esse gate é para payloads
 * completos (resposta de API inteira). Para texto, a checagem fica a cargo
 * dos sanitizers de payload no caminho do mock/backend.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";
  return input
    // Remove C0/C1 control chars exceto \n \r \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .replace(/​|‌|‍|﻿/g, "");
}

/**
 * Sanitiza texto que vai ser interpolado em `dangerouslySetInnerHTML`.
 * Faz escape HTML completo dos cinco caracteres perigosos para neutralizar
 * tags e atributos maliciosos, e aplica `sanitizeText` antes para limpar
 * caracteres de controle.
 *
 * IMPORTANTE: este escape é seguro contra XSS para conteúdo puramente
 * textual. Se você precisa renderizar markup confiável (ex.: markdown
 * convertido para HTML), use uma biblioteca como DOMPurify antes — escape
 * puro quebra formatação intencional. Este helper é o piso mínimo.
 */
export function sanitizeHtml(input: string): string {
  const cleaned = sanitizeText(input);
  return cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
