import { useEffect, useMemo, useState } from "react";
import {
  KNOWLEDGE_LAST_UPDATED,
  KNOWLEDGE_SECTIONS,
} from "@/data/knowledge-content";
import { serializeKnowledge } from "@/data/knowledge-content-helpers";
import { KnowledgeSidebar } from "@/components/knowledge/KnowledgeSidebar";
import { KnowledgeSearch } from "@/components/knowledge/KnowledgeSearch";
import { FilteredKnowledgeContent } from "@/components/knowledge/FilteredKnowledgeContent";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function Knowledge() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | undefined>();
  const index = useMemo(() => serializeKnowledge(), []);

  // Filtra por título + resumo (conteúdo é JSX — não indexável).
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWLEDGE_SECTIONS;
    return KNOWLEDGE_SECTIONS.filter((section) => {
      const haystack = `${section.title}\n${section.summary ?? ""}\n${index.get(section.id) ?? ""}`;
      return haystack.toLowerCase().includes(q);
    });
  }, [query, index]);

  // Rastreia a seção visível para destacar a entrada correspondente
  // na sidebar. Reaproveita o `IntersectionObserver` quando o conjunto
  // de seções muda (busca filtrada).
  useEffect(() => {
    const ids = new Set(matches.map((s) => s.id));
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("article section[id]"),
    ).filter((el) => ids.has(el.id));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0% -70% 0%" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [matches]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conhecimento"
        subtitle={`Documento institucional · atualizado em ${KNOWLEDGE_LAST_UPDATED}`}
      />

      <KnowledgeSearch value={query} onChange={setQuery} />

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <KnowledgeSidebar activeId={activeId} />
        {matches.length === 0 ? (
          <EmptyState
            title="Nenhuma seção encontrada"
            description="Refine a busca para encontrar outra parte do documento."
          />
        ) : (
          <FilteredKnowledgeContent sections={matches} />
        )}
      </div>
    </div>
  );
}
