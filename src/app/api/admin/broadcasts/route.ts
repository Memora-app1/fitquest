import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin';
import { z } from 'zod';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  push_title: z.string().min(1).max(100),
  push_body: z.string().min(1).max(200),
  push_url: z.string().max(200).optional(),
  target_segment: z.enum(['all', 'trial', 'active', 'lifetime', 'streak_active', 'at_risk']),
  scheduled_for: z.string().optional(),
  action: z.enum(['save_draft', 'send_now']),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'admin')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const form = await request.formData();
  const parsed = CreateSchema.safeParse({
    title: form.get('title'),
    push_title: form.get('push_title'),
    push_body: form.get('push_body'),
    push_url: form.get('push_url') || undefined,
    target_segment: form.get('target_segment'),
    scheduled_for: form.get('scheduled_for') || undefined,
    action: form.get('action'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL('/admin/operacoes/notificacoes?error=invalid', request.url)
    );
  }

  const db = createServiceClient();
  const isSendNow = parsed.data.action === 'send_now';

  const adminId = session!.userId;
  const adminRole = session!.role;

  const { data: campaign } = await db
    .from('broadcast_campaigns')
    .insert({
      title: parsed.data.title,
      push_title: parsed.data.push_title,
      push_body: parsed.data.push_body,
      push_url: parsed.data.push_url ?? null,
      target_segment: parsed.data.target_segment,
      scheduled_for: parsed.data.scheduled_for
        ? new Date(parsed.data.scheduled_for).toISOString()
        : isSendNow
          ? new Date().toISOString()
          : null,
      status: isSendNow ? 'sending' : 'draft',
      created_by: adminId,
    })
    .select()
    .single();

  await auditLog({
    adminId,
    adminRole,
    action: isSendNow ? 'broadcast.send' : 'broadcast.create_draft',
    targetType: 'broadcast',
    targetId: campaign?.id,
    payload: { title: parsed.data.title, segment: parsed.data.target_segment },
  });

  // Se send_now, dispara o envio em background
  if (isSendNow && campaign) {
    const origin = request.nextUrl.origin;
    fetch(`${origin}/api/admin/broadcasts/${campaign.id}/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => null);
  }

  return NextResponse.redirect(new URL('/admin/operacoes/notificacoes', request.url));
}
