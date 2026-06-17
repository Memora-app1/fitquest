import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron diário às 10:00 UTC (07:00 Brasília)
 * Envia emails automáticos para usuários em trial:
 * - D1: boas-vindas (criou conta há 1 dia)
 * - D5: urgência ("trial acaba em 2 dias")
 * - D6: último aviso ("acaba amanhã")
 *
 * Antes: getUserById() por usuário em loop = O(N) auth API calls.
 * Agora: listUsers() paginado uma vez = O(1) call para qualquer N.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTrialEndingEmail, sendWelcomeEmail } from '@/lib/email';

export const maxDuration = 60;

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();
  const supabase = createServiceClient();
  const now = new Date();

  const results = { welcome: 0, ending: 0, errors: 0 };

  const d1Start = new Date(now);
  d1Start.setDate(d1Start.getDate() - 1);
  d1Start.setHours(0, 0, 0, 0);
  const d1End = new Date(d1Start);
  d1End.setHours(23, 59, 59, 999);

  const d5Start = new Date(now);
  d5Start.setDate(d5Start.getDate() + 2);
  d5Start.setHours(0, 0, 0, 0);
  const d5End = new Date(d5Start);
  d5End.setHours(23, 59, 59, 999);

  const d6Start = new Date(now);
  d6Start.setDate(d6Start.getDate() + 1);
  d6Start.setHours(0, 0, 0, 0);
  const d6End = new Date(d6Start);
  d6End.setHours(23, 59, 59, 999);

  // ── 1. Busca usuários trial dos 3 grupos em paralelo ─────────────────────────
  const [d1Users, d5Users, d6Users] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name')
      .eq('subscription_status', 'trial')
      .gte('subscription_started_at', d1Start.toISOString())
      .lte('subscription_started_at', d1End.toISOString())
      .limit(1000),
    supabase
      .from('profiles')
      .select('id, name')
      .eq('subscription_status', 'trial')
      .gte('trial_end', d5Start.toISOString())
      .lte('trial_end', d5End.toISOString())
      .limit(1000),
    supabase
      .from('profiles')
      .select('id, name')
      .eq('subscription_status', 'trial')
      .gte('trial_end', d6Start.toISOString())
      .lte('trial_end', d6End.toISOString())
      .limit(1000),
  ]);

  const allUsers = [
    ...(d1Users.data ?? []),
    ...(d5Users.data ?? []),
    ...(d6Users.data ?? []),
  ];

  if (allUsers.length === 0) {
    return NextResponse.json({ ok: true, ...results });
  }

  // ── 2. Batch: busca emails de todos os usuários via listUsers() paginado ─────
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

  // ── 3. D1 — boas-vindas ──────────────────────────────────────────────────────
  for (const user of d1Users.data ?? []) {
    const email = emailMap.get(user.id);
    if (!email) continue;
    try {
      await sendWelcomeEmail(email, (user.name as string) ?? 'Atleta');
      results.welcome++;
    } catch (err) {
      console.error('trial email D1 error', user.id, err);
      results.errors++;
    }
  }

  // ── 4. D5 — acaba em 2 dias ──────────────────────────────────────────────────
  for (const user of d5Users.data ?? []) {
    const email = emailMap.get(user.id);
    if (!email) continue;
    try {
      await sendTrialEndingEmail(email, (user.name as string) ?? 'Atleta', 2);
      results.ending++;
    } catch (err) {
      console.error('trial email D5 error', user.id, err);
      results.errors++;
    }
  }

  // ── 5. D6 — acaba amanhã ─────────────────────────────────────────────────────
  for (const user of d6Users.data ?? []) {
    const email = emailMap.get(user.id);
    if (!email) continue;
    try {
      await sendTrialEndingEmail(email, (user.name as string) ?? 'Atleta', 1);
      results.ending++;
    } catch (err) {
      console.error('trial email D6 error', user.id, err);
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
