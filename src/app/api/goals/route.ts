import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createGoalSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(500).trim().optional(),
  icon: z.string().max(10).optional(),
  category: z.string().max(50).optional(),
  target_value: z.number().positive(),
  current_value: z.number().min(0).optional(),
  unit: z.string().max(50).trim(),
  deadline: z.string().datetime().nullable().optional(),
})

const updateGoalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).trim().optional(),
  current_value: z.number().min(0).optional(),
  deadline: z.string().datetime().nullable().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'paused']).optional(),
})

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('goals')
    .select('id, title, description, icon, category, target_value, current_value, unit, deadline, status, completed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })

  return NextResponse.json({ goals: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = createGoalSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      ...parsed.data,
      current_value: parsed.data.current_value ?? 0,
      category: parsed.data.category ?? 'custom',
      icon: parsed.data.icon ?? '🎯',
      status: 'active',
    })
    .select('id, title, description, icon, category, target_value, current_value, unit, deadline, status, completed_at, created_at')
    .single()

  if (error) {
    console.error('goals POST: falha', error)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }

  return NextResponse.json({ goal: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = updateGoalSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { id, ...updates } = parsed.data
  const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }

  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
    // Se a meta foi completada manualmente, seta current_value para target_value
  }

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, title, description, icon, category, target_value, current_value, unit, deadline, status, completed_at, created_at')
    .single()

  if (error) {
    console.error('goals PATCH: falha', error)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ goal: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('goals DELETE: falha', error)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
