import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];
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
