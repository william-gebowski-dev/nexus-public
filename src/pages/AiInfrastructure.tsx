import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { AiUsagePeriod } from "@/types/ai-infrastructure";
import { PageHeader } from "@/components/ui/PageHeader";
import { AiUsageTab } from "@/components/ai-infrastructure/AiUsageTab";
import { AiModelsTab } from "@/components/ai-infrastructure/AiModelsTab";
import { AiProvidersTab } from "@/components/ai-infrastructure/AiProvidersTab";
import { AiQuotasTab } from "@/components/ai-infrastructure/AiQuotasTab";
import { AiRequestsTab } from "@/components/ai-infrastructure/AiRequestsTab";
import { AiIncidentsTab } from "@/components/ai-infrastructure/AiIncidentsTab";

const TABS = [
  { id: "usage", path: "/ai-infrastructure/usage", label: "Uso e custos" },
  { id: "models", path: "/ai-infrastructure/models", label: "Modelos" },
  { id: "providers", path: "/ai-infrastructure/providers", label: "Provedores" },
  { id: "quotas", path: "/ai-infrastructure/quotas", label: "Cotas" },
  { id: "requests", path: "/ai-infrastructure/requests", label: "Requisições" },
  { id: "incidents", path: "/ai-infrastructure/incidents", label: "Incidentes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PERIODS: { id: AiUsagePeriod; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "24h", label: "24 horas" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "60d", label: "60 dias" },
];
const PERIOD_IDS = new Set<AiUsagePeriod>(PERIODS.map((p) => p.id));

function parsePeriod(value: string | null): AiUsagePeriod {
  return value && PERIOD_IDS.has(value as AiUsagePeriod) ? (value as AiUsagePeriod) : "today";
}

/**
 * Página principal de Infraestrutura de IA. A aba ativa é derivada do
 * `pathname`; o período fica em `?period=`. Refresh direto em
 * `/ai-infrastructure/models` preserva a aba.
 *
 * NOTA: o `MockDataBadge` é renderizado uma única vez no `Shell` para
 * toda a aplicação. Esta página não deve duplicar o aviso.
 */
export function AiInfrastructure() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: TabId = useMemo(() => {
    const found = TABS.find((t) => t.path === location.pathname);
    return found?.id ?? "usage";
  }, [location.pathname]);

  const activePeriod = parsePeriod(searchParams.get("period"));

  const setTab = (tabId: TabId) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (!tab) return;
    navigate({ pathname: tab.path, search: location.search });
  };

  const setPeriod = (period: AiUsagePeriod) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.set("period", period);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infraestrutura de IA"
        subtitle="Observabilidade de modelos, provedores, consumo, cotas e incidentes da engine 9Router."
        actions={
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-lg px-3 py-1 text-xs font-mono transition-colors ${
                  activePeriod === p.id
                    ? "bg-primary text-primary-contrast font-semibold shadow-sm"
                    : "text-text-dim hover:text-text hover:bg-surface-hover"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex overflow-x-auto border-b border-border/50 pb-px gap-2 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-xs font-mono transition-colors border-b-2 font-medium ${
              activeTab === t.id
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-text-dim hover:text-text hover:border-border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="space-y-6">
        {activeTab === "usage" && <AiUsageTab period={activePeriod} />}
        {activeTab === "models" && <AiModelsTab period={activePeriod} />}
        {activeTab === "providers" && <AiProvidersTab period={activePeriod} />}
        {activeTab === "quotas" && <AiQuotasTab />}
        {activeTab === "requests" && <AiRequestsTab />}
        {activeTab === "incidents" && <AiIncidentsTab />}
      </main>
    </div>
  );
}
