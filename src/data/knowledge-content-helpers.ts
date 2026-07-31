import { KNOWLEDGE_SECTIONS } from "./knowledge-content";

/**
 * Indexa as seções de conhecimento para busca client-side.
 *
 * Devolve um `Map<sectionId, texto>` contendo `title + summary`
 * concatenados por quebra de linha. O conteúdo das seções é JSX
 * (`ReactNode`) e não há como extrair texto puro sem renderizar;
 * indexar apenas `title + summary` é suficiente para o filtro
 * implementado pelo `KnowledgeSearch`.
 */
export function serializeKnowledge(): Map<string, string> {
  const index = new Map<string, string>();
  for (const section of KNOWLEDGE_SECTIONS) {
    index.set(section.id, `${section.title}\n${section.summary ?? ""}`);
  }
  return index;
}
