import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'moderator')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const { id } = await params;
  const form = await request.formData();
  const status = form.get('status') as string;

  const allowed = ['reviewing', 'resolved', 'dismissed'];
  if (!allowed.includes(status)) {
    return NextResponse.redirect(new URL('/admin/seguranca/denuncias', request.url));
  }

  const db = createServiceClient();
  await db
    .from('user_reports')
    .update({
      status,
      resolved_by: status === 'resolved' || status === 'dismissed' ? session.userId : null,
      resolved_at:
        status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  await auditLog({
    adminId: session.userId,
    adminRole: session.role,
    action: `report.${status}`,
    targetType: 'report',
    targetId: id,
  });

  return NextResponse.redirect(new URL('/admin/seguranca/denuncias', request.url));
}
