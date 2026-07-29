import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

/**
 * Página /docs — embute o `legacy/index.html` via fetch + injeção controlada.
 *
 * Mantém o legado **fora** do build do Vite (não vai pro bundle), preservando
 * o CSS original do documento (`legacy/css/style.css`) e o JS vanilla
 * (`legacy/js/app.js`).
 *
 * O conteúdo é sanitizado na origem (e-mails já removidos). O `innerHTML`
 * aqui é usado para embutir o documento no app; o source está versionado
 * no mesmo repo, sem inputs externos.
 */
export function LegacyDocs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/legacy/index.html", { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (mounted) setHtml(text);
      })
      .catch((e) => {
        if (mounted) setError(e.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // O HTML legado aponta `link href="/legacy/css/style.css"` e
  // `script src="/legacy/js/app.js"`. Esses paths funcionam via Vercel
  // porque o `vercel.json` tem rewrites para `/legacy/:path*`.
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Registro do ecossistema</h1>
          <p className="mt-1 text-sm text-text-dim">
            Documento vivo descrevendo o ecossistema de IA — contas, conhecimento, projetos e direção.
          </p>
        </div>
        <a href="/legacy/index.html" target="_blank" rel="noreferrer noopener" className="nx-btn">
          <ExternalLink className="h-4 w-4" aria-hidden /> Abrir em nova aba
        </a>
      </header>

      {error && <p className="text-sm text-red">Falha ao carregar o documento: {error}</p>}

      {html && (
        <div
          ref={containerRef}
          // O HTML é de um arquivo versionado no próprio repo (sem entrada
          // externa). Paths relativos foram ajustados para `/legacy/...`,
          // que o vercel.json serve do repo.
          dangerouslySetInnerHTML={{ __html: html }}
          className="legacy-frame"
        />
      )}
    </div>
  );
}
