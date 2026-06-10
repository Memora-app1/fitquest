import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin'
import { z } from 'zod'

const ALLOWED_PATHS = new Set([
  '/api/cron/streaks',
  '/api/cron/streak-alerts',
  '/api/cron/notifications',
  '/api/cron/habit-reminders',
  '/api/cron/goal-reminders',
  '/api/cron/trial-emails',
  '/api/cron/weekly-digest',
  '/api/cron/calendar-sync',
  '/api/cron/weekly-challenges',
  '/api/cron/memories',
  '/api/cron/daily-recap',
  '/api/cron/metrics-snapshot',
  '/api/cron/perfect-day-reminder',
  '/api/cron/league-reset',
])

const Schema = z.object({
  path: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)

  if (!session || !hasMinRole(session, 'super_admin')) {
    return NextResponse.json({ error: 'Apenas super_admin pode disparar crons manualmente' }, { status: 403 })
  }

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { path } = parsed.data

  if (!ALLOWED_PATHS.has(path)) {
    return NextResponse.json({ error: 'Cron não permitido' }, { status: 400 })
  }

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const cronSecret = process.env.CRON_SECRET ?? ''

  let respStatus = 0
  let respOk = false
  try {
    const resp = await fetch(`${appUrl}${path}`, {
      method:  'GET',
      headers: {
        Authorization:    `Bearer ${cronSecret}`,
        'x-admin-trigger': session.userId,
      },
      signal: AbortSignal.timeout(30000),
    })
    respStatus = resp.status
    respOk     = resp.ok
  } catch (e) {
    await auditLog({
      adminId:    session.userId,
      adminRole:  session.role,
      action:     'cron.trigger',
      targetType: 'system',
      targetId:   path,
      payload:    { success: false, error: String(e) },
    })
    return NextResponse.json({ ok: false, message: `Erro de rede: ${String(e)}` }, { status: 502 })
  }

  await auditLog({
    adminId:    session.userId,
    adminRole:  session.role,
    action:     'cron.trigger',
    targetType: 'system',
    targetId:   path,
    payload:    { success: respOk, http_status: respStatus },
  })

  if (!respOk) {
    return NextResponse.json(
      { ok: false, message: `Cron respondeu ${respStatus}` },
      { status: 200 }
    )
  }

  return NextResponse.json({ ok: true, message: 'Cron executado com sucesso!' })
}
