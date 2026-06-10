/**
 * Envia um broadcast de notificações push para o segmento alvo.
 * Chamado internamente pelo POST /api/admin/broadcasts (send_now)
 * ou pelo cron de scheduled broadcasts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@ascendia.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? ''}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { id: campaignId } = await params
  const db = createServiceClient()

  const { data: campaign } = await db
    .from('broadcast_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Busca push subscriptions do segmento alvo
  let subQuery = db
    .from('push_subscriptions')
    .select('endpoint, keys_p256dh, keys_auth, user_id')

  if (campaign.target_segment !== 'all') {
    // Filtra pelo segmento — faz join via user_id → profiles
    let profileQuery = db.from('profiles').select('id')

    if (campaign.target_segment === 'trial') {
      profileQuery = profileQuery.eq('subscription_status', 'trial')
    } else if (campaign.target_segment === 'active') {
      profileQuery = profileQuery.in('subscription_status', ['active', 'lifetime'])
    } else if (campaign.target_segment === 'lifetime') {
      profileQuery = profileQuery.eq('subscription_status', 'lifetime')
    } else if (campaign.target_segment === 'streak_active') {
      profileQuery = profileQuery.gt('streak_current', 0)
    } else if (campaign.target_segment === 'at_risk') {
      // Trial expirando em 3 dias
      const in3days = new Date(Date.now() + 3 * 86400000).toISOString()
      profileQuery = profileQuery.eq('subscription_status', 'trial').lte('trial_end', in3days)
    }

    const { data: profiles } = await profileQuery.limit(5000)
    const userIds = (profiles ?? []).map(p => p.id)

    if (userIds.length === 0) {
      await db.from('broadcast_campaigns').update({
        status: 'sent', sent_at: new Date().toISOString(), sent_count: 0,
      }).eq('id', campaignId)
      return NextResponse.json({ sent: 0 })
    }

    subQuery = subQuery.in('user_id', userIds) as typeof subQuery
  }

  const { data: subscriptions } = await subQuery.limit(10000)
  if (!subscriptions || subscriptions.length === 0) {
    await db.from('broadcast_campaigns').update({
      status: 'sent', sent_at: new Date().toISOString(), sent_count: 0,
    }).eq('id', campaignId)
    return NextResponse.json({ sent: 0 })
  }

  const payload = JSON.stringify({
    title: campaign.push_title,
    body:  campaign.push_body,
    icon:  '/icons/icon-192.png',
    data:  { url: campaign.push_url ?? '/dashboard' },
  })

  let sentCount    = 0
  let failedCount  = 0
  const staleIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload
        )
        sentCount++
      } catch (err: unknown) {
        failedCount++
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) staleIds.push(sub.endpoint)
      }
    })
  )

  // Remove subscriptions inválidas
  if (staleIds.length > 0) {
    await db.from('push_subscriptions').delete().in('endpoint', staleIds)
  }

  await db.from('broadcast_campaigns').update({
    status:        'sent',
    sent_at:       new Date().toISOString(),
    sent_count:    sentCount,
    failed_count:  failedCount,
    target_count:  subscriptions.length,
  }).eq('id', campaignId)

  return NextResponse.json({ sent: sentCount, failed: failedCount })
}
