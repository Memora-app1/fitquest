import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { XP_REWARDS } from '@/lib/xp';
import { grantXP, tryUnlockAchievement } from '@/lib/xp-server';
import { updateUserStreak } from '@/lib/streak';

export const maxDuration = 30;

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  list_id: z.string().uuid().nullable().optional(),
  urgent: z.boolean().default(false),
  important: z.boolean().default(false),
  due_date: z.string().datetime().nullable().optional(),
  status: z.enum(['todo', 'doing', 'done', 'archived']).default('todo'),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['todo', 'doing', 'done', 'archived']).optional(),
  urgent: z.boolean().optional(),
  important: z.boolean().optional(),
  due_date: z.string().datetime().nullable().optional(),
  display_order: z.number().optional(),
  list_id: z.string().uuid().nullable().optional(),
});

// GET /api/tasks?status=todo
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');

  let query = supabase
    .from('tasks')
    .select(
      'id, user_id, list_id, title, description, status, display_order, urgent, important, due_date, reminder_at, estimated_minutes, completed_at, google_event_id, recurrence_rule, parent_task_id, xp_reward, created_at, updated_at'
    )
    .eq('user_id', user.id)
    .order('display_order')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  query = query.limit(500);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });

  return NextResponse.json({ tasks: data });
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const xpReward =
    parsed.data.urgent && parsed.data.important
      ? XP_REWARDS.TASK_URGENT_IMPORTANT
      : XP_REWARDS.TASK_COMPLETED;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...parsed.data,
      user_id: user.id,
      xp_reward: xpReward,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });

  return NextResponse.json({ task: data });
}

// PATCH /api/tasks
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { id, ...updates } = parsed.data;

  // Buscar task atual pra detectar mudança de status para "done"
  const { data: current } = await supabase
    .from('tasks')
    .select('status, urgent, important, xp_reward, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const isCompletingNow = updates.status === 'done' && current.status !== 'done';

  // Se está marcando como done, setar completed_at
  const finalUpdates: Record<string, unknown> = { ...updates };
  if (isCompletingNow) {
    finalUpdates.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== 'done') {
    finalUpdates.completed_at = null;
  }

  // Se urgent/important mudou, recalcular xp_reward
  if (updates.urgent !== undefined || updates.important !== undefined) {
    const newUrgent = updates.urgent ?? current.urgent;
    const newImportant = updates.important ?? current.important;
    finalUpdates.xp_reward =
      newUrgent && newImportant ? XP_REWARDS.TASK_URGENT_IMPORTANT : XP_REWARDS.TASK_COMPLETED;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(finalUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });

  let xpEarned = 0;
  let leveledUp = false;
  let newLevel = 0;
  const achievementsUnlocked: string[] = [];

  // Conceder XP se completou agora
  if (isCompletingNow) {
    const xpResult = await grantXP(
      user.id,
      current.xp_reward,
      `Tarefa: ${current.title}`,
      'task',
      id
    );
    xpEarned = xpResult.xpEarned;
    leveledUp = xpResult.leveledUp;
    newLevel = xpResult.newLevel;
    achievementsUnlocked.push(...xpResult.achievementsUnlocked);

    // First task achievement
    const { count } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done');
    for (const [n, slug] of [
      [1, 'first_task'],
      [50, 'tasks_50'],
      [200, 'tasks_200'],
    ] as [number, string][]) {
      if (count === n) {
        const unlocked = await tryUnlockAchievement(user.id, slug);
        if (unlocked) achievementsUnlocked.push(slug);
      }
    }

    await updateUserStreak(user.id);
  }

  return NextResponse.json({ task: data, xpEarned, leveledUp, newLevel, achievementsUnlocked });
}

// DELETE /api/tasks?id=...
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });

  return NextResponse.json({ success: true });
}
