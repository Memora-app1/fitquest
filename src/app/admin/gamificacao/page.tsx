import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Gamepad2, Zap, Calendar, Trophy, Shield } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GamificacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin')

  const db = createServiceClient()

  const [xpToday, activeSeason, achievementCount, guildCount] = await Promise.all([
    db.from('xp_transactions')
      .select('amount')
      .gte('created_at', new Date().toISOString().split('T')[0])
      .limit(1000),
    db.from('seasons')
      .select('id, name, theme_emoji, end_date')
      .eq('status', 'active')
      .maybeSingle(),
    db.from('achievements')
      .select('id', { count: 'exact', head: true }),
    db.from('guilds')
      .select('id', { count: 'exact', head: true }),
  ])

  const xpTodayTotal = (xpToday.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)

  const cards = [
    {
      label:       'Concessão de XP',
      href:        '/admin/gamificacao/xp',
      icon:        '⚡',
      color:       '#F5C842',
      description: 'Conceder ou remover XP manualmente. Toda ação é auditada.',
      stat:        xpTodayTotal.toLocaleString('pt-BR') + ' XP hoje',
    },
    {
      label:       'Temporadas',
      href:        '/admin/gamificacao/temporadas',
      icon:        '🏆',
      color:       '#7C3AED',
      description: 'Gerenciar temporadas competitivas, criar novas, ver ranking.',
      stat:        activeSeason.data ? `${activeSeason.data.theme_emoji} ${activeSeason.data.name}` : 'Nenhuma ativa',
    },
    {
      label:       'Conquistas',
      href:        '/admin/gamificacao/conquistas',
      icon:        '🎖️',
      color:       '#00FF88',
      description: 'Visualizar catálogo, taxas de desbloqueio e raridade.',
      stat:        (achievementCount.count ?? 0) + ' conquistas',
    },
    {
      label:       'Guilds',
      href:        '/admin/gamificacao/guilds',
      icon:        '⚔️',
      color:       '#FF4D00',
      description: 'Ver guilds ativas, membros, XP semanal e moderação.',
      stat:        (guildCount.count ?? 0) + ' guilds',
    },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
          <Gamepad2 size={22} style={{ color: '#7C3AED' }} /> Gamificação
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          XP, temporadas, conquistas e guilds — controle total do sistema de recompensas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border:     `1px solid rgba(255,255,255,0.06)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `rgba(${hexToRgb(card.color)},0.1)`, border: `1px solid rgba(${hexToRgb(card.color)},0.2)` }}
              >
                {card.icon}
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `rgba(${hexToRgb(card.color)},0.1)`, color: card.color }}>
                {card.stat}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: '#fff' }}>{card.label}</div>
              <div className="text-xs" style={{ color: '#8899BB' }}>{card.description}</div>
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
