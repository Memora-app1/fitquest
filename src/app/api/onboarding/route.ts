import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { grantXP } from '@/lib/xp-server';
import { XP_REWARDS } from '@/lib/xp';

const bodySchema = z.object({
  primary_goal: z.string().max(200),
  weekly_target: z.number().int().min(1).max(7),
  habits: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        icon: z.string(),
        color: z.string(),
        category: z.string(),
        target_type: z.string(),
        target_value: z.number(),
        target_period: z.string(),
        target_unit: z.string().optional(),
        frequency_per_week: z.number().int().min(1).max(7),
        xp_per_completion: z.number().int(),
        display_order: z.number().int(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { primary_goal, weekly_target, habits } = parsed.data;

  // Verifica se já completou o onboarding (para não dar XP duas vezes)
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, name')
    .eq('id', user.id)
    .single();

  const wasAlreadyCompleted = profile?.onboarding_completed === true;

  if (!profile) {
    // Perfil não existe (OAuth sem trigger de banco) — cria com valores default
    await supabase.from('profiles').insert({
      id: user.id,
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split('@')[0] ??
        'Usuário',
      primary_goal,
      weekly_target,
      onboarding_completed: true,
      subscription_status: 'trial',
      trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
  } else {
    // Atualiza perfil existente
    await supabase
      .from('profiles')
      .update({ primary_goal, weekly_target, onboarding_completed: true })
      .eq('id', user.id);
  }

  // Cria hábitos sugeridos e captura o primeiro para o quick-win do onboarding
  let firstHabit: { id: string; name: string; icon: string } | null = null;
  if (habits.length > 0) {
    const { data: createdHabits } = await supabase
      .from('habits')
      .insert(habits.map((h) => ({ ...h, user_id: user.id })))
      .select('id, name, icon');
    if (createdHabits && createdHabits.length > 0) {
      firstHabit = createdHabits[0] as { id: string; name: string; icon: string };
    }
  }

  // Cria conta financeira padrão se o usuário tem interesse em finanças
  // e ainda não tem nenhuma conta criada
  if (primary_goal.includes('finance')) {
    const { count: existingAccounts } = await supabase
      .from('finance_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((existingAccounts ?? 0) === 0) {
      await supabase.from('finance_accounts').insert({
        user_id: user.id,
        name: 'Conta Principal',
        type: 'checking',
        icon: '🏦',
        color: '#00FF88',
        current_balance: 0,
        is_active: true,
      });
    }
  }

  // Cria lista de tarefas padrão para todos os usuários
  const { count: existingLists } = await supabase
    .from('task_lists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((existingLists ?? 0) === 0) {
    await supabase.from('task_lists').insert([
      { user_id: user.id, name: 'Pessoal', color: '#7C3AED', icon: '🎯', display_order: 1 },
      { user_id: user.id, name: 'Trabalho', color: '#3B82F6', icon: '💼', display_order: 2 },
    ]);
  }

  let xpEarned = 0;
  let leveledUp = false;
  let newLevel = 0;

  if (!wasAlreadyCompleted) {
    const xpResult = await grantXP(
      user.id,
      XP_REWARDS.ONBOARDING_COMPLETED,
      'Onboarding concluído! Bem-vindo ao Ascendia 🚀',
      'onboarding'
    );
    xpEarned = xpResult.xpEarned;
    leveledUp = xpResult.leveledUp;
    newLevel = xpResult.newLevel;
  }

  return NextResponse.json({ ok: true, xpEarned, leveledUp, newLevel, firstHabit });
}
