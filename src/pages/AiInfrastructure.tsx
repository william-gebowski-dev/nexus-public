import { useSearchParams } from "react-router-dom";
import type { AiUsagePeriod } from "@/types/ai-infrastructure";
import { PageHeader } from "@/components/ui/PageHeader";
import { AiOverviewTab } from "@/components/ai-infrastructure/AiOverviewTab";
import { AiUsageTab } from "@/components/ai-infrastructure/AiUsageTab";
import { AiModelsTab } from "@/components/ai-infrastructure/AiModelsTab";
import { AiProvidersTab } from "@/components/ai-infrastructure/AiProvidersTab";
import { AiQuotasTab } from "@/components/ai-infrastructure/AiQuotasTab";
import { AiRequestsTab } from "@/components/ai-infrastructure/AiRequestsTab";
import { AiIncidentsTab } from "@/components/ai-infrastructure/AiIncidentsTab";
import { MockDataBadge } from "@/components/overview/MockDataBadge";

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "usage", label: "Uso e custos" },
  { id: "models", label: "Modelos" },
  { id: "providers", label: "Provedores" },
  { id: "quotas", label: "Cotas" },
  { id: "requests", label: "Requisições" },
  { id: "incidents", label: "Incidentes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PERIODS: { id: AiUsagePeriod; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "24h", label: "24 horas" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "60d", label: "60 dias" },
];

export function AiInfrastructure() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: TabId = (searchParams.get("tab") as TabId) || "overview";
  const activePeriod: AiUsagePeriod = (searchParams.get("period") as AiUsagePeriod) || "today";

  const setTab = (tab: TabId) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    });
  };

  const setPeriod = (period: AiUsagePeriod) => {
    setSearchParams((prev) => {
      prev.set("period", period);
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infraestrutura de IA"
        subtitle="Observabilidade de modelos, provedores, consumo, cotas e incidentes da engine 9Router."
        actions={
          /* Period Selector */
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

      {/* Tabs Navigation */}
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

      {/* Tab Content */}
      <main className="space-y-6">
        {activeTab === "overview" && <AiOverviewTab period={activePeriod} />}
        {activeTab === "usage" && <AiUsageTab period={activePeriod} />}
        {activeTab === "models" && <AiModelsTab period={activePeriod} />}
        {activeTab === "providers" && <AiProvidersTab period={activePeriod} />}
        {activeTab === "quotas" && <AiQuotasTab />}
        {activeTab === "requests" && <AiRequestsTab />}
        {activeTab === "incidents" && <AiIncidentsTab />}
      </main>

      <MockDataBadge />
    </div>
  );
}
