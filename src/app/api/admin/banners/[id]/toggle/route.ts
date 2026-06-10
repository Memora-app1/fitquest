import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const { id } = await params
  const db     = createServiceClient()

  const { data: banner } = await db
    .from('app_banners')
    .select('is_active')
    .eq('id', id)
    .single()

  if (!banner) return NextResponse.redirect(new URL('/admin/operacoes/banners', request.url))

  const newState = !banner.is_active

  await db.from('app_banners').update({
    is_active:  newState,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  await auditLog({
    adminId:    session.userId,
    adminRole:  session.role,
    action:     'banner.toggle',
    targetType: 'banner',
    targetId:   id,
    payload:    { is_active: newState },
  })

  return NextResponse.redirect(new URL('/admin/operacoes/banners', request.url))
}
