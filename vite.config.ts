import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";

// Plugin leve que injeta os hosts do Supabase no connect-src do CSP.
// Em dev/demo (sem env vars) injeta apenas 'self'. Em produção lê
// VITE_SUPABASE_URL e adiciona o host + wss:// correspondente.
function cspSupabasePlugin(): PluginOption {
  return {
    name: "nexus-csp-supabase",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const url = process.env.VITE_SUPABASE_URL;
        const extra = url
          ? ` ${new URL(url).origin} wss://${new URL(url).host}`
          : "";
        return html.replace("__SUPABASE_CONNECT_SRC__", extra.trim());
      },
    },
  };
}

/**
 * Falha o build prod se `VITE_DATA_MODE` não estiver definido. Antes,
 * o guard vivia só no browser (`nexus-api.ts::resolveDataMode`) e
 * permitia builds silenciosos sem env, quebrando em runtime ao abrir
 * o site. Agora o build prod exige `api` ou `mock` — qualquer outro
 * valor (incluindo ausente) lança com mensagem clara apontando o
 * lugar para configurar.
 */
function enforceDataModePlugin(): PluginOption {
  return {
    name: "nexus-enforce-data-mode",
    config(_config, env) {
      if (env.mode !== "production") return {};
      const v = process.env.VITE_DATA_MODE;
      if (v !== "api" && v !== "mock") {
        throw new Error(
          `[nexus] build prod exige VITE_DATA_MODE=api|mock. Atual: ${v === undefined ? "(vazio)" : v}. ` +
            `Defina em .env, no CI ou no painel da Vercel.`,
        );
      }
      return {};
    },
  };
}

/**
 * Strip do service worker de mocks em produção api. Antes desta
 * mudança, `public/mockServiceWorker.js` (9666 bytes) era sempre
 * copiado para `dist/` mesmo quando o MSW não era iniciado. Em prod
 * com `VITE_DATA_MODE=api`, zerar `publicDir` impede o vazamento.
 * Em dev ou `mock`, mantém comportamento padrão.
 */
function mockSwStripPlugin(): PluginOption {
  return {
    name: "nexus-strip-mock-sw",
    config(_config, env) {
      if (env.mode === "production" && process.env.VITE_DATA_MODE === "api") {
        return { publicDir: false };
      }
      return {};
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    react(),
    cspSupabasePlugin(),
    enforceDataModePlugin(),
    mockSwStripPlugin(),
  ];
  if (mode === "analyze") {
    // Gera dist/stats.html com a decomposição do bundle. Usar
    // `npm run build:analyze` para inspecionar tamanho por dep.
    plugins.push(
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }) as never,
    );
  }
  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      target: "es2022",
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
    },
  };
});