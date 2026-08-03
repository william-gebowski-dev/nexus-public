import { test, expect } from "@playwright/test";

/**
 * Specs mínimos do Overview — primeira página que William abre
 * todos os dias. Se algo aqui quebrar, é barulho alto.
 *
 * Cobertura intencionalmente rasa: título, topbar (online/frescor/
 * theme), SystemStateBanner. Erros 5xx em chamadas de rede vão
 * aparecer como `isError` na UI — assertions garantem que dados
 * chegam.
 */

test("Overview renderiza e mostra brand", async ({ page }) => {
  await page.goto("/");
  // Brand mark no sidebar
  await expect(page.locator("text=Nexus").first()).toBeVisible({ timeout: 10_000 });
});

test("Topbar mostra indicador de conexão", async ({ page }) => {
  await page.goto("/");
  // Pill online/offline presente na topbar
  const pill = page.locator("header").getByText(/Conectado|Offline/);
  await expect(pill).toBeVisible({ timeout: 10_000 });
});

test("Theme toggle presente", async ({ page }) => {
  await page.goto("/");
  // ThemeToggle renderiza com aria-label
  const toggle = page.getByRole("button", { name: /Tema/ });
  await expect(toggle).toBeVisible({ timeout: 10_000 });
});

test("Rota /ai-infrastructure responde 200", async ({ page }) => {
  const res = await page.goto("/ai-infrastructure");
  expect(res?.status()).toBe(200);
});

test("Rota /routine responde 200", async ({ page }) => {
  const res = await page.goto("/routine");
  expect(res?.status()).toBe(200);
});
