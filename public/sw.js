const CACHE_NAME = 'ascendia-v2'

// Assets estáticos para cache offline
const STATIC_ASSETS = [
  '/offline',
  '/favicon.svg',
]

// ── Install: pré-cacheia assets críticos ─────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate: limpa caches antigos ───────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: estratégia por tipo de request ────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requests que não são GET
  if (request.method !== 'GET') return

  // Ignora requests de outras origens (Supabase, APIs externas)
  if (url.origin !== self.location.origin) return

  // API routes: sempre network-first, sem cache
  if (url.pathname.startsWith('/api/')) return

  // Assets estáticos (_next/static, fontes, imagens): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image/') ||
    url.pathname.match(/\.(svg|png|jpg|jpeg|ico|woff2|woff)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Páginas HTML: network-first, fallback para /offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache de páginas bem-sucedidas para acesso offline
        if (response.ok && request.headers.get('accept')?.includes('text/html')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then((cached) => cached ?? caches.match('/offline'))
      )
  )
})

// ── Push notifications ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Ascendia', {
      body: data.body ?? '',
      icon: data.icon ?? '/favicon.svg',
      badge: data.badge ?? '/favicon.svg',
      data: data.data ?? {},
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  )
})

// ── Notification click ─────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
