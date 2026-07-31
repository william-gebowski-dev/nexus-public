import type { GeneratedArtifact } from "@/types";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { Pill } from "@/components/ui/Pill";
import type { PillTone } from "@/lib/tones";
import { formatDateTime } from "@/lib/format";

const KIND_TONE: Record<GeneratedArtifact["kind"], PillTone> = {
  report: "geb",
  boletim: "geb",
  "study-plan": "accent",
  pauta: "accent",
  content: "accent",
  roadmap: "neutral",
  leads: "amber",
  "project-update": "green",
  note: "neutral",
  "daily-report": "geb",
};

const KIND_LABEL: Record<GeneratedArtifact["kind"], string> = {
  report: "Relatório",
  boletim: "Boletim",
  "study-plan": "Trilha de estudos",
  pauta: "Pauta",
  content: "Conteúdo",
  roadmap: "Roadmap",
  leads: "Leads",
  "project-update": "Projeto",
  note: "Nota",
  "daily-report": "Relatório diário",
};

export function ArtifactsPanel({ artifacts }: { artifacts: GeneratedArtifact[] | undefined }) {
  if (!artifacts) return <CardSkeleton />;
  if (artifacts.length === 0)
    return <p className="text-xs text-text-faint">Sem artefatos produzidos hoje.</p>;
  return (
    <section className="nx-card p-5 space-y-3">
      <h2 className="font-mono text-lg font-semibold">Relatórios e arquivos produzidos</h2>
      <ul className="divide-y divide-border">
        {artifacts.map((a) => (
          <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-text">{a.name}</span>
                <Pill tone={KIND_TONE[a.kind]} size="xs">
                  {KIND_LABEL[a.kind]}
                </Pill>
              </div>
              <p className="mt-0.5 text-[11px] text-text-dim">
                job <span className="font-mono">{a.sourceJobId}</span> · {formatDateTime(a.createdAt)}
              </p>
              <p className="mt-1 text-[11px] font-mono text-text-faint">{a.publicPath}</p>
            </div>
            <a href={`/${a.publicPath}`} target="_blank" rel="noreferrer noopener" className="nx-btn shrink-0">
              Abrir
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}