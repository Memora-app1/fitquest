import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)

  if (!session || !hasMinRole(session, 'admin')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const db = createServiceClient()
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? ''

  let query = db
    .from('profiles')
    .select(
      'id, name, level, xp_total, streak_current, streak_longest, subscription_status, subscription_plan, trial_end, subscription_end, created_at, last_activity_date, perfect_days, is_suspended'
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('subscription_status', status)

  const { data: users, error } = await query.limit(10000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const headers = [
    'ID', 'Nome', 'Nível', 'XP Total', 'Streak Atual', 'Streak Recorde',
    'Status Assinatura', 'Plano', 'Fim Trial', 'Fim Assinatura',
    'Cadastro', 'Último Acesso', 'Dias Perfeitos', 'Suspenso',
  ]

  function fmt(val: unknown): string {
    if (val === null || val === undefined) return ''
    return String(val).replace(/"/g, '""')
  }

  function fmtDate(val: unknown): string {
    if (!val) return ''
    try { return new Date(val as string).toLocaleDateString('pt-BR') } catch { return '' }
  }

  const rows = (users ?? []).map(u => [
    fmt(u.id),
    fmt(u.name),
    fmt(u.level),
    fmt(u.xp_total ?? 0),
    fmt(u.streak_current ?? 0),
    fmt(u.streak_longest ?? 0),
    fmt(u.subscription_status),
    fmt(u.subscription_plan),
    fmtDate(u.trial_end),
    fmtDate(u.subscription_end),
    fmtDate(u.created_at),
    fmtDate(u.last_activity_date),
    fmt(u.perfect_days ?? 0),
    u.is_suspended ? 'Sim' : 'Não',
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${v}"`).join(','))
    .join('\n')

  const date = new Date().toISOString().slice(0, 10)
  const filename = `ascendia-users${status ? `-${status}` : ''}-${date}.csv`

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
