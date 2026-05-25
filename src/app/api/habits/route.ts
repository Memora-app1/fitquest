import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  // Soft-delete: marca como inativo em vez de deletar
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('habits DELETE: falha', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json() as {
    id?: string
    name?: string
    icon?: string
    color?: string
    frequency_per_week?: number
  }

  if (!body.id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name
  if (body.icon !== undefined) updates.icon = body.icon
  if (body.color !== undefined) updates.color = body.color
  if (body.frequency_per_week !== undefined) {
    updates.frequency_per_week = body.frequency_per_week
    updates.target_value = body.frequency_per_week
  }

  const { error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', body.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('habits PATCH: falha', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
