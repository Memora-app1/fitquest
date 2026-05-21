/**
 * Middleware do Next.js
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
  '/sobre',
  '/termos',
  '/privacidade',
]

// Rotas que requerem auth MAS não requerem subscription ativa
const AUTH_ONLY_ROUTES = ['/planos', '/perfil', '/onboarding', '/api/checkout']

export async function middleware(request: NextRequest) {
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
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/webhook/')) {
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

  // Cron jobs — verifica CRON_SECRET no header
  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
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
    pathname.startsWith('/metas')

  if (isAppRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_end, subscription_end')
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

    const hasAccess = isLifetime || isActive || isTrialing || isCancelledButValid

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
