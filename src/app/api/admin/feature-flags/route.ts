import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin'
import { z } from 'zod'

const CreateSchema = z.object({
  slug:        z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
  name:        z.string().min(1).max(100),
  description: z.string().max(300).optional(),
})

const PatchSchema = z.object({
  id:          z.string().uuid(),
  enabled:     z.boolean(),
  rollout_pct: z.number().int().min(0).max(100).nullable().optional(),
  segment:     z.string().max(50).nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const form = await request.formData()
  const parsed = CreateSchema.safeParse({
    slug:        form.get('slug'),
    name:        form.get('name'),
    description: form.get('description') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.redirect(new URL('/admin/operacoes/feature-flags?error=invalid', request.url))
  }

  const db = createServiceClient()
  await db.from('feature_flags').insert({
    ...parsed.data,
    enabled:    false,
    created_by: session.userId,
    updated_by: session.userId,
  })

  await auditLog({
    adminId:    session.userId,
    adminRole:  session.role,
    action:     'feature_flag.create',
    targetType: 'feature_flag',
    targetId:   parsed.data.slug,
    payload:    parsed.data,
  })

  return NextResponse.redirect(new URL('/admin/operacoes/feature-flags', request.url))
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })

  const db = createServiceClient()
  await db.from('feature_flags').update({
    enabled:     parsed.data.enabled,
    rollout_pct: parsed.data.rollout_pct ?? null,
    segment:     parsed.data.segment     ?? null,
    updated_by:  session.userId,
    updated_at:  new Date().toISOString(),
  }).eq('id', parsed.data.id)

  await auditLog({
    adminId:    session.userId,
    adminRole:  session.role,
    action:     'feature_flag.toggle',
    targetType: 'feature_flag',
    targetId:   parsed.data.id,
    payload:    { enabled: parsed.data.enabled },
  })

  return NextResponse.json({ ok: true })
}
