import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json() as {
    date?: string
    bed_time?: string | null
    wake_time?: string | null
    duration_hours?: number | null
    quality?: number | null
    notes?: string | null
  }

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: 'missing_or_invalid_date' }, { status: 400 })
  }
  if (body.quality != null && (body.quality < 1 || body.quality > 5)) {
    return NextResponse.json({ error: 'invalid_quality' }, { status: 400 })
  }

  // Verificar se é o primeiro registro deste dia (para concessão de XP)
  const { data: existing } = await supabase
    .from('sleep_logs')
    .select('id, xp_earned')
    .eq('user_id', user.id)
    .eq('date', body.date)
    .maybeSingle()

  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert({
      user_id: user.id,
      date: body.date,
      bed_time: body.bed_time ?? null,
      wake_time: body.wake_time ?? null,
      duration_hours: body.duration_hours ?? null,
      quality: body.quality ?? null,
      notes: body.notes ?? null,
    }, { onConflict: 'user_id,date' })
    .select('id, date, bed_time, wake_time, duration_hours, quality, xp_earned')
    .single()

  if (error || !data) {
    console.error('sleep POST error', error)
    return NextResponse.json({ error: 'upsert_failed' }, { status: 500 })
  }

  let xpEarned = 0
  if (!existing) {
    const base = await grantXP(user.id, 20, 'Sono registrado 🌙', 'health', data.id)
    xpEarned += base.xpEarned

    if (body.duration_hours && body.duration_hours >= 8) {
      const bonus = await grantXP(user.id, 10, 'Sono ideal (8h+) 💤', 'health', data.id)
      xpEarned += bonus.xpEarned
    }

    if (xpEarned > 0) {
      await supabase
        .from('sleep_logs')
        .update({ xp_earned: xpEarned })
        .eq('id', data.id)
    }
  }

  return NextResponse.json({ ...data, xpEarned })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'missing_date' }, { status: 400 })

  const { error } = await supabase
    .from('sleep_logs')
    .delete()
    .eq('date', date)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
