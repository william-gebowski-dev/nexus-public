/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test-setup.ts"],
    globals: false,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/lib/schemas.ts"],
      reporter: ["text", "html"],
    },
  },
});
