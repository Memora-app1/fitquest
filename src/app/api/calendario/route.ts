import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── GET — fetch events + tasks for a given month ──────────────────────────────
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
      .select('id, title, start_at, end_at, source, color, description, location')
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

// ── POST — create a new calendar event ────────────────────────────────────────
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  start_at: z.string().datetime(),
  end_at: z.string().datetime().nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  location: z.string().max(300).nullable().optional(),
  all_day: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 422 })
  }

  const { title, start_at, end_at, color, description, location, all_day } = parsed.data

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: user.id,
      title,
      start_at,
      end_at: end_at ?? null,
      color: color ?? '#3B82F6',
      description: description ?? null,
      location: location ?? null,
      all_day: all_day ?? false,
      source: 'manual',
    })
    .select('id, title, start_at, end_at, source, color, description, location')
    .single()

  if (error) {
    console.error('[calendario POST]', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}

// ── DELETE — remove a calendar event ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  // Verify ownership before deleting
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id, source')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[calendario DELETE]', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ── PATCH — update a calendar event ───────────────────────────────────────────
const updateEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  location: z.string().max(300).nullable().optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 422 })
  }

  const { id, ...updates } = parsed.data

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, title, start_at, end_at, source, color, description, location')
    .single()

  if (error) {
    console.error('[calendario PATCH]', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ event: data })
}
