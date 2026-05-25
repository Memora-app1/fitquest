import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()

  const [eventsRes, tasksRes] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, start_at, end_at, source, color')
      .eq('user_id', user.id)
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at'),
    supabase
      .from('tasks')
      .select('id, title, due_date, urgent, important, status')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', start)
      .lte('due_date', end)
      .neq('status', 'archived')
      .order('due_date'),
  ])

  return NextResponse.json({
    events: eventsRes.data ?? [],
    tasks: tasksRes.data ?? [],
  })
}
