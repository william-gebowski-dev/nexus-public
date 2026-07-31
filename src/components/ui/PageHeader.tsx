import type { ReactNode } from "react";

/**
 * Header padrão de página — título + subtítulo + slot de ações (ex.:
 * DataFreshnessBadge, ViewToggle). Extraído do padrão repetido em
 * ~9 páginas (`<header><h1>...</h1><p>...</p></header>`).
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
