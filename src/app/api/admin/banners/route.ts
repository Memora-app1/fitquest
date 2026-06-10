import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin'
import { z } from 'zod'

const CreateSchema = z.object({
  title:       z.string().min(1).max(100),
  body:        z.string().min(1).max(300),
  emoji:       z.string().max(4).optional(),
  cta_label:   z.string().max(50).optional(),
  cta_url:     z.string().max(200).optional(),
  color_from:  z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  color_to:    z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  target_plan: z.string().optional(),
  starts_at:   z.string().optional(),
  ends_at:     z.string().optional(),
  active:      z.enum(['true', 'false']),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const form   = await request.formData()
  const parsed = CreateSchema.safeParse({
    title:       form.get('title'),
    body:        form.get('body'),
    emoji:       form.get('emoji')      || undefined,
    cta_label:   form.get('cta_label')  || undefined,
    cta_url:     form.get('cta_url')    || undefined,
    color_from:  form.get('color_from') || undefined,
    color_to:    form.get('color_to')   || undefined,
    target_plan: form.get('target_plan') || undefined,
    starts_at:   form.get('starts_at')  || undefined,
    ends_at:     form.get('ends_at')    || undefined,
    active:      form.get('active'),
  })

  if (!parsed.success) {
    return NextResponse.redirect(new URL('/admin/operacoes/banners?error=invalid', request.url))
  }

  const db = createServiceClient()
  const isActive = parsed.data.active === 'true'

  const targetPlans = parsed.data.target_plan ? [parsed.data.target_plan] : null

  await db.from('app_banners').insert({
    title:       parsed.data.title,
    body:        parsed.data.body,
    emoji:       parsed.data.emoji      ?? '📣',
    cta_label:   parsed.data.cta_label  ?? null,
    cta_url:     parsed.data.cta_url    ?? null,
    color_from:  parsed.data.color_from ?? '#FF4D00',
    color_to:    parsed.data.color_to   ?? '#7C3AED',
    target_plan: targetPlans,
    starts_at:   parsed.data.starts_at ? new Date(parsed.data.starts_at).toISOString() : null,
    ends_at:     parsed.data.ends_at    ? new Date(parsed.data.ends_at).toISOString()   : null,
    is_active:   isActive,
    created_by:  session.userId,
  })

  await auditLog({
    adminId:    session.userId,
    adminRole:  session.role,
    action:     'banner.create',
    targetType: 'banner',
    payload:    { title: parsed.data.title, active: isActive },
  })

  return NextResponse.redirect(new URL('/admin/operacoes/banners', request.url))
}
