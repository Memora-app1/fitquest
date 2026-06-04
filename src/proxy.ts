/**
 * Proxy do Next.js (anteriormente middleware.ts)
 * Responsabilidades:
 * 1. Renovar sessão Supabase em todas as requests
 * 2. Proteger rotas /(app)/* — redireciona pra /login se não autenticado
 * 3. Bloquear acesso ao app se subscription expirou — redireciona pra /planos
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Rotas que NÃO requerem autenticação
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/recuperar-senha',
  '/nova-senha',
  '/sobre',
  '/termos',
  '/privacidade',
]

// Rotas que requerem auth MAS não requerem subscription ativa
const AUTH_ONLY_ROUTES = ['/planos', '/perfil', '/onboarding', '/api/checkout']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rotas públicas — sempre permite
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/api/webhook/') ||
    pathname.startsWith('/auth/')
  ) {
    return response
  }

  // Cron jobs — verifica CRON_SECRET ANTES de checar autenticação
  // Vercel chama crons sem sessão de usuário
  // Em dev (CRON_SECRET não configurado), permite sem auth para facilitar testes
  if (pathname.startsWith('/api/cron/')) {
    const secret = process.env.CRON_SECRET
    if (secret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    }
    return response
  }

  // Não autenticado — redireciona pra login
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rotas que só requerem auth (não subscription)
  if (AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return response
  }

  // Admin bypass — emails configurados em ADMIN_BYPASS_EMAILS têm acesso total
  const adminEmails = (process.env.ADMIN_BYPASS_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (adminEmails.length > 0 && user.email && adminEmails.includes(user.email.toLowerCase())) {
    return response
  }

  // Rotas do app — verifica subscription
  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/habitos') ||
    pathname.startsWith('/treinos') ||
    pathname.startsWith('/tarefas') ||
    pathname.startsWith('/financas') ||
    pathname.startsWith('/score') ||
    pathname.startsWith('/coach') ||
    pathname.startsWith('/calendario') ||
    pathname.startsWith('/metas') ||
    pathname.startsWith('/saude') ||
    pathname.startsWith('/conquistas')

  if (isAppRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_end, subscription_end, created_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    const now = new Date()
    const isLifetime = profile.subscription_status === 'lifetime'
    const isActive = profile.subscription_status === 'active'
    const isTrialing =
      profile.subscription_status === 'trial' &&
      profile.trial_end &&
      new Date(profile.trial_end) > now
    const isCancelledButValid =
      profile.subscription_status === 'cancelled' &&
      profile.subscription_end &&
      new Date(profile.subscription_end) > now

    // Grace period: conta criada há menos de 7 dias tem acesso mesmo sem trial configurado
    const accountAge = profile.created_at
      ? (now.getTime() - new Date(profile.created_at).getTime()) / 86400000
      : 999
    const isInGracePeriod = accountAge < 7

    const hasAccess = isLifetime || isActive || isTrialing || isCancelledButValid || isInGracePeriod

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/planos', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths exceto:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (imagens, manifests)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
