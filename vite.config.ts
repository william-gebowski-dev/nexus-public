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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react(), cspSupabasePlugin()];
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
