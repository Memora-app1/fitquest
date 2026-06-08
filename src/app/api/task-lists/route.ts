import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#7C3AED'),
  icon: z.string().max(10).nullable().optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).trim().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(10).nullable().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('task_lists')
    .select('id, name, color, icon, display_order, created_at')
    .eq('user_id', user.id)
    .order('display_order')

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  return NextResponse.json({ lists: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  // Max 20 lists per user
  const { count } = await supabase
    .from('task_lists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if ((count ?? 0) >= 20) {
    return NextResponse.json({ error: 'max_lists_reached' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('task_lists')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon ?? null,
      display_order: (count ?? 0) + 1,
    })
    .select('id, name, color, icon, display_order, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  return NextResponse.json({ list: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = updateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  const { id, ...updates } = parsed.data

  const { data, error } = await supabase
    .from('task_lists')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, color, icon, display_order, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ list: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  // Move tasks in this list to no-list (null)
  await supabase
    .from('tasks')
    .update({ list_id: null })
    .eq('list_id', id)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('task_lists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
