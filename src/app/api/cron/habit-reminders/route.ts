import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron horário — envia push de lembrete para hábitos com reminder_time na hora atual.
 * Só envia se o hábito ainda não foi logado hoje.
 *
 * Antes: 2 queries por usuário (dedup + push subs) = O(2N).
 * Agora: batch dedup + batch push subs = O(2) queries extras.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/webpush';
import { todayString } from '@/lib/utils';
import { DEFAULT_TIMEZONE } from '@/lib/constants';

export const maxDuration = 60;

function getSaoPauloHour(): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
    10
  );
}

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();

  const supabase = createServiceClient();
  const currentHour = getSaoPauloHour();
  const today = todayString();
  const hourStr = String(currentHour).padStart(2, '0') + ':00:00';

  // ── 1. Hábitos com lembrete na hora atual ─────────────────────────────────────
  const { data: habits } = await supabase
    .from('habits')
    .select('id, user_id, name, icon')
    .eq('is_active', true)
    .eq('reminder_time', hourStr);

  if (!habits || habits.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, hour: currentHour });
  }

  // ── 2. Batch: hábitos já logados hoje ─────────────────────────────────────────
  const habitIds = habits.map((h) => h.id);
  const { data: logsToday } = await supabase
    .from('habit_logs')
    .select('habit_id')
    .in('habit_id', habitIds)
    .eq('logged_date', today);

  const loggedSet = new Set((logsToday ?? []).map((l) => l.habit_id));
  const toRemind = habits.filter((h) => !loggedSet.has(h.id));

  if (toRemind.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: habits.length });
  }

  // Agrupa hábitos por user_id
  const byUser: Record<string, Array<{ id: string; name: string; icon: string }>> = {};
  for (const h of toRemind) {
    const uid = h.user_id as string;
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push({ id: h.id, name: h.name as string, icon: h.icon as string });
  }

  const allUserIds = Object.keys(byUser);

  // ── 3. Batch: deduplicação para todos de uma vez ──────────────────────────────
  const { data: alreadySentRows } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'habit_reminder')
    .gte('created_at', `${today}T00:00:00`)
    .in('user_id', allUserIds);

  const alreadySentSet = new Set((alreadySentRows ?? []).map((r) => r.user_id as string));
  const toNotify = allUserIds.filter((uid) => !alreadySentSet.has(uid));

  if (toNotify.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: allUserIds.length });
  }

  // ── 4. Batch: push subscriptions para todos de uma vez ───────────────────────
  const { data: allSubs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys_p256dh, keys_auth')
    .in('user_id', toNotify);

  const subsByUser = new Map<string, typeof allSubs>();
  for (const sub of allSubs ?? []) {
    const uid = sub.user_id as string;
    if (!subsByUser.has(uid)) subsByUser.set(uid, []);
    subsByUser.get(uid)!.push(sub);
  }

  // ── 5. Enviar push e registrar notificações ───────────────────────────────────
  let sent = 0;
  let failed = 0;
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

  for (const userId of toNotify) {
    const subs = subsByUser.get(userId);
    const userHabits = byUser[userId];
    if (!subs || subs.length === 0 || !userHabits) {
      failed++;
      continue;
    }

    try {
      const title =
        userHabits.length === 1
          ? `Hora do hábito: ${userHabits[0]!.icon} ${userHabits[0]!.name}`
          : `${userHabits.length} hábitos te esperam`;
      const body =
        userHabits.length === 1
          ? 'Registre agora e mantenha seu streak!'
          : `${userHabits.map((h) => h.icon + ' ' + h.name).join(', ')}. Não quebre sua sequência!`;

      for (const sub of subs) {
        const result = await sendPushNotification(sub.endpoint, sub.keys_p256dh, sub.keys_auth, {
          title,
          body,
          url: '/habitos',
        });
        if (result.gone) deadSubIds.push(sub.id as string);
      }

      notificationsToInsert.push({
        user_id: userId,
        type: 'habit_reminder',
        title,
        body,
        action_url: '/habitos',
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      });

      sent++;
    } catch (err) {
      console.error(`habit reminder error for user ${userId}`, err);
      failed++;
    }
  }

  // Batch insert + batch delete
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
    hour: currentHour,
    usersChecked: allUserIds.length,
  });
}
