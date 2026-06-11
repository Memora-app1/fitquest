/**
 * Proxy do Next.js (anteriormente middleware.ts)
 * Responsabilidades:
 * 1. Renovar sessão Supabase em todas as requests
 * 2. Proteger rotas /(app)/* — redireciona pra /login se não autenticado
 * 3. Bloquear acesso ao app se subscription expirou — redireciona pra /planos
 *
 * OTIMIZAÇÃO: subscription status cacheado em cookie HMAC-signed por 5 min.
 * Reduz queries ao Supabase em ~95% nas rotas do app.
 * Cache é invalidado automaticamente ao expirar ou ao cookie ser adulterado.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// ════════ SUBSCRIPTION CACHE ════════
const SUB_CACHE_COOKIE = 'asc-sub-v1'
const CACHE_TTL_MS     = 5 * 60 * 1000 // 5 minutos

interface SubCacheData {
  status:           string
  trial_end:        string | null
  subscription_end: string | null
  created_at:       string | null
}

/**
 * Gera HMAC-SHA256 (16 hex chars) para proteger o cookie de adulteração.
 * Usa CRON_SECRET como chave — disponível em produção.
 * Sem CRON_SECRET: retorna null (cache desabilitado — fallback ao DB).
 */
async function hmac16(message: string): Promise<string | null> {
  const secret = process.env.CRON_SECRET
  if (!secret) return null
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

async function signCookieValue(raw: string): Promise<string | null> {
  const sig = await hmac16(raw)
  if (!sig) return null
  return `${raw}.${sig}`
}

async function readSubCache(
  cookies: NextRequest['cookies'],
  userId: string
): Promise<SubCacheData | null> {
  const signed = cookies.get(SUB_CACHE_COOKIE)?.value
  if (!signed) return null

  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null

  const raw      = signed.slice(0, lastDot)
  const givenSig = signed.slice(lastDot + 1)

  // Verificar assinatura (previne adulteração do cookie)
  const expectedSig = await hmac16(raw)
  if (!expectedSig || givenSig !== expectedSig) return null

  // Formato: userId|status|trial_end|subscription_end|created_at|issuedAt
  const parts = raw.split('|')
  if (parts.length !== 6) return null

  const [uid, status, trialEnd, subEnd, createdAt, issuedAtStr] = parts as [
    string, string, string, string, string, string
  ]

  if (uid !== userId) return null
  if (Date.now() - parseInt(issuedAtStr, 10) > CACHE_TTL_MS) return null

  return {
    status,
    trial_end:        trialEnd       === 'null' ? null : trialEnd,
    subscription_end: subEnd         === 'null' ? null : subEnd,
    created_at:       createdAt      === 'null' ? null : createdAt,
  }
}

async function buildCacheCookie(userId: string, data: SubCacheData): Promise<string | null> {
  const raw = [
    userId,
    data.status,
    data.trial_end        ?? 'null',
    data.subscription_end ?? 'null',
    data.created_at       ?? 'null',
    Date.now().toString(),
  ].join('|')
  return signCookieValue(raw)
}

// ════════ LÓGICA DE ACESSO ════════
function hasValidAccess(profile: SubCacheData): boolean {
  const now = new Date()

  if (profile.status === 'lifetime') return true
  if (profile.status === 'active')   return true

  if (
    profile.status === 'trial' &&
    profile.trial_end &&
    new Date(profile.trial_end) > now
  ) return true

  if (
    profile.status === 'cancelled' &&
    profile.subscription_end &&
    new Date(profile.subscription_end) > now
  ) return true

  // Grace period: conta criada há menos de 7 dias
  if (profile.created_at) {
    const ageDays = (now.getTime() - new Date(profile.created_at).getTime()) / 86400000
    if (ageDays < 7) return true
  }

  return false
}

// ════════ ROTAS ════════
const PUBLIC_ROUTES    = ['/', '/login', '/signup', '/recuperar-senha', '/nova-senha', '/sobre', '/termos', '/privacidade', '/planos']
const AUTH_ONLY_ROUTES = ['/perfil', '/onboarding', '/api/checkout']

// ════════ PROXY PRINCIPAL ════════
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

  // Cron jobs — verifica CRON_SECRET antes de checar auth
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

  // Não autenticado → login
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rotas Admin — auth verificada via API routes com service role
  // O proxy só garante que o usuário está logado; a autorização de role
  // acontece em cada API route e Server Component via getAdminSession()
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')) {
    return response
  }

  // Rotas que requerem só auth (sem subscription)
  if (AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return response
  }

  // Admin bypass — acesso total sem checar subscription
  const adminEmails = (process.env.ADMIN_BYPASS_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (adminEmails.length > 0 && user.email && adminEmails.includes(user.email.toLowerCase())) {
    return response
  }

  // ════════ VERIFICAÇÃO DE SUBSCRIPTION (com cache) ════════
  const isAppRoute =
    pathname.startsWith('/dashboard')  ||
    pathname.startsWith('/habitos')    ||
    pathname.startsWith('/treinos')    ||
    pathname.startsWith('/tarefas')    ||
    pathname.startsWith('/financas')   ||
    pathname.startsWith('/score')      ||
    pathname.startsWith('/coach')      ||
    pathname.startsWith('/calendario') ||
    pathname.startsWith('/metas')      ||
    pathname.startsWith('/saude')      ||
    pathname.startsWith('/conquistas')

  if (isAppRoute) {
    // 1. Tentar ler do cache (evita query ao banco)
    const cached = await readSubCache(request.cookies, user.id)

    if (cached) {
      // Cache hit — avaliar sem tocar no banco
      if (!hasValidAccess(cached)) {
        return NextResponse.redirect(new URL('/planos', request.url))
      }
      return response
    }

    // 2. Cache miss — buscar do banco
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_end, subscription_end, created_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    const profileData: SubCacheData = {
      status:           profile.subscription_status,
      trial_end:        profile.trial_end,
      subscription_end: profile.subscription_end,
      created_at:       profile.created_at,
    }

    if (!hasValidAccess(profileData)) {
      return NextResponse.redirect(new URL('/planos', request.url))
    }

    // 3. Usuário tem acesso — salvar no cache para próximas requests
    const cookieValue = await buildCacheCookie(user.id, profileData)
    if (cookieValue) {
      response.cookies.set(SUB_CACHE_COOKIE, cookieValue, {
        httpOnly: true,
        sameSite: 'lax',
        secure:   process.env.NODE_ENV === 'production',
        maxAge:   300, // 5 minutos (igual ao CACHE_TTL_MS)
        path:     '/',
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
