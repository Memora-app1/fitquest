import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { grantXP, tryUnlockAchievement } from '@/lib/xp-server'

// GET /api/subtasks?taskId=...
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'missing_task_id' }, { status: 400 })

  // Verify task ownership
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()
  if (!task) return NextResponse.json({ error: 'task_not_found' }, { status: 404 })

  const { data, error } = await supabase
    .from('subtasks')
    .select('id, task_id, title, is_completed, display_order, completed_at, created_at')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('display_order')

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  return NextResponse.json({ subtasks: data ?? [] })
}

// POST /api/subtasks
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const schema = z.object({
    task_id: z.string().uuid(),
    title: z.string().min(1).max(300).trim(),
  })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  // Verify task ownership
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', parsed.data.task_id)
    .eq('user_id', user.id)
    .single()
  if (!task) return NextResponse.json({ error: 'task_not_found' }, { status: 404 })

  // Count existing subtasks for display_order
  const { count } = await supabase
    .from('subtasks')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', parsed.data.task_id)

  const { data, error } = await supabase
    .from('subtasks')
    .insert({
      task_id: parsed.data.task_id,
      user_id: user.id,
      title: parsed.data.title,
      is_completed: false,
      display_order: (count ?? 0) + 1,
    })
    .select('id, task_id, title, is_completed, display_order, completed_at, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  return NextResponse.json({ subtask: data }, { status: 201 })
}

// PATCH /api/subtasks
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const schema = z.object({
    id: z.string().uuid(),
    is_completed: z.boolean().optional(),
    title: z.string().min(1).max(300).trim().optional(),
  })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  const { id, ...updates } = parsed.data
  const finalUpdates: Record<string, unknown> = { ...updates }

  if (updates.is_completed !== undefined) {
    finalUpdates.completed_at = updates.is_completed ? new Date().toISOString() : null
  }

  // Check if was previously uncompleted (to grant XP only once)
  const { data: current } = await supabase
    .from('subtasks')
    .select('is_completed')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { data, error } = await supabase
    .from('subtasks')
    .update(finalUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, task_id, title, is_completed, display_order, completed_at, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'update_failed' }, { status: 500 })

  // 10 XP per subtask completion (half a task)
  let xpEarned = 0
  if (updates.is_completed && current && !current.is_completed) {
    const result = await grantXP(user.id, 10, `Subtarefa: ${data.title}`, 'task', data.id)
    xpEarned = result.xpEarned

    // Achievement checks
    const { count: subtaskCount } = await supabase
      .from('subtasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true)

    const total = subtaskCount ?? 0
    const achievementsUnlocked: string[] = []
    for (const [n, slug] of [[1, 'first_subtask'], [50, 'subtasks_50']] as [number, string][]) {
      if (total === n && await tryUnlockAchievement(user.id, slug)) {
        achievementsUnlocked.push(slug)
      }
    }
    return NextResponse.json({ subtask: data, xpEarned, achievementsUnlocked })
  }

  return NextResponse.json({ subtask: data, xpEarned })
}

// DELETE /api/subtasks?id=...
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
