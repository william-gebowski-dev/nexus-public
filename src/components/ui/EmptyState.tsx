import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="nx-card flex flex-col items-center justify-center gap-2 p-8 text-center">
      {icon && <div className="text-text-dim">{icon}</div>}
      <h3 className="font-mono text-sm text-text">{title}</h3>
      {description && <p className="max-w-sm text-xs text-text-dim">{description}</p>}
    </div>
  );
}
