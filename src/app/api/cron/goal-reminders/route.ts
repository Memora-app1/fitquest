import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron diário às 09:00 UTC (~06:00 Brasília)
 * Envia push notification para metas com prazo nos próximos 7 dias
 * ou metas financeiras próximas de atingir a meta.
 *
 * Antes: 2 queries por meta em loop = O(2N).
 * Agora: batch dedup + batch push subs = O(6) queries fixas.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/webpush';

export const maxDuration = 60;

function getDaysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  deadline: string;
  current_value: number;
  target_value: number;
  unit: string;
}

interface FinanceGoalRow {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  current_amount: number;
  target_amount: number;
  deadline: string | null;
}

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

interface PendingNotification {
  user_id: string;
  type: string;
  title: string;
  body: string;
  source_id: string;
  action_url: string;
  scheduled_for: string;
  sent_at: string;
}

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();
  const supabase = createServiceClient();

  const now = new Date();
  const today = now.toISOString().split('T')[0]!;
  const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]!;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  // ── 1. Busca metas com prazo nos próximos 7 dias + metas financeiras (2 queries paralelas) ─
  const [goalsRes, financeGoalsRes] = await Promise.all([
    supabase
      .from('goals')
      .select('id, user_id, title, icon, deadline, current_value, target_value, unit')
      .eq('status', 'active')
      .not('deadline', 'is', null)
      .gte('deadline', today)
      .lte('deadline', in7Days)
      .limit(10000),
    supabase
      .from('finance_goals')
      .select('id, user_id, title, icon, current_amount, target_amount, deadline')
      .eq('status', 'active')
      .limit(10000),
  ]);

  const goalsWithDeadline = (goalsRes.data ?? []) as GoalRow[];
  const nearlyCompleteFinance = ((financeGoalsRes.data ?? []) as FinanceGoalRow[]).filter((g) => {
    const pct = g.target_amount > 0 ? g.current_amount / g.target_amount : 0;
    return pct >= 0.8 && pct < 1;
  });

  if (goalsWithDeadline.length === 0 && nearlyCompleteFinance.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 });
  }

  // ── 2. Batch: deduplicação e push subs para todos de uma vez (2 queries paralelas) ─────────
  const allGoalIds = [
    ...goalsWithDeadline.map((g) => g.id),
    ...nearlyCompleteFinance.map((g) => g.id),
  ];
  const allUserIds = [
    ...new Set([
      ...goalsWithDeadline.map((g) => g.user_id),
      ...nearlyCompleteFinance.map((g) => g.user_id),
    ]),
  ];

  const [dedupRes, subsRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('source_id')
      .in('source_id', allGoalIds)
      .gte('created_at', sevenDaysAgo)
      .limit(50000),
    supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys_p256dh, keys_auth')
      .in('user_id', allUserIds)
      .limit(50000),
  ]);

  const alreadySentIds = new Set((dedupRes.data ?? []).map((n) => n.source_id as string));

  const subsByUser = new Map<string, SubRow[]>();
  for (const sub of (subsRes.data ?? []) as SubRow[]) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  // ── 3. Monta notificações a enviar em memória ─────────────────────────────────
  const toSend: {
    userId: string;
    title: string;
    body: string;
    goalId: string;
    type: string;
    actionUrl: string;
  }[] = [];

  for (const goal of goalsWithDeadline) {
    if (alreadySentIds.has(goal.id)) continue;
    if (!(subsByUser.get(goal.user_id)?.length)) continue;

    const deadline = new Date(goal.deadline + 'T12:00:00');
    const daysLeft = getDaysBetween(now, deadline);
    const pct =
      goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0;

    const title =
      daysLeft === 0
        ? `Meta vence HOJE: ${goal.icon ?? '🎯'} ${goal.title}`
        : daysLeft === 1
          ? `Meta vence AMANHÃ: ${goal.icon ?? '🎯'} ${goal.title}`
          : `${daysLeft} dias para a meta: ${goal.icon ?? '🎯'} ${goal.title}`;

    const body = `${pct}% concluído (${goal.current_value}/${goal.target_value} ${goal.unit}). ${
      pct >= 80 ? 'Você está quase lá!' : 'Acelere para atingir o prazo!'
    }`;

    toSend.push({
      userId: goal.user_id,
      title,
      body,
      goalId: goal.id,
      type: 'task_reminder',
      actionUrl: '/metas',
    });
  }

  for (const goal of nearlyCompleteFinance) {
    if (alreadySentIds.has(goal.id)) continue;
    if (!(subsByUser.get(goal.user_id)?.length)) continue;

    const pct = Math.round((goal.current_amount / goal.target_amount) * 100);
    const remaining = goal.target_amount - goal.current_amount;
    const title = `${pct}% da meta: ${goal.icon ?? '💰'} ${goal.title}`;
    const body = `Faltam apenas R$ ${remaining.toFixed(2).replace('.', ',')} para você atingir o objetivo!`;

    toSend.push({
      userId: goal.user_id,
      title,
      body,
      goalId: goal.id,
      type: 'finance_due',
      actionUrl: '/financas/metas',
    });
  }

  // ── 4. Envia push e coleta notificações para batch insert ─────────────────────
  let sent = 0;
  let failed = 0;
  const deadSubIds: string[] = [];
  const notificationsToInsert: PendingNotification[] = [];

  for (const item of toSend) {
    const subs = subsByUser.get(item.userId) ?? [];
    try {
      for (const sub of subs) {
        const result = await sendPushNotification(sub.endpoint, sub.keys_p256dh, sub.keys_auth, {
          title: item.title,
          body: item.body,
          url: item.actionUrl,
        });
        if (result.gone) deadSubIds.push(sub.id);
      }

      notificationsToInsert.push({
        user_id: item.userId,
        type: item.type,
        title: item.title,
        body: item.body,
        source_id: item.goalId,
        action_url: item.actionUrl,
        scheduled_for: now.toISOString(),
        sent_at: now.toISOString(),
      });

      sent++;
    } catch (err) {
      console.error(`goal-reminder error for goal ${item.goalId}:`, err);
      failed++;
    }
  }

  // ── 5. Batch insert + batch delete ───────────────────────────────────────────
  if (notificationsToInsert.length > 0) {
    await supabase.from('notifications').insert(notificationsToInsert);
  }
  if (deadSubIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', deadSubIds);
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    goalsChecked: goalsWithDeadline.length,
    financeGoalsChecked: nearlyCompleteFinance.length,
  });
}
