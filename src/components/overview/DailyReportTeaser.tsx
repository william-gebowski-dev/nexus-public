import { Link } from "react-router-dom";
import type { DailyReportSummary } from "@/types";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

export function DailyReportTeaser({ daily }: { daily: DailyReportSummary | undefined }) {
  if (!daily) return <CardSkeleton />;
  return (
    <section className="nx-card p-5 space-y-4">
      <h2 className="font-mono text-lg font-semibold">Relatório diário · {daily.date}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Stat label="Previstas" value={daily.scheduledJobs} />
        <Stat label="Concluídas" value={daily.completedJobs} />
        <Stat label="Erros" value={daily.failedJobs} />
        <Stat label="Blocos completos" value={daily.completeBlocks} />
      </div>
      <Lists
        items={[
          { title: "Entregas", list: daily.highlights },
          { title: "Descobertas", list: daily.discoveries },
          { title: "Incidentes", list: daily.incidents },
          { title: "Pendências", list: daily.pending },
          { title: "Decisões humanas", list: daily.humanDecisions },
        ]}
      />
      <div className="flex justify-end pt-2">
        <Link to={`/reports/daily/${daily.date}`} className="nx-btn nx-btn-primary">
          Abrir relatório completo
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-text-faint text-[10px] uppercase tracking-wider">{label}</div>
      <div className="font-mono mt-0.5 text-lg text-text">{value}</div>
    </div>
  );
}

function Lists({ items }: { items: { title: string; list: string[] }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {items.map((it) => (
        <div key={it.title}>
          <h3 className="text-text-faint text-[11px] uppercase tracking-wider">{it.title}</h3>
          {it.list.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {it.list.map((s, i) => (
                <li key={i} className="text-text-dim leading-relaxed">
                  • {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-text-faint text-xs">—</p>
          )}
        </div>
      ))}
    </div>
  );
}