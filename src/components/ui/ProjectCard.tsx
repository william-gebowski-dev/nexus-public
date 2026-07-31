import type { Project } from "@/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { SourceBadge } from "./SourceBadge";
import { Pill } from "./Pill";
import { TEXT_TONES, type PillTone } from "@/lib/tones";

const STATUS_TONE: Record<Project["status"], PillTone> = {
  planning: "neutral",
  development: "accent",
  validation: "amber",
  operational: "green",
  paused: "geb",
  archived: "neutral",
};

const STATUS_LABEL: Record<Project["status"], string> = {
  planning: "Planejamento",
  development: "Em desenvolvimento",
  validation: "Em validação",
  operational: "Operacional",
  paused: "Pausado",
  archived: "Arquivado",
};

const PRIORITY_TONE: Record<Project["priority"], PillTone> = {
  critical: "red",
  high: "amber",
  medium: "neutral",
  low: "neutral",
};

const PRIORITY_LABEL: Record<Project["priority"], string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="nx-card nx-card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-faint">
            <Pill tone="neutral">{project.category}</Pill>
            <Pill tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Pill>
            <span className={cn("font-mono text-[10px] uppercase tracking-wider", TEXT_TONES[PRIORITY_TONE[project.priority]])}>
              {PRIORITY_LABEL[project.priority]}
            </span>
          </div>
          <h3 className="mt-1 font-mono text-base text-text">{project.name}</h3>
          <p className="mt-1 text-xs text-text-dim">{project.description}</p>
        </div>
        <SourceBadge source={project.source} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-text-faint">
          <span>Progresso</span>
          <span className="font-mono text-text">{project.progress}%</span>
        </div>
        <div
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover"
          role="progressbar"
          aria-label={`Progresso do projeto ${project.name}`}
          aria-valuenow={project.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-text-faint">Fase atual</div>
          <div className="mt-0.5 text-text">{project.currentPhase}</div>
        </div>
        <div>
          <div className="text-text-faint">Próxima ação</div>
          <div className="mt-0.5 text-text">{project.nextAction}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-text-faint">
        <span>Atualizado em {formatDate(project.updatedAt)}</span>
        {project.publicUrl && (
          <a
            href={project.publicUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent hover:underline"
          >
            Ver →
          </a>
        )}
      </div>

      {project.tech.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <span
              key={t}
              className="nx-pill font-mono text-[10px] text-text-dim border-border-strong"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
