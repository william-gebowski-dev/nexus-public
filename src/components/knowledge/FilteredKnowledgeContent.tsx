import type { KnowledgeSection } from "@/data/knowledge-content";

/**
 * Renderiza um subconjunto de seções de conhecimento com a mesma
 * estrutura visual do `KnowledgeContent` da Task 7a. Usado quando o
 * usuário filtra o documento pela busca.
 */
export function FilteredKnowledgeContent({
  sections,
}: {
  sections: readonly KnowledgeSection[];
}) {
  return (
    <article className="prose-nx space-y-6">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="nx-card p-5 space-y-3 scroll-mt-4"
        >
          <h2 className="font-mono text-lg font-semibold text-text">
            {section.title}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-text-dim">
            {section.content}
          </div>
        </section>
      ))}
    </article>
  );
}
