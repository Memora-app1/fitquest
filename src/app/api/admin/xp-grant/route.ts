import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin';
import { calculateLevel } from '@/lib/xp';
import { z } from 'zod';

const Schema = z.object({
  user_id: z.string().uuid(),
  amount: z.coerce.number().int().min(-100000).max(100000),
  reason: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'support')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const form = await request.formData();
  const parsed = Schema.safeParse({
    user_id: form.get('user_id'),
    amount: form.get('amount'),
    reason: form.get('reason'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL('/admin/gamificacao/xp?error=invalid', request.url));
  }

  const db = createServiceClient();

  const { data: profile } = await db
    .from('profiles')
    .select('xp_total, level')
    .eq('id', parsed.data.user_id)
    .single();

  if (!profile) {
    return NextResponse.redirect(new URL('/admin/gamificacao/xp?error=not_found', request.url));
  }

  const newXp = Math.max(0, (profile.xp_total ?? 0) + parsed.data.amount);
  const newLevel = calculateLevel(newXp);

  await db.from('xp_transactions').insert({
    user_id: parsed.data.user_id,
    amount: parsed.data.amount,
    reason: `[Admin] ${parsed.data.reason}`,
    source_type: parsed.data.amount > 0 ? 'admin_grant' : 'admin_deduct',
    xp_total_after: newXp,
    level_after: newLevel,
  });

  await db
    .from('profiles')
    .update({ xp_total: newXp, level: newLevel })
    .eq('id', parsed.data.user_id);

  await auditLog({
    adminId: session.userId,
    adminRole: session.role,
    action: 'xp.manual_grant',
    targetType: 'user',
    targetId: parsed.data.user_id,
    payload: { amount: parsed.data.amount, reason: parsed.data.reason, newXp },
  });

  return NextResponse.redirect(new URL('/admin/gamificacao/xp', request.url));
}
