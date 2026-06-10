/**
 * Utilitários para verificação e registro de ações administrativas.
 * Todas as funções usam service role — nunca expor no client.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'analyst'

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 5,
  admin:       4,
  moderator:   3,
  support:     2,
  analyst:     1,
}

export interface AdminSession {
  userId: string
  email: string
  role: AdminRole
}

/**
 * Verifica se o usuário autenticado tem papel administrativo.
 * Retorna null se não for admin.
 */
export async function getAdminSession(
  supabaseUser: { id: string; email?: string } | null
): Promise<AdminSession | null> {
  if (!supabaseUser) return null

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[admin] SUPABASE_SERVICE_ROLE_KEY não configurada — admin panel indisponível')
    return null
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('admin_roles')
    .select('role')
    .eq('user_id', supabaseUser.id)
    .maybeSingle()

  if (error) {
    console.error('[admin] Erro ao consultar admin_roles:', error.message, '| user_id:', supabaseUser.id)
    return null
  }

  if (!data) {
    console.warn('[admin] Usuário sem role admin:', supabaseUser.email, '| user_id:', supabaseUser.id)
    return null
  }

  return {
    userId: supabaseUser.id,
    email:  supabaseUser.email ?? '',
    role:   data.role as AdminRole,
  }
}

/**
 * Verifica se o papel tem permissão mínima.
 */
export function hasMinRole(session: AdminSession, minRole: AdminRole): boolean {
  return ROLE_HIERARCHY[session.role] >= ROLE_HIERARCHY[minRole]
}

/**
 * Registra uma ação administrativa no audit_log.
 */
export async function auditLog(params: {
  adminId:    string
  adminRole:  AdminRole
  action:     string
  targetType?: string
  targetId?:   string
  payload?:    Record<string, unknown>
}) {
  const db = createServiceClient()
  const hdrs = await headers()

  await db.from('audit_logs').insert({
    admin_id:    params.adminId,
    admin_role:  params.adminRole,
    action:      params.action,
    target_type: params.targetType ?? null,
    target_id:   params.targetId   ?? null,
    payload:     params.payload    ?? null,
    ip_address:  hdrs.get('x-forwarded-for')?.split(',')[0] ?? null,
    user_agent:  hdrs.get('user-agent') ?? null,
  })
}

/**
 * Formata role para exibição.
 */
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  moderator:   'Moderador',
  support:     'Suporte',
  analyst:     'Analista',
}

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: '#FF4D00',
  admin:       '#7C3AED',
  moderator:   '#00FF88',
  support:     '#3B82F6',
  analyst:     '#F5C842',
}
