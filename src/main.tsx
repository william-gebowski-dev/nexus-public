import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { App } from "@/App";

/**
 * Define se o MSW deve interceptar as chamadas `/api/*`.
 *
 * - Em `vite dev` (import.meta.env.DEV): sempre liga — o app fica navegável
 *   sem backend.
 * - Em produção: só liga se `VITE_USE_MOCKS=true` (deploy de preview/demo).
 *   No deploy público de verdade, o front busca os endpoints reais em
 *   `/api/*`; enquanto não existirem, cada página mostra seu `ErrorState`
 *   em vez de publicar dados simulados como se fossem reais.
 *
 * Renderiza o app imediatamente — não bloqueia o paint esperando o SW.
 */
async function maybeStartMocks(): Promise<void> {
  if (typeof window === "undefined") return;
  const useMocks = import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS === "true";
  if (!useMocks) return;
  const { worker } = await import("@/mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}

async function bootstrap() {
  // Tenta iniciar o MSW; se falhar (ex.: SW indisponível), o app ainda
  // renderiza e cada query lida com o erro no seu próprio ErrorState.
  try {
    await maybeStartMocks();
  } catch (err) {
    console.error("[msw] falha ao iniciar mocks:", err);
  }

  const root = document.getElementById("root");
  if (!root) throw new Error("Elemento #root não encontrado.");
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
