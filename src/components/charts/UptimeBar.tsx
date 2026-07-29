import { cn } from "@/lib/cn";

/**
 * Barras de uptime — um quadradinho por dia.
 * `true` = ok, `false` = falha. Visual contínuo.
 */
export function UptimeBar({
  days,
  className,
}: {
  days: boolean[];
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label="Uptime 7d">
      {days.map((ok, i) => (
        <span
          key={i}
          className={cn(
            "h-3 w-3 rounded-sm",
            ok ? "bg-green/80" : "bg-red/80",
          )}
          title={ok ? "Operacional" : "Falha"}
        />
      ))}
    </div>
  );
}
