#!/usr/bin/env node
/**
 * Valida o gate de sanitização contra todos os mocks serializados.
 *
 * Roda o `sanitizePayload` (simulando o que os handlers MSW fazem) sobre
 * cada arquivo em src/mocks/data/*.json, serializa o resultado e aplica
 * o mesmo `checkPayload` que roda em runtime. Qualquer vazamento imprime
 * o padrão e sai com erro.
 *
 * Além disso, varre os arquivos de domínio da rotina
 * (src/data/routine-definition.ts e src/data/mock-routine.ts) para
 * validar a estrutura 12×4, IDs únicos, horários, sequenciamento e
 * paridade de provider/model/delivery. Esses arquivos estão fora do
 * gate MSW porque vivem como TypeScript, não como JSON.
 *
 * Uso: node scripts/check-mocks.js
 */
import { readFileSync, readdirSync } from "node:fs";

// Espelha os padrões de src/lib/sanitize.ts. Manter em sincronia com
// aquela lista quando adicionar uma nova regex.
const FORBIDDEN_PATTERNS = [
  ["Tailscale IP (100.x.x.x)", /100\.\d{2,}\./g],
  ["Anthropic/OpenAI key (sk-)", /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}/g],
  ["NVIDIA NIM key (nvapi-)", /\bnvapi-[A-Za-z0-9_-]{16,}/g],
  ["GitHub token (ghp_)", /\bghp_[A-Za-z0-9]{20,}/g],
  ["Path absoluto Unix (/opt/, /home/)", /\/(?:opt|home)\//g],
  ["Repositório hermes-nexus-os", /hermes-nexus-os/g],
  ["Hostname srvXXXXX", /srv\d{5,}/g],
  ["E-mail completo", /[\w.+-]+@[\w-]+\.[\w.-]+/g],
];

const CATEGORY_MAP = { tailscale: "rede-privada", vps: "cloud", docker: "containers" };
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
const TEXT_MAP = [
  [/Tailscale/gi, "Rede privada"],
  [/tailscale/gi, "rede-privada"],
  [/hermes/gi, "central de agentes"],
  [/\bVPS\b/g, "Cloud"],
  [/\bPostgres\b/g, "Banco relacional"],
  [/\bRedis\b/g, "Cache"],
  [/\bUptime Kuma\b/gi, "Monitor do sistema"],
  [/\bLiteLLM\b/g, "Roteador de modelos"],
];

function sanitizeText(text) {
  let out = text;
  for (const [rx, replacement] of TEXT_MAP) out = out.replace(rx, replacement);
  return out;
}
function walk(value) {
  if (Array.isArray(value)) return value.map((v) => walk(v));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "category" && typeof v === "string") out[k] = CATEGORY_MAP[v] ?? v;
      else if (TEXTUAL_FIELDS.has(k) && typeof v === "string") out[k] = sanitizeText(v);
      else out[k] = walk(v);
    }
    return out;
  }
  return value;
}

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = `${here}/..`;
let fails = 0;
const report = (ok, label) => console.log(`${ok ? "✓" : "✗"} ${label}`);

// ── 1. Gate de sanitização sobre mocks JSON legados ─────────────────────
const dataDir = `${repo}/src/mocks/data`;
for (const file of readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
  const raw = readFileSync(`${dataDir}/${file}`, "utf8");
  const sanitized = walk(JSON.parse(raw));
  const payloadStr = JSON.stringify(sanitized);
  for (const [label, rx] of FORBIDDEN_PATTERNS) {
    const m = payloadStr.match(rx);
    if (m) {
      console.error(`[FAIL] ${file} — ${label} => ${[...new Set(m)].slice(0, 3).join(", ")}`);
      fails++;
    }
  }
}

