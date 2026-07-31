import { ShieldCheck } from "lucide-react";

export function ServiceUptimeHeader({
  total,
  healthy,
  attention,
  down,
}: {
  total: number;
  healthy: number;
  attention: number;
  down: number;
}) {
  const operational = total - down;
  return (
    <section className="nx-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-green" aria-hidden />
          <div>
            <h2 className="font-mono text-lg font-semibold">
              Uptime do servidor: {operational} de {total} operacionais
            </h2>
            <p className="mt-1 text-xs text-text-dim">
              Considerado operacional todo serviço com status healthy ou attention.
            </p>
          </div>
        </div>
        <dl className="flex items-center gap-4 text-xs text-text-dim font-mono">
          <div><dt className="text-text-faint">Saudáveis</dt><dd className="text-green">{healthy}</dd></div>
          <div><dt className="text-text-faint">Atenção</dt><dd className="text-amber">{attention}</dd></div>
          <div><dt className="text-text-faint">Indisponíveis</dt><dd className="text-red">{down}</dd></div>
        </dl>
      </div>
    </section>
  );
}
