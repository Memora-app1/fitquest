import { createClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Server, Activity, Clock, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export default async function SistemaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin')

  const cards = [
    {
      label:       'Saúde do Sistema',
      href:        '/admin/sistema/saude',
      icon:        <Activity size={20} />,
      color:       '#00FF88',
      description: 'Conectividade com Supabase, Anthropic, Resend e Mercado Pago. Status de variáveis de ambiente.',
      stat:        'Verificar agora →',
    },
    {
      label:       'Cron Jobs',
      href:        '/admin/sistema/crons',
      icon:        <Clock size={20} />,
      color:       '#F5C842',
      description: '14 automações agendadas. Streaks, notificações, emails, métricas diárias e mais.',
      stat:        '14 crons configurados',
    },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
          <Server size={22} style={{ color: '#FF4D00' }} /> Sistema
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          Monitoramento de infraestrutura, integrações e automações agendadas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl p-5 flex flex-col gap-4 transition-all hover:scale-[1.01]"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `rgba(${hexToRgb(card.color)},0.1)`,
                border:     `1px solid rgba(${hexToRgb(card.color)},0.2)`,
                color:      card.color,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: '#fff' }}>{card.label}</div>
              <div className="text-xs mb-3" style={{ color: '#8899BB' }}>{card.description}</div>
              <div className="flex items-center gap-1">
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: `rgba(${hexToRgb(card.color)},0.1)`, color: card.color }}
                >
                  {card.stat} <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info box */}
      <div
        className="rounded-xl p-4 text-xs space-y-1"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="font-semibold mb-2" style={{ color: '#8899BB' }}>Informações do Ambiente</div>
        <div className="flex justify-between">
          <span style={{ color: '#5A6B85' }}>APP_URL</span>
          <span style={{ color: '#fff' }}>{process.env.NEXT_PUBLIC_APP_URL ?? 'localhost:3000'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#5A6B85' }}>NODE_ENV</span>
          <span style={{ color: '#fff' }}>{process.env.NODE_ENV}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#5A6B85' }}>VERCEL_ENV</span>
          <span style={{ color: '#fff' }}>{process.env.VERCEL_ENV ?? 'local'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#5A6B85' }}>VERCEL_REGION</span>
          <span style={{ color: '#fff' }}>{process.env.VERCEL_REGION ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
