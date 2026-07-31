import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * ErrorBoundary global — captura exceções não tratadas em qualquer ponto
 * da árvore e mostra o `ErrorState` em vez de quebrar a aplicação em tela
 * branca. Antes do P1 final, render errors caíam no root do React sem
 * fallback (audit I — falta ErrorBoundary).
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log estruturado: a stack real fica disponível para diagnóstico sem
    // expor a UI. Em produção, integrar com Sentry/Datadog aqui.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl p-6">
          <ErrorState
            error={this.state.error}
            title="Algo deu errado ao renderizar o painel"
            onRetry={this.handleReset}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