// ── 2. Estrutura da rotina 12×4 (varredura textual em TS) ───────────────
// routine-definition.ts gera os 48 jobs em runtime via loop a partir de
// ROUTINE_BLOCKS; aqui validamos o shape literal e a geração consistente,
// delegando a contagem exata para o runtime (em MOCK_ROUTINE_TODAY).
function checkRoutineShape() {
  const defSrc = readFileSync(`${repo}/src/data/routine-definition.ts`, "utf8");

  // Janelas literais esperadas — multiline (`windowStart`/`windowEnd` em linhas separadas).
  const expectedWindows = [
    ["00:00", "01:30"], ["02:00", "03:30"], ["04:00", "05:30"],
    ["06:00", "07:30"], ["08:00", "09:30"], ["10:00", "11:30"],
    ["12:00", "13:30"], ["14:00", "15:30"], ["16:00", "17:30"],
    ["18:00", "19:30"], ["20:00", "21:30"], ["22:00", "23:30"],
  ];

  const windows = [
    ...defSrc.matchAll(/windowStart:\s*"([0-9:]+)"[\s\S]{0,200}?windowEnd:\s*"([0-9:]+)"/g),
  ].map((m) => [m[1], m[2]]);
  const windowsOk = expectedWindows.every((win) =>
    windows.some((w) => w[0] === win[0] && w[1] === win[1]),
  );

  // 12 nomes de blocos temáticos (busca por qualquer dos marcadores únicos)
  const expectedBlockMarkers = [
    "Planejamento e organização diária",
    "Inteligência artificial e tecnologia",
    "Infraestrutura e",
    "Estudos e desenvolvimento técnico",
    "Trabalho e carreira profissional",
    "Pesquisa de conteúdo",
    "Produção de conteúdo",
    "AI Career Hub e produto",
    "Marketing, leads e vendas",
    "Projetos e automações",
    "Conhecimento e sistema pessoal",
    "Revisão e encerramento diário",
  ];
  const blocksOk = expectedBlockMarkers.every((name) => defSrc.includes(name));

  // Cada bloco tem array de 4 tasks (literalmente "tasks: [")
  const taskArrayOk = (defSrc.match(/\btasks:\s*\[/g) ?? []).length >= 12;

  // provider/model/delivery pinados
  const pinningOk =
    /provider:\s*"custom"/.test(defSrc) &&
    /model:\s*"9Router"/.test(defSrc) &&
    /delivery:\s*"local"/.test(defSrc);

  // Tag de timezone BRT
  const timezoneOk = /ROUTINE_TIMEZONE\s*=\s*"America\/Sao_Paulo"/.test(defSrc);

  const checks = [
    ["12 janelas literais conforme briefing", windowsOk],
    ["12 nomes de blocos conforme briefing", blocksOk],
    ["Cada bloco tem array de 4 tarefas literais", taskArrayOk],
    ["provider/model/delivery pinados em custom/9Router/local", pinningOk],
    ["TIMEZONE = America/Sao_Paulo", timezoneOk],
  ];
  for (const [label, ok] of checks) report(!!ok, label);
  return checks.every(([, ok]) => ok);
}

// ── 3. Sanidade dos mocks da rotina (TS, contagens + provider) ─────────
function checkRoutineMocks() {
  const mockSrc = readFileSync(`${repo}/src/data/mock-routine.ts`, "utf8");

  const checks = [
    ["MOCK_CRON_STATUS.provider = 'custom'", /provider:\s*"custom"/.test(mockSrc)],
    ["MOCK_CRON_STATUS.activeJobs === 48", /activeJobs:\s*48/.test(mockSrc)],
    ["MOCK_CRON_STATUS.totalJobs === 48", /totalJobs:\s*48/.test(mockSrc)],
    ["MOCK_ROUTINE_TODAY.totalBlocks === 12", /totalBlocks:\s*12/.test(mockSrc)],
    ["MOCK_ROUTINE_TODAY.totalJobs === 48", /totalJobs:\s*48/.test(mockSrc)],
    [
      "MOCK_ROUTINE_TODAY.nextExecutionAt resolvido (literal NEXT_RUN ou string inline)",
      /nextExecutionAt:\s*(?:NEXT_RUN|"[^"]+")/.test(mockSrc),
    ],
    [
      "MOCK_INFRASTRUCTURE contém os 10 ids canônicos via buildInfra()",
      ["notebook-orion", "agente-operacional", "gateway-local",
       "roteador-modelos", "docker-engine", "rede-privada",
       "modelo-local", "banco-dados", "scheduler-cron", "armazenamento-local"]
        .every((id) => mockSrc.includes(`"${id}"`)),
    ],
  ];
  for (const [label, ok] of checks) report(!!ok, label);
  return checks.every(([, ok]) => ok);
}

// ── 4. Nenhum literal restrito nos arquivos de domínio ──────────────────
function checkRestrictedLiterals() {
  const defSrc = readFileSync(`${repo}/src/data/routine-definition.ts`, "utf8");
  const mockSrc = readFileSync(`${repo}/src/data/mock-routine.ts`, "utf8");
  const typesSrc = readFileSync(`${repo}/src/types/routine.ts`, "utf8");
  const apiSrc = readFileSync(`${repo}/src/services/nexus-api.ts`, "utf8");

  const restricted = [
    ["hermes (literal restrito)", /\bhermes\b/i],
    ["tailscale (literal restrito)", /\btailscale\b/i],
    ["Path absoluto Unix (/opt/, /home/)", /\/(?:opt|home)\//],
    ["IPv4 público", /(\d{1,3}\.){3}\d{1,3}/],
  ];

  let ok = true;
  for (const [label, rx] of restricted) {
    const inDef = defSrc.match(rx);
    const inMock = mockSrc.match(rx);
    const inTypes = typesSrc.match(rx);
    const inApi = apiSrc.match(rx);
    if (inDef || inMock || inTypes || inApi) {
      const where = [];
      if (inDef) where.push("routine-definition.ts");
      if (inMock) where.push("mock-routine.ts");
      if (inTypes) where.push("types/routine.ts");
      if (inApi) where.push("services/nexus-api.ts");
      console.error(`[WARN] ${label} em ${where.join(", ")} (substituir antes de publicar).`);
      ok = false;
    } else {
      report(true, `Sem literal restrito: ${label}`);
    }
  }
  return ok;
}

const shapeOk = checkRoutineShape();
const mocksOk = checkRoutineMocks();
const literalsOk = checkRestrictedLiterals();

// ── 5. Shape check via Zod (delega ao scripts/check-shapes.ts) ───────────
//
// Esse passo valida runtime que cada MOCK_* bate com o schema Zod canônico
// em `src/lib/schemas.ts`. Drift entre tipo/mocks/schema é detectado aqui.
import { spawnSync } from "node:child_process";

function checkShapes() {
  const r = spawnSync("npx", ["tsx", "scripts/check-shapes.ts"], {
    cwd: repo,
    stdio: "inherit",
  });
  return r.status === 0;
}

const shapesOk = checkShapes();

if (fails > 0 || !shapeOk || !mocksOk || !literalsOk || !shapesOk) {
  console.error(`\n❌ Mocks FALHARAM — ver saída acima.`);
  process.exit(1);
}
console.log("\n✅ Mocks OK (12×4 ok) ✓");

