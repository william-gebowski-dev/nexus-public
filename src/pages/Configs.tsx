import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { queryClient, REFRESH_LABEL } from "@/lib/queryClient";
import { USE_MOCK_DATA } from "@/services/nexus-api";

const REFRESH_KEY = "nexus-refresh-min";
const DEFAULT_REFRESH_MIN = 15;

function readStoredRefresh(): number {
  if (typeof window === "undefined") return DEFAULT_REFRESH_MIN;
  const raw = window.localStorage.getItem(REFRESH_KEY);
  const n = raw === null ? DEFAULT_REFRESH_MIN : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_REFRESH_MIN;
}

export function Configs() {
  const { theme, setTheme } = useTheme();
  // O intervalo do refetchInterval é definido no queryClient; a escolha
  // aqui aplica via setDefaultOptions e persiste em localStorage. Queries
  // já em cache continuam usando o intervalo antigo até o próximo refetch
  // montar com o novo valor (TanStack Query honra o default na criação).
  const [refreshMin, setRefreshMin] = useState<number>(() => readStoredRefresh());

  useEffect(() => {
    try {
      window.localStorage.setItem(REFRESH_KEY, String(refreshMin));
    } catch {
      /* ignore */
    }
    queryClient.setDefaultOptions({
      queries: { refetchInterval: refreshMin * 60 * 1000 },
    });
  }, [refreshMin]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Preferências visuais e de sincronização do painel."
      />

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
          Aplica a partir do próximo refetch. Queries já em cache usam o intervalo
          anterior; mude para forçar uma nova sincronização.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[5, 10, 15, 30, 60].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={refreshMin === m}
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
        <p className="text-[11px] text-text-faint">
          Padrão do app: {REFRESH_LABEL}.
        </p>
      </section>

      <section className="nx-card space-y-3 p-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
          Fontes de dados
        </h2>
        <p className="text-xs text-text-dim">
          {USE_MOCK_DATA
            ? "O painel está rodando em modo demonstração (mocks via MSW). Para dados reais é necessário um backend e a variável de build VITE_DATA_MODE=api configurada no painel da Vercel/CI."
            : "Modo de build: VITE_DATA_MODE=api — chamadas vão para a API real. Isso significa apenas que o modo foi selecionado no build; o painel ainda pode exibir \"Sem dados\" se a API/Supabase não estiver respondendo."}
        </p>
      </section>
    </div>
  );
}