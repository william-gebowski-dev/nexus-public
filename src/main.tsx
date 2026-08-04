import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { App } from "@/App";
import { DATA_MODE, shouldStartBrowserMocks } from "@/services/nexus-api";

/**
 * Define se o MSW deve interceptar as chamadas `/api/*`.
 *
 * A decisão fica centralizada em `DATA_MODE` (ver `nexus-api.ts`):
 *   - `mock` (default): MSW ligado — app navegável sem backend.
 *   - `api`: MSW desligado — cada página mostra seu `ErrorState` se o
 *     endpoint real ainda não respondeu.
 *
 * Renderiza o app imediatamente — não bloqueia o paint esperando o SW.
 */
async function maybeStartMocks(): Promise<void> {
  if (!shouldStartBrowserMocks(DATA_MODE)) return;
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
