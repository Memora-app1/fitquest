import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron toda segunda-feira às 09:00 UTC (~06:00 Brasília)
 * Envia email de resumo semanal para todos os usuários ativos.
 *
 * Antes: 4 queries por usuário × N usuários = O(4N).
 * Agora: 4 queries para TODOS os usuários, agrupadas em memória = O(4).
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendWeeklyDigest, type WeeklyDigestStats } from '@/lib/email';
import { MS_PER_DAY } from '@/lib/constants';
import { daysAgoISO } from '@/lib/dates';

export const maxDuration = 120;

const SOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  habit: { label: 'Hábitos', emoji: '🎯' },
  workout: { label: 'Treinos', emoji: '💪' },
  task: { label: 'Tarefas', emoji: '✅' },
  health: { label: 'Saúde', emoji: '💧' },
  transaction: { label: 'Finanças', emoji: '💰' },
  streak: { label: 'Streak', emoji: '🔥' },
  achievement: { label: 'Conquistas', emoji: '🏆' },
  goal: { label: 'Metas', emoji: '🎯' },
  bonus: { label: 'Bônus', emoji: '⭐' },
};

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();

  const supabase = createServiceClient();

  const sevenDaysAgoISO = daysAgoISO(7);
  const sevenDaysAgoDate = new Date(Date.now() - 7 * MS_PER_DAY).toISOString().split('T')[0]!;
  const today = new Date().toISOString().split('T')[0]!;

  // ── 1. Usuários elegíveis ────────────────────────────────────────────────────
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, xp_total, level, streak_current, streak_longest, perfect_days')
    .in('subscription_status', ['trial', 'active', 'lifetime'])
    .limit(50000);

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const userIds = users.map((u) => u.id);

  // ── 2. Emails via auth admin — paginado para cobrir >50 usuários ──────────────
  // listUsers() retorna no máx. 50 por página por padrão.
  // Sem paginação, usuários acima do 50º nunca recebem o digest.
  const emailMap = new Map<string, string>();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: authPage } = await supabase.auth.admin.listUsers({ page, perPage });
    const pageUsers = authPage?.users ?? [];
    for (const u of pageUsers) {
      if (u.email) emailMap.set(u.id, u.email);
    }
    if (pageUsers.length < perPage) break;
    page++;
  }

  // ── 3. Batch: todas as queries de dados em paralelo (4 queries para TODOS) ───
  const [xpTxRes, habitLogsRes, activeHabitsRes, tasksRes] = await Promise.all([
    // XP transactions da semana — todos os usuários de uma vez
    supabase
      .from('xp_transactions')
      .select('user_id, amount, source_type')
      .in('user_id', userIds)
      .gte('created_at', sevenDaysAgoISO)
      .limit(500000),

    // Hábitos completados esta semana — todos de uma vez
    supabase
      .from('habit_logs')
      .select('user_id')
      .in('user_id', userIds)
      .gte('logged_date', sevenDaysAgoDate)
      .lte('logged_date', today)
      .limit(500000),

    // Hábitos ativos por usuário — todos de uma vez
    supabase.from('habits').select('user_id').in('user_id', userIds).eq('is_active', true).limit(200000),

    // Tarefas concluídas esta semana — todos de uma vez
    supabase
      .from('tasks')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'done')
      .gte('completed_at', sevenDaysAgoISO)
      .limit(500000),
  ]);

  // ── 4. Agrupa dados em memória por user_id ────────────────────────────────────
  // XP por usuário
  const xpByUser = new Map<string, { total: number; bySource: Record<string, number> }>();
  for (const tx of xpTxRes.data ?? []) {
    const uid = tx.user_id as string;
    if (!xpByUser.has(uid)) xpByUser.set(uid, { total: 0, bySource: {} });
    const entry = xpByUser.get(uid)!;
    const amount = (tx.amount as number) ?? 0;
    const src = (tx.source_type as string) ?? 'bonus';
    entry.total += amount;
    entry.bySource[src] = (entry.bySource[src] ?? 0) + amount;
  }

  // Hábitos completados por usuário
  const habitLogsByUser = new Map<string, number>();
  for (const log of habitLogsRes.data ?? []) {
    const uid = log.user_id as string;
    habitLogsByUser.set(uid, (habitLogsByUser.get(uid) ?? 0) + 1);
  }

  // Hábitos ativos por usuário
  const activeHabitsByUser = new Map<string, number>();
  for (const h of activeHabitsRes.data ?? []) {
    const uid = h.user_id as string;
    activeHabitsByUser.set(uid, (activeHabitsByUser.get(uid) ?? 0) + 1);
  }

  // Tarefas concluídas por usuário
  const tasksByUser = new Map<string, number>();
  for (const t of tasksRes.data ?? []) {
    const uid = t.user_id as string;
    tasksByUser.set(uid, (tasksByUser.get(uid) ?? 0) + 1);
  }

  // ── 5. Enviar emails (N envios, inevitável) ───────────────────────────────────
  let sent = 0;
  let errors = 0;

  for (const user of users) {
    const email = emailMap.get(user.id);
    if (!email) continue;

    try {
      const xpData = xpByUser.get(user.id) ?? { total: 0, bySource: {} };
      const topSources = Object.entries(xpData.bySource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([src, xp]) => {
          const cfg = SOURCE_LABELS[src] ?? { label: 'Outros', emoji: '✨' };
          return { label: cfg.label, emoji: cfg.emoji, xp };
        });

      const habitsCompleted = habitLogsByUser.get(user.id) ?? 0;
      const activeHabits = activeHabitsByUser.get(user.id) ?? 0;
      const tasksCompleted = tasksByUser.get(user.id) ?? 0;

      const stats: WeeklyDigestStats = {
        streakCurrent: user.streak_current,
        streakLongest: user.streak_longest,
        xpThisWeek: xpData.total,
        xpTotal: user.xp_total,
        level: user.level,
        habitsCompletedThisWeek: habitsCompleted,
        habitsTarget: activeHabits * 7,
        tasksCompletedThisWeek: tasksCompleted,
        perfectDays: user.perfect_days,
        topSources,
      };

      await sendWeeklyDigest(email, user.name, stats);
      sent++;
    } catch (err) {
      console.error(`weekly-digest error for ${user.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, processed: users.length, sent, errors });
}
