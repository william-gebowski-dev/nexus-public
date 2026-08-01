/**
 * Cliente Supabase server-side.
 *
 * IMPORTANTE: este módulo é exclusivo de Vercel Functions (api/*). O
 * `src/lib/supabase.ts` usa a chave anônima e roda no browser; este
 * usa a service role key e nunca deve ser importado por código que
 * vá para o bundle do frontend.
 *
 * Variáveis de ambiente esperadas (Vercel):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Se alguma estiver ausente, qualquer handler que depender deste cliente
 * deve responder 500 (não 401 — o segredo estar fora é falha de
 * configuração, não autenticação).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase server-side: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no ambiente Vercel.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: {
      // Service role ignora RLS. O backend assume esse papel.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
