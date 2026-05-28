import webpush from 'web-push'

let _initialized = false

function init() {
  if (_initialized) return
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:suporte@ascendia.app'
  if (!pub || !priv) throw new Error('VAPID keys não configuradas')
  webpush.setVapidDetails(subject, pub, priv)
  _initialized = true
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
}

export async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<{ ok: boolean; gone?: boolean }> {
  init()
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/favicon.svg',
        badge: payload.badge ?? '/favicon.svg',
        data: { url: payload.url ?? '/dashboard' },
      }),
      { TTL: 60 * 60 * 24 } // 24h TTL
    )
    return { ok: true }
  } catch (err: unknown) {
    // 410 Gone = subscription expirada, deve ser removida
    if (typeof err === 'object' && err !== null && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
      return { ok: false, gone: true }
    }
    throw err
  }
}
