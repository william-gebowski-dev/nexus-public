import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  description,
  trend,
  href,
  icon,
}: {
  label: string;
  value: ReactNode;
  description: string;
  trend?: string;
  href: string;
  icon?: ReactNode;
}) {
  return (
    <Link to={href} className="nx-card nx-card-hover block min-w-0 p-4 focus-visible:outline-secondary">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-xs uppercase tracking-[0.14em] text-text-faint">{label}</div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-text">{value}</div>
      <p className="mt-1 text-xs leading-5 text-text-dim">{description}</p>
      {trend && <div className={cn("mt-3 text-[11px] font-medium text-primary")}>{trend}</div>}
    </Link>
  );
}
