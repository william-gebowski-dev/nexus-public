import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <header className="text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-geb-soft text-geb">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="font-mono text-2xl font-semibold">Área administrativa</h1>
          <p className="mt-1 text-sm text-text-dim">
            Autenticação necessária para editar projetos e roadmap.
          </p>
        </header>
        <form onSubmit={handleSignIn} className="nx-card space-y-3 p-4">
          <label className="block">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-text-faint">E-mail</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-text-faint">Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>
          {error && <p className="text-xs text-red">{error}</p>}
          <button type="submit" disabled={busy} className="nx-btn-primary w-full justify-center py-2 disabled:opacity-50">
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Área administrativa</h1>
          <p className="mt-1 text-sm text-text-dim">
            Sessão ativa como <span className="font-mono">{session.user.email}</span>.
          </p>
        </div>
        <button onClick={handleSignOut} className="nx-btn">
          <LogOut className="h-4 w-4" aria-hidden /> Sair
        </button>
      </header>

      <section className="nx-card space-y-3 p-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
          Edição de projetos
        </h2>
        <p className="text-sm text-text-dim">
          Em breve: formulário para criar, editar e arquivar projetos.
          As mutações serão gravadas via Supabase após a configuração do schema.
        </p>
      </section>

      <section className="nx-card space-y-3 p-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-text-faint">
          Edição de roadmap
        </h2>
        <p className="text-sm text-text-dim">
          Em breve: criação e movimentação de itens entre as fases (Agora / Próximo / Futuro / Concluído).
        </p>
      </section>
    </div>
  );
}
