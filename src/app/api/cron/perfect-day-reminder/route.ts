import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron às 01:00 UTC (22:00 horário Brasília)
 * Envia push "Quase lá!" para usuários que têm hábitos pendentes hoje.
 * Só envia se o usuário tiver pelo menos 1 hábito feito mas não todos.
 *
 * Antes: 3 queries por usuário em loop = O(3N).
 * Agora: 4 queries para TODOS os usuários, agregação em memória = O(4).
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/webpush';

export const maxDuration = 120;

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0]!;

  // ── 1. Usuários ativos com assinatura válida (1 query) ──────────────────────
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, streak_current, recovery_week_active')
    .in('subscription_status', ['trial', 'active', 'lifetime']);

  if (!users || users.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const userIds = users.map((u) => u.id);

  // ── 2. Batch: deduplicação, hábitos e logs para TODOS de uma vez (3 queries paralelas) ───
  const [alreadySentRes, habitsRes, logsRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('user_id')
      .eq('type', 'perfect_day_reminder')
      .gte('created_at', `${today}T00:00:00`)
      .in('user_id', userIds),
    supabase
      .from('habits')
      .select('user_id')
      .in('user_id', userIds)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('user_id')
      .in('user_id', userIds)
      .eq('logged_date', today),
  ]);

  const sentSet = new Set((alreadySentRes.data ?? []).map((n) => n.user_id as string));

  // Agrega contagens em memória
  const habitTotalByUser = new Map<string, number>();
  for (const h of habitsRes.data ?? []) {
    const uid = h.user_id as string;
    habitTotalByUser.set(uid, (habitTotalByUser.get(uid) ?? 0) + 1);
  }

  const habitDoneByUser = new Map<string, number>();
  for (const l of logsRes.data ?? []) {
    const uid = l.user_id as string;
    habitDoneByUser.set(uid, (habitDoneByUser.get(uid) ?? 0) + 1);
  }

  // ── 3. Filtra candidatos a notificação ───────────────────────────────────────
  const candidates = users.filter((user) => {
    if (sentSet.has(user.id)) return false;
    if (user.recovery_week_active) return false;
    const total = habitTotalByUser.get(user.id) ?? 0;
    const done = habitDoneByUser.get(user.id) ?? 0;
    const pending = total - done;
    return total > 0 && done > 0 && pending > 0;
  });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: users.length });
  }

  // ── 4. Batch: push subscriptions apenas dos candidatos (1 query) ─────────────
  const candidateIds = candidates.map((u) => u.id);
  const { data: allSubs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys_p256dh, keys_auth')
    .in('user_id', candidateIds);

  const subsByUser = new Map<string, SubRow[]>();
  for (const sub of (allSubs ?? []) as SubRow[]) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  // ── 5. Envia push e coleta notificações para batch insert ─────────────────────
  let sent = 0;
  let skipped = users.length - candidates.length;
  const deadSubIds: string[] = [];
  const notificationsToInsert: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    action_url: string;
    scheduled_for: string;
    sent_at: string;
  }[] = [];

  for (const user of candidates) {
    const subs = subsByUser.get(user.id);
    if (!subs || subs.length === 0) {
      skipped++;
      continue;
    }

    const total = habitTotalByUser.get(user.id) ?? 0;
    const done = habitDoneByUser.get(user.id) ?? 0;
    const pending = total - done;
    const firstName = (user.name as string).split(' ')[0] ?? 'você';

    const title =
      pending === 1
        ? `🔥 Falta só 1 hábito, ${firstName}!`
        : `⚡ Faltam ${pending} hábitos, ${firstName}!`;
    const body = `Complete hoje e ganhe +200 XP de Dia Perfeito${user.streak_current > 0 ? ` + proteja seu streak de ${user.streak_current} dias` : ''}.`;

    try {
      for (const sub of subs) {
        const result = await sendPushNotification(sub.endpoint, sub.keys_p256dh, sub.keys_auth, {
          title,
          body,
          url: '/habitos',
        });
        if (result.gone) deadSubIds.push(sub.id);
      }

      notificationsToInsert.push({
        user_id: user.id,
        type: 'perfect_day_reminder',
        title,
        body,
        action_url: '/habitos',
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      });

      sent++;
    } catch (err) {
      console.error(`perfect-day-reminder error for ${user.id}`, err);
    }
  }

  // ── 6. Batch insert + batch delete ───────────────────────────────────────────
  if (notificationsToInsert.length > 0) {
    await supabase.from('notifications').insert(notificationsToInsert);
  }
  if (deadSubIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', deadSubIds);
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
