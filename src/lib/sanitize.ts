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
  // Tailscale (100.64/16 CGNAT). A regex antiga só cobria 100.1xx; agora
  // pega a faixa inteira alocada ao Tailscale (100.64.0.0/10).
  { label: "Tailscale IP (100.64/10)", regex: /100\.(?:6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}/g },
  // IPv4 geral (audit H — só Tailscale estava coberto). Evita 0.0.0.0 e
  // 255.255.255.255 só por ser match literal, mas é raro vazar.
  { label: "IPv4 público/privado", regex: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g },
  // IPv6 (compacta e completa).
  { label: "IPv6", regex: /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g },
  { label: "Anthropic/OpenAI key (sk-)", regex: /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}/g },
  { label: "NVIDIA NIM key (nvapi-)", regex: /\bnvapi-[A-Za-z0-9_-]{16,}/g },
  { label: "GitHub PAT clássico (ghp_)", regex: /\bghp_[A-Za-z0-9]{20,}/g },
  // Fine-grained GitHub PAT (audit H — formato novo).
  { label: "GitHub fine-grained PAT (github_pat_)", regex: /\bgithub_pat_[A-Za-z0-9_]{40,}/g },
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
    // NÃO imprimir os matches — o payload pode conter a própria chave
    // que vazou, e logar isso vaza de novo. Apenas a contagem e o label.
    console.error(
      "[sanitize] vazamento detectado:",
      result.failures.map((f) => ({ label: f.label, count: f.matches.length })),
    );
    throw new Error(
      `Sanitization gate falhou: ${result.failures
        .map((f) => `${f.label} (${f.matches.length})`)
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
  return Array.from(input)
    .filter((char) => {
      if (char === "\n" || char === "\r" || char === "\t") return true;
      return !/[\p{Cc}\p{Cf}]/u.test(char);
    })
    .join("");
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
