import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole, ROLE_COLORS, ROLE_LABELS } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Shield, Search } from 'lucide-react'
import type { AdminRole } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const ACTION_ICONS: Record<string, string> = {
  'user.xp_grant':      '⚡',
  'user.suspend':       '🚫',
  'user.unsuspend':     '✅',
  'user.reset_streak':  '🔄',
  'user.note_added':    '📝',
  'feature_flag.toggle':'🔀',
  'feature_flag.create':'🆕',
  'broadcast.send':     '📣',
  'broadcast.create_draft': '📋',
  'banner.create':      '🖼️',
  'banner.toggle':      '🔀',
  'season.create':      '🏆',
  'xp.manual_grant':    '⚡',
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin')

  const params  = await searchParams
  const action  = params.action ?? ''
  const page    = parseInt(params.page ?? '1', 10)
  const limit   = 30
  const offset  = (page - 1) * limit

  const db = createServiceClient()

  let query = db
    .from('audit_logs')
    .select('id, admin_id, admin_role, action, target_type, target_id, payload, ip_address, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) query = query.eq('action', action)

  const { data: logs, count } = await query
  const totalPages = Math.ceil((count ?? 0) / limit)

  // Pega os nomes dos admins envolvidos
  const adminIds = [...new Set((logs ?? []).map(l => l.admin_id).filter(Boolean))]
  const adminNames: Record<string, string> = {}
  if (adminIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, name')
      .in('id', adminIds)
    for (const p of (profiles ?? [])) {
      adminNames[p.id] = p.name
    }
  }

  // Ações únicas para o filtro
  const { data: distinctActions } = await db
    .from('audit_logs')
    .select('action')
    .limit(100)
  const uniqueActions = [...new Set((distinctActions ?? []).map(a => a.action))].sort()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
            <Shield size={20} style={{ color: '#FF4D00' }} /> Audit Log
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
            {(count ?? 0).toLocaleString('pt-BR')} ações registradas
          </p>
        </div>
        <form method="GET" className="flex gap-2">
          <select
            name="action"
            defaultValue={action}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          >
            <option value="">Todas as ações</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#FF4D00', color: '#fff' }}
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Log entries */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Quando', 'Admin', 'Ação', 'Alvo', 'IP'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider" style={{ color: '#8899BB' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log, i) => {
              const roleColor = ROLE_COLORS[log.admin_role as AdminRole] ?? '#8899BB'
              const roleLabel = ROLE_LABELS[log.admin_role as AdminRole] ?? log.admin_role
              const icon = ACTION_ICONS[log.action] ?? '•'
              const adminName = log.admin_id ? (adminNames[log.admin_id] ?? log.admin_id.slice(0, 8)) : '—'

              return (
                <tr
                  key={log.id}
                  style={{ borderBottom: i < (logs?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#8899BB' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div style={{ color: '#fff' }}>{adminName}</div>
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: `rgba(${hexToRgb(roleColor)},0.1)`, color: roleColor }}
                    >
                      {roleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span>{icon}</span>
                      <code
                        className="font-mono"
                        style={{ color: '#fff' }}
                      >
                        {log.action}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#8899BB' }}>
                    {log.target_type && (
                      <div>
                        <span style={{ color: '#8899BB' }}>{log.target_type}: </span>
                        <span style={{ color: '#fff' }}>{log.target_id?.slice(0, 12) ?? '—'}…</span>
                      </div>
                    )}
                    {log.payload && (
                      <details className="mt-1">
                        <summary className="cursor-pointer" style={{ color: '#8899BB' }}>payload</summary>
                        <pre className="text-[10px] mt-1 max-w-xs overflow-auto" style={{ color: '#8899BB' }}>
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#8899BB' }}>
                    {log.ip_address ?? '—'}
                  </td>
                </tr>
              )
            })}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: '#8899BB' }}>
                  Nenhum log encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`/admin/seguranca/audit-log?action=${action}&page=${p}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold"
              style={{
                background: p === page ? '#FF4D00' : 'rgba(255,255,255,0.05)',
                color:      p === page ? '#fff'    : '#8899BB',
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
