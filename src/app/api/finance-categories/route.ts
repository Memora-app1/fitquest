import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  type: z.enum(['expense', 'income']),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).trim().optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
})

// GET — retorna categorias globais + próprias do usuário
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('finance_categories')
    .select('id, name, type, icon, color, is_global, user_id')
    .or(`is_global.eq.true,user_id.eq.${user.id}`)
    .order('is_global', { ascending: false }) // global first
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  // Max 50 custom categories per user
  const { count } = await supabase
    .from('finance_categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_global', false)
  if ((count ?? 0) >= 50) {
    return NextResponse.json({ error: 'max_categories_reached' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('finance_categories')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
      is_global: false,
    })
    .select('id, name, type, icon, color, is_global, user_id')
    .single()

  if (error || !data) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  return NextResponse.json({ category: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = updateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  const { id, ...updates } = parsed.data

  const { data, error } = await supabase
    .from('finance_categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // only user's own categories
    .eq('is_global', false)  // cannot modify global categories
    .select('id, name, type, icon, color, is_global, user_id')
    .single()

  if (error || !data) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ category: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('finance_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_global', false) // cannot delete global categories

  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
