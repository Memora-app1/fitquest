import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);

  if (!session || !hasMinRole(session, 'support')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const { id: userId } = await params;
  const form = await request.formData();
  const note = ((form.get('note') as string) ?? '').trim();

  if (!note) {
    return NextResponse.redirect(new URL(`/admin/usuarios/${userId}`, request.url));
  }

  const db = createServiceClient();

  await db.from('user_admin_notes').insert({
    user_id: userId,
    admin_id: session.userId,
    note,
  });

  await auditLog({
    adminId: session.userId,
    adminRole: session.role,
    action: 'user.note_added',
    targetType: 'user',
    targetId: userId,
    payload: { note },
  });

  return NextResponse.redirect(new URL(`/admin/usuarios/${userId}`, request.url));
}
