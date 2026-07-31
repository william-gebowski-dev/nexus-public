/** `cn` utilitário — combina classes condicionalmente sem libs externas. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
