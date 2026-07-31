/**
 * Serializers — camada intermediária entre o JSON seed e o handler MSW.
 * Por design, todo o conteúdo público precisa passar por aqui antes de
 * chegar ao front. Isso garante que:
 *
 *   1. Categorias de filtro (subject do usuário) sejam sempre públicas:
 *      o filtro "Tailscale" continua visível na UI, mas o **id** de
 *      qualquer serviço com categoria "tailscale" é reescrito para
 *      "rede-privada". Se a UI mostrar a categoria, o usuário nunca
 *      vê a string "tailscale" como id.
 *
 *   2. Marcas internas (hermes, hermes-core, hermes-gateway,
 *      tailscale-mesh) sejam reescritas em tempo de serialização,
 *      garantindo que mesmo que os seeds contenham essas strings por
 *      engano, o payload público não.
 *
 *   3. O gate de sanitização (regex puras em `sanitize.ts`) continua
 *      sendo a **última** camada — redundância intencional.
 */

const CATEGORY_MAP: Record<string, string> = {
  tailscale: "rede-privada",
  vps: "cloud",
  docker: "containers",
};

// Campos textuais do payload nos quais a marca interna pode aparecer.
// Qualquer ocorrência desses termos é reescrita pela `TEXT_MAP` abaixo.
const TEXTUAL_FIELDS = new Set([
  "name",
  "description",
  "title",
  "objective",
  "role",
  "purpose",
  "origin",
  "currentPhase",
  "nextAction",
  "summary",
  "publicLabel",
  "project",
  "actor",
  "action",
  "result",
  "version",
  "usageLabel",
]);

const TEXT_MAP: Array<[RegExp, string]> = [
  [/Tailscale/gi, "Rede privada"],
  [/tailscale/gi, "rede-privada"],
  [/hermes/gi, "central de agentes"],
  [/\bVPS\b/g, "Cloud"],
  [/\bPostgres\b/g, "Banco relacional"],
  [/\bRedis\b/g, "Cache"],
  [/\bUptime Kuma\b/gi, "Monitor do sistema"],
  [/\bLiteLLM\b/g, "Roteador de modelos"],
];

export function sanitizeCategory(c: string): string {
  return CATEGORY_MAP[c] ?? c;
}

function sanitizeText(text: string): string {
  let out = text;
  for (const [rx, replacement] of TEXT_MAP) {
    out = out.replace(rx, replacement);
  }
  return out;
}

/**
 * Walk profundo em qualquer payload. Para cada campo listado em
 * `TEXTUAL_FIELDS`, aplica a `TEXT_MAP` (renomeia marca → termo público).
 * Para `category`, aplica a `CATEGORY_MAP`.
 */
export function sanitizePayload<T>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => walk(v));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "category" && typeof v === "string") {
        out[k] = sanitizeCategory(v);
      } else if (TEXTUAL_FIELDS.has(k) && typeof v === "string") {
        out[k] = sanitizeText(v);
      } else {
        out[k] = walk(v);
      }
    }
    return out;
  }
  return value;
}
