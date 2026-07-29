import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { BookOpen, FileText } from "lucide-react";

const PUBLIC_DOCS = [
  {
    title: "Registro mestre do ecossistema",
    description: "Documento vivo descrevendo contas, conhecimento e direção do ecossistema.",
    href: "/docs",
  },
  {
    title: "Arquitetura geral (sanitizada)",
    description: "Visão de componentes, integrações e fluxo de dados sem detalhes internos.",
    href: null as string | null,
  },
  {
    title: "Decisões arquiteturais (resumo)",
    description: "Decisões permanentes registradas no projeto, sem paths nem hosts.",
    href: null as string | null,
  },
];

export function Documentation() {
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: api.alerts });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">Documentação</h1>
        <p className="mt-1 text-sm text-text-dim">
          Documentos públicos e decisões arquiteturais sanitizadas.
        </p>
      </header>

      {(alerts.data ?? []).length > 0 && (
        <section className="space-y-2">
          {(alerts.data ?? []).map((a) => (
            <AlertBanner key={a.id} alert={a} />
          ))}
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        {PUBLIC_DOCS.map((d) => (
          <div key={d.title} className="nx-card p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent-soft p-2 text-accent">
                {d.href ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-mono text-sm text-text">{d.title}</h2>
                <p className="mt-0.5 text-xs text-text-dim">{d.description}</p>
                {d.href ? (
                  <a
                    href={d.href}
                    className="mt-2 inline-block text-xs text-accent hover:underline"
                  >
                    Abrir →
                  </a>
                ) : (
                  <span className="mt-2 inline-block text-[10px] text-text-faint">
                    Em breve
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
