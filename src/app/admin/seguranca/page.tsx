import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SegurancaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'support')) redirect('/admin')

  const db = createServiceClient()

  const [auditTodayRes, pendingReportsRes, activeSuspensionsRes] = await Promise.all([
    db.from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
    db.from('user_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    db.from('user_suspensions')
      .select('id', { count: 'exact', head: true })
      .is('lifted_at', null),
  ])

  const cards = [
    {
      label:       'Audit Log',
      href:        '/admin/seguranca/audit-log',
      icon:        '📋',
      color:       '#8899BB',
      description: 'Registro imutável de todas as ações administrativas.',
      stat:        (auditTodayRes.count ?? 0) + ' ações hoje',
      urgent:      false,
    },
    {
      label:       'Denúncias',
      href:        '/admin/seguranca/denuncias',
      icon:        '🚨',
      color:       '#FF4D00',
      description: 'Revisar e moderar denúncias de usuários.',
      stat:        (pendingReportsRes.count ?? 0) + ' pendentes',
      urgent:      (pendingReportsRes.count ?? 0) > 0,
    },
    {
      label:       'Suspensões',
      href:        '/admin/seguranca/suspensoes',
      icon:        '🔒',
      color:       '#F5C842',
      description: 'Gerenciar contas suspensas e levantar suspensões.',
      stat:        (activeSuspensionsRes.count ?? 0) + ' ativas',
      urgent:      false,
    },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
          <ShieldAlert size={22} style={{ color: '#FF4D00' }} /> Segurança
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          Auditoria, moderação de conteúdo e controle de acesso.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
            style={{
              background: card.urgent ? 'rgba(255,77,0,0.06)' : 'rgba(255,255,255,0.025)',
              border:     card.urgent ? '1px solid rgba(255,77,0,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `rgba(${hexToRgb(card.color)},0.1)`, border: `1px solid rgba(${hexToRgb(card.color)},0.2)` }}
              >
                {card.icon}
              </div>
              {card.urgent && (
                <span className="text-[10px] font-black px-2 py-1 rounded-full animate-pulse" style={{ background: 'rgba(255,77,0,0.15)', color: '#FF4D00' }}>
                  ATENÇÃO
                </span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: '#fff' }}>{card.label}</div>
              <div className="text-xs mb-3" style={{ color: '#8899BB' }}>{card.description}</div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `rgba(${hexToRgb(card.color)},0.1)`, color: card.color }}>
                {card.stat}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
