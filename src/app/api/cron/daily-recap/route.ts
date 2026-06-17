import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron diário às 00:00 UTC (~21:00 Brasília)
 * Envia push de resumo do dia para usuários que tiveram atividade hoje.
 * Celebra o progresso do dia antes de dormir — momento ideal para retenção.
 *
 * Deduplicação: tipo 'daily_recap' com sent_at de hoje.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/webpush';

export const maxDuration = 120;

// Tamanho do chunk para envio paralelo de push notifications
const SEND_CHUNK_SIZE = 15;

interface UserRow {
  id: string;
  name: string;
  streak_current: number;
}

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

function groupCount(rows: { user_id: string }[] | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
  }
  return map;
}

function groupSum(rows: { user_id: string; amount: number }[] | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + ((row.amount as number) ?? 0));
  }
  return map;
}

function groupSubs(rows: SubRow[] | null): Map<string, SubRow[]> {
  const map = new Map<string, SubRow[]>();
  for (const row of rows ?? []) {
    const list = map.get(row.user_id) ?? [];
    list.push(row);
    map.set(row.user_id, list);
  }
  return map;
}

function buildMessage(
  user: UserRow,
  habitCount: number,
  xpEarned: number,
  workoutCount: number
): { title: string; body: string } | null {
  if (habitCount === 0 && xpEarned === 0 && workoutCount === 0) return null;

  const firstName = user.name.split(' ')[0] ?? user.name;
  const streak = user.streak_current;

  let title = '';
  let body = '';

  if (xpEarned >= 500) {
    title = `⚡ Dia épico, ${firstName}!`;
    body = `+${xpEarned.toLocaleString('pt-BR')} XP hoje`;
  } else if (habitCount >= 3) {
    title = `🎯 ${habitCount} hábitos hoje, ${firstName}!`;
    body =
      xpEarned > 0 ? `+${xpEarned.toLocaleString('pt-BR')} XP ganhos` : 'Consistência é a chave.';
  } else if (workoutCount > 0) {
    title = `💪 Treino feito, ${firstName}!`;
    body = `+${xpEarned.toLocaleString('pt-BR')} XP · ${streak > 0 ? `${streak} dias de streak 🔥` : 'Continue amanhã!'}`;
  } else {
    title = `✅ Progresso de hoje, ${firstName}`;
    body =
      xpEarned > 0
        ? `+${xpEarned.toLocaleString('pt-BR')} XP${streak > 0 ? ` · streak ${streak} dias 🔥` : ''}`
        : 'Cada passo conta. Até amanhã!';
  }

  if (streak >= 7 && !body.includes('streak')) {
    body += ` · 🔥 ${streak} dias`;
  }

  return { title, body };
}

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0]!;

  // ── Busca usuários ativos (1 query) ─────────────────────────────────────────
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, streak_current')
    .in('subscription_status', ['trial', 'active', 'lifetime'])
    .limit(100000);

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // ── Quem já recebeu recap hoje (1 query) ────────────────────────────────────
  const { data: alreadySentList } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'daily_recap')
    .gte('created_at', `${today}T00:00:00`)
    .limit(100000);

  const alreadySentSet = new Set((alreadySentList ?? []).map((n) => n.user_id as string));
  const pendingUsers = (users as UserRow[]).filter((u) => !alreadySentSet.has(u.id));

  if (pendingUsers.length === 0) {
    return NextResponse.json({ ok: true, processed: users.length, sent: 0, skipped: users.length });
  }

  const pendingIds = pendingUsers.map((u) => u.id);

  // ── Batch: busca TODA a atividade do dia de uma vez (4 queries paralelas) ───
  const [habitLogsRes, xpTodayRes, workoutsRes, subsRes] = await Promise.all([
    supabase
      .from('habit_logs')
      .select('user_id')
      .in('user_id', pendingIds)
      .eq('logged_date', today)
      .limit(500000),
    supabase
      .from('xp_transactions')
      .select('user_id, amount')
      .in('user_id', pendingIds)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1000000),
    supabase
      .from('workouts')
      .select('user_id')
      .in('user_id', pendingIds)
      .gte('created_at', `${today}T00:00:00`)
      .limit(200000),
    supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys_p256dh, keys_auth')
      .in('user_id', pendingIds)
      .limit(100000),
  ]);

  // ── Agrega em memória por usuário ────────────────────────────────────────────
  const habitCounts = groupCount(habitLogsRes.data as { user_id: string }[] | null);
  const xpByUser = groupSum(
    xpTodayRes.data as { user_id: string; amount: number }[] | null
  );
  const workoutCounts = groupCount(workoutsRes.data as { user_id: string }[] | null);
  const subsByUser = groupSubs(subsRes.data as SubRow[] | null);

  // ── Filtra apenas quem tem atividade E push registrado ──────────────────────
  const activeUsers = pendingUsers.filter((user) => {
    const habits = habitCounts.get(user.id) ?? 0;
    const xp = xpByUser.get(user.id) ?? 0;
    const workouts = workoutCounts.get(user.id) ?? 0;
    const subs = subsByUser.get(user.id) ?? [];
    return (habits > 0 || xp > 0 || workouts > 0) && subs.length > 0;
  });

  let sent = 0;
  const skipped = pendingUsers.length - activeUsers.length + alreadySentSet.size;

  // ── Envia em chunks paralelos para não sobrecarregar a fila ─────────────────
  for (let i = 0; i < activeUsers.length; i += SEND_CHUNK_SIZE) {
    const chunk = activeUsers.slice(i, i + SEND_CHUNK_SIZE);

    await Promise.all(
      chunk.map(async (user) => {
        try {
          const habitCount = habitCounts.get(user.id) ?? 0;
          const xpEarned = xpByUser.get(user.id) ?? 0;
          const workoutCount = workoutCounts.get(user.id) ?? 0;
          const subs = subsByUser.get(user.id) ?? [];

          const msg = buildMessage(user, habitCount, xpEarned, workoutCount);
          if (!msg) return;

          for (const sub of subs) {
            const result = await sendPushNotification(
              sub.endpoint,
              sub.keys_p256dh,
              sub.keys_auth,
              { title: msg.title, body: msg.body, url: '/dashboard' }
            );
            if (result.gone) await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }

          // Registra para deduplicação
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'daily_recap',
            title: msg.title,
            body: msg.body,
            action_url: '/dashboard',
            scheduled_for: new Date().toISOString(),
            sent_at: new Date().toISOString(),
          });

          sent++;
        } catch (err) {
          console.error(`daily-recap error for ${user.id}:`, err);
        }
      })
    );
  }

  return NextResponse.json({ ok: true, processed: users.length, sent, skipped });
}
