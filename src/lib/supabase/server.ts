/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route Handlers
 * Usa cookies do request
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component não pode setar cookies — silenciar
            // Middleware é o responsável por renovar a sessão
          }
        },
      },
    }
  );
}

/**
 * Cliente com service_role para operações server-side privilegiadas:
 * - Webhooks (Mercado Pago)
 * - Crons
 * - APIs que precisam bypass RLS (raro)
 *
 * 🚨 NUNCA importe este cliente em Client Components
 */
import { createClient as createAdminClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Helper: obtém usuário autenticado, retorna null se não logado
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
