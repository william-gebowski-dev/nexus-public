import { useEffect, useState } from "react";
import { formatRelative } from "@/lib/format";

export type FreshnessSeverity = "fresh" | "stale" | "outdated" | "nodata";

export interface FreshnessInfo {
  label: string;
  severity: FreshnessSeverity;
  minutesAgo: number | null;
}

/**
 * Calcula a "frescor" de um timestamp ISO em relação ao `Date.now()`.
 * Mapeamento:
 *   - < 30 min        → 'fresh'
 *   - 30 min – 2 h    → 'stale'
 *   - > 2 h           → 'outdated'
 *   - sem timestamp   → 'nodata'
 */
export function useDataFreshness(iso: string | undefined | null, refreshMs = 30_000): FreshnessInfo {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), refreshMs);
    return () => window.clearInterval(id);
  }, [refreshMs]);

  if (!iso) {
    return { label: "Sem dados recentes", severity: "nodata", minutesAgo: null };
  }

  const ts = new Date(iso).getTime();
  const minutesAgo = Math.round((now - ts) / 60_000);

  let severity: FreshnessSeverity;
  if (minutesAgo < 30) severity = "fresh";
  else if (minutesAgo < 120) severity = "stale";
  else severity = "outdated";

  const label =
    severity === "fresh"
      ? `Atualizado ${formatRelative(iso, now)}`
      : severity === "stale"
        ? "Dados possivelmente desatualizados"
        : "Sem sincronização recente";

  return { label, severity, minutesAgo };
}
