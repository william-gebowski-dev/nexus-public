import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E — Nexus Dashboard.
 *
 * Roda contra `npm run dev` em http://127.0.0.1:5173 por padrão.
 * Para CI, usar `npm run build && npm run preview` ou o deploy Vercel.
 *
 * Specs mínimos cobrem Overview, Routine e AI Infrastructure — as
 * três páginas com dados mais críticos pro dashboard. Adicionar mais
 * specs conforme cobertura aumentar.
 *
 * Não roda no CI atual (.github/workflows/ci.yml) — adicionar job
 * separado `e2e` quando estabilizar.
 *
 * Arquivo .mts (não .ts) pra vitest não auto-loadar (vitest ignora
 * configs de Playwright porque não exportam `defineConfig` do vitest,
 * mas a extensão .mts elimina a ambiguidade de qualquer forma).
 *
 * Pré-requisito: `npx playwright install chromium` (não automático).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
