import { isValidElement, type ReactNode } from "react";
import { KNOWLEDGE_SECTIONS, type KnowledgeSection } from "./knowledge-content";

/**
 * Extrai texto puro de uma árvore ReactNode, descendo recursivamente em
 * fragmentos e elementos. Strings são acumuladas com espaço; nós não-texto
 * (números, null, undefined) são ignorados.
 */
function flattenText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join(" ");
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return flattenText(props.children);
  }
  return "";
}

function sectionPlainText(section: KnowledgeSection): string {
  return flattenText(section.content);
}

/**
 * Indexa as seções de conhecimento para busca client-side.
 *
 * Devolve um `Map<sectionId, texto>` com `title + summary + corpo`
 * concatenados. O conteúdo das seções é JSX (`ReactNode`); antes o
 * índice parava em title+summary e termos presentes apenas no corpo
 * não apareciam na busca (audit F). Agora caminhamos a árvore
 * recursivamente extraindo texto puro.
 */
export function serializeKnowledge(): Map<string, string> {
  const index = new Map<string, string>();
  for (const section of KNOWLEDGE_SECTIONS) {
    index.set(
      section.id,
      `${section.title}\n${section.summary ?? ""}\n${sectionPlainText(section)}`,
    );
  }
  return index;
}

// Silencia warning de unused export (re-exportado para consumidores).
void serializeKnowledge;
