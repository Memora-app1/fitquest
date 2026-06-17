import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron diário às 23:00 UTC (~20:00 Brasília)
 * Envia push notification para usuários com streak ativo que ainda não
 * registraram nenhuma atividade hoje.
 *
 * Antes: loop com 5 queries por usuário → O(5N), timeout com 300+ usuários.
 * Agora: 6 queries para TODOS os usuários + envio push apenas para quem precisa.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/webpush';
import { todayString } from '@/lib/utils';

export const maxDuration = 60;

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();

  const supabase = createServiceClient();
  const today = todayString();

  // ── 1. Usuários com streak ativo ─────────────────────────────────────────────
  const { data: atRiskUsers } = await supabase
    .from('profiles')
    .select('id, name, streak_current')
    .gt('streak_current', 0)
    .limit(100000);

  if (!atRiskUsers || atRiskUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 });
  }

  const userIds = atRiskUsers.map((u) => u.id);

  // ── 2. Batch: quem já teve atividade hoje? (3 queries para TODOS) ────────────
  const [habitLogs, workoutLogs, taskLogs] = await Promise.all([
    supabase.from('habit_logs').select('user_id').eq('logged_date', today).in('user_id', userIds).limit(100000),
    supabase
      .from('workouts')
      .select('user_id')
      .gte('finished_at', `${today}T00:00:00`)
      .lte('finished_at', `${today}T23:59:59`)
      .in('user_id', userIds)
      .limit(100000),
    supabase
      .from('tasks')
      .select('user_id')
      .eq('status', 'done')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`)
      .in('user_id', userIds)
      .limit(100000),
  ]);

  const activeToday = new Set([
    ...(habitLogs.data ?? []).map((r) => r.user_id),
    ...(workoutLogs.data ?? []).map((r) => r.user_id),
    ...(taskLogs.data ?? []).map((r) => r.user_id),
  ]);

  // ── 3. Batch: quem já recebeu alert hoje? (1 query para TODOS) ───────────────
  const { data: alreadyAlerted } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'streak_alert')
    .gte('created_at', `${today}T00:00:00`)
    .in('user_id', userIds)
    .limit(50000);

  const alertedToday = new Set((alreadyAlerted ?? []).map((r) => r.user_id));

  // ── 4. Filtrar quem precisa receber o alert ───────────────────────────────────
  const needsAlert = atRiskUsers.filter((u) => !activeToday.has(u.id) && !alertedToday.has(u.id));

  if (needsAlert.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: atRiskUsers.length,
      sent: 0,
      skipped: atRiskUsers.length,
    });
  }

  // ── 5. Batch: buscar push subscriptions de quem precisa (1 query) ────────────
  const needsAlertIds = needsAlert.map((u) => u.id);
  const { data: allSubs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys_p256dh, keys_auth')
    .in('user_id', needsAlertIds)
    .limit(50000);

  // Agrupar subscriptions por user_id para acesso O(1)
  const subsByUser = new Map<string, typeof allSubs>();
  for (const sub of allSubs ?? []) {
    const userId = sub.user_id as string;
    if (!subsByUser.has(userId)) subsByUser.set(userId, []);
    subsByUser.get(userId)!.push(sub);
  }

  // ── 6. Enviar push e registrar notificações ───────────────────────────────────
  let sent = 0;
  let skipped = atRiskUsers.length - needsAlert.length;

  const deadSubIds: string[] = [];
  const notificationsToInsert: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    scheduled_for: string;
    sent_at: string;
  }[] = [];

  for (const user of needsAlert) {
    const subs = subsByUser.get(user.id);
    if (!subs || subs.length === 0) {
      skipped++;
      continue;
    }

    const streak = user.streak_current as number;
    const title =
      streak >= 30
        ? `🔥 ${streak} dias de streak em perigo!`
        : streak >= 7
          ? `⚠️ Seu streak de ${streak} dias está em risco`
          : `⚠️ Registre uma atividade hoje`;

    const body =
      streak >= 30
        ? `Faltam menos de 4h para meia-noite. Não perca ${streak} dias seguidos agora!`
        : streak >= 7
          ? `Seu streak de ${streak} dias acaba à meia-noite. Registre um hábito rápido!`
          : `Você tem um streak ativo. Registre algo antes da meia-noite para mantê-lo.`;

    for (const sub of subs) {
      const result = await sendPushNotification(
        sub.endpoint as string,
        sub.keys_p256dh as string,
        sub.keys_auth as string,
        { title, body, url: '/habitos' }
      );
      if (result.gone) deadSubIds.push(sub.id as string);
    }

    notificationsToInsert.push({
      user_id: user.id,
      type: 'streak_alert',
      title,
      body,
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });

    sent++;
  }

  // Batch insert de todas as notificações de uma vez
  if (notificationsToInsert.length > 0) {
    await supabase.from('notifications').insert(notificationsToInsert);
  }

  // Batch delete de subscriptions expiradas
  if (deadSubIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', deadSubIds);
  }

  return NextResponse.json({
    ok: true,
    processed: atRiskUsers.length,
    sent,
    skipped,
  });
}
