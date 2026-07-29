import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

const REFRESH_KEY = "nexus-refresh-min";
const SHOW_SIM_KEY = "nexus-show-simulated";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [refreshMin, setRefreshMin] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem(REFRESH_KEY) ?? 15);
    return Number.isFinite(stored) ? stored : 15;
  });
  const [showSimulated, setShowSimulated] = useState<boolean>(() => {
    return window.localStorage.getItem(SHOW_SIM_KEY) === "1";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(REFRESH_KEY, String(refreshMin));
    } catch {
      /* ignore */
    }
  }, [refreshMin]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SHOW_SIM_KEY, showSimulated ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [showSimulated]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-text-dim">
          Preferências visuais e de sincronização do painel.
        </p>
      </header>

      <section className="nx-card space-y-4 p-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">Tema</h2>
        <div className="inline-flex rounded-lg border border-border p-0.5 text-xs">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "rounded-md px-3 py-1.5 font-mono uppercase tracking-wider",
                theme === t ? "bg-accent-soft text-accent" : "text-text-dim",
              )}
            >
              {t === "dark" ? "Escuro" : "Claro"}
            </button>
          ))}
        </div>
      </section>

      <section className="nx-card space-y-3 p-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
          Frequência de refresh
        </h2>
        <p className="text-xs text-text-dim">
          Apenas referência visual — a sincronização real do servidor acontece a cada 15 min.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[5, 10, 15, 30, 60].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setRefreshMin(m)}
              className={cn(
                "nx-pill border-border-strong text-xs",
                refreshMin === m ? "text-accent border-accent/40 bg-accent-soft" : "text-text-dim",
              )}
            >
              {m} min
            </button>
          ))}
        </div>
      </section>

      <section className="nx-card space-y-3 p-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
          Fontes de dados
        </h2>
        <label className="flex items-center gap-2 text-sm text-text-dim">
          <input
            type="checkbox"
            checked={showSimulated}
            onChange={(e) => setShowSimulated(e.target.checked)}
            className="h-4 w-4"
          />
          Mostrar dados marcados como simulados
        </label>
      </section>
    </div>
  );
}
