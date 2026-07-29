import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase — usado em /admin.
 *
 * Variáveis de ambiente esperadas (injetadas via Vercel env vars ou .env
 * em dev). Quando ausentes, o cliente é criado com URL placeholder; o
 * `/admin` exibirá falha de auth ao tentar entrar (sem expor chaves).
 */
const url = import.meta.env.VITE_SUPABASE_URL ?? "http://localhost:54321";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "public-anon-placeholder";

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
