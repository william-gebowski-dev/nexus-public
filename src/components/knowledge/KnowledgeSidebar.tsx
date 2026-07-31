import { KNOWLEDGE_LAST_UPDATED, KNOWLEDGE_SECTIONS } from "@/data/knowledge-content";
import { cn } from "@/lib/cn";

export function KnowledgeSidebar({ activeId }: { activeId?: string }) {
  return (
    <aside className="nx-card p-4 space-y-3">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-text-faint">
          Atualizado em
        </p>
        <p className="font-mono text-xs text-text">{KNOWLEDGE_LAST_UPDATED}</p>
      </header>
      <nav aria-label="Índice de Conhecimento" className="space-y-1">
        {KNOWLEDGE_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={activeId === section.id ? "location" : undefined}
            className={cn(
              "block rounded-lg px-3 py-2 text-xs transition-colors",
              activeId === section.id
                ? "bg-primary-soft text-primary"
                : "text-text-dim hover:bg-surface-hover hover:text-text",
            )}
          >
            <span className="font-mono">{section.title}</span>
            {section.summary && (
              <span className="mt-0.5 block text-[10px] text-text-faint">
                {section.summary}
              </span>
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
}
