import { useDataFreshness } from "@/hooks/useDataFreshness";

export function StaleBanner({ lastUpdate }: { lastUpdate: string | null | undefined }) {
  const { severity, minutesAgo } = useDataFreshness(lastUpdate ?? null);

  if (severity !== "stale" && severity !== "outdated") return null;
  if (minutesAgo === null) return null;

  const label = minutesAgo < 60
    ? `há ${minutesAgo} min`
    : `há ${Math.floor(minutesAgo / 60)} h ${minutesAgo % 60} min`;

  return (
    <section className="nx-card border-amber/30 bg-amber-soft/40 p-3" role="status">
      <p className="text-xs text-text">
        Os dados podem estar desatualizados ({label}).
      </p>
    </section>
  );
}