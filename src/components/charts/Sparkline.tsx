import { cn } from "@/lib/cn";

/**
 * Sparkline SVG inline — sem dependências de Chart.js ou Recharts.
 * Renderiza uma série 0..100 como polyline.
 */
export function Sparkline({
  values,
  height = 28,
  width = 96,
  tone = "accent",
  className,
}: {
  values: number[];
  height?: number;
  width?: number;
  tone?: "accent" | "green" | "amber" | "red";
  className?: string;
}) {
  if (values.length === 0) return null;

  const stroke =
    tone === "green"
      ? "var(--green)"
      : tone === "amber"
        ? "var(--amber)"
        : tone === "red"
          ? "var(--red)"
          : "var(--accent)";

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const range = max - min || 1;

  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      className={cn("block", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
