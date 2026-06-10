import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Bell, Send, Clock, CheckCircle, XCircle, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  draft:      '#8899BB',
  scheduled:  '#F5C842',
  sending:    '#3B82F6',
  sent:       '#00FF88',
  failed:     '#FF4D00',
}
const STATUS_LABELS: Record<string, string> = {
  draft:     'Rascunho',
  scheduled: 'Agendado',
  sending:   'Enviando',
  sent:      'Enviado',
  failed:    'Falhou',
}
const SEGMENT_LABELS: Record<string, string> = {
  all:          'Todos os usuários',
  trial:        'Em trial',
  active:       'Pagantes ativos',
  lifetime:     'Lifetime',
  streak_active:'Com streak ativo',
  at_risk:      'Em risco de churn',
}

export default async function BroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin')

  const db = createServiceClient()
  const { data: campaigns } = await db
    .from('broadcast_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-black" style={{ color: '#fff' }}>Broadcast de Notificações</h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          Envie push notifications para segmentos específicos de usuários.
        </p>
      </div>

      {/* Formulário nova campanha */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#fff' }}>
          <Bell size={14} style={{ color: '#FF4D00' }} /> Nova Campanha
        </h2>
        <form action="/api/admin/broadcasts" method="POST" className="space-y-3">
          <input
            name="title"
            placeholder="Título interno da campanha (ex: Trial expirando - Jun 2026)"
            required
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
          <div className="grid md:grid-cols-2 gap-3">
            <input
              name="push_title"
              placeholder="Título da notificação push"
              required
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
            <select
              name="target_segment"
              required
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            >
              {Object.entries(SEGMENT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <textarea
            name="push_body"
            placeholder="Corpo da notificação (max 200 caracteres)"
            required
            maxLength={200}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
          <div className="grid md:grid-cols-2 gap-3">
            <input
              name="push_url"
              placeholder="URL de ação (ex: /dashboard)"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
            <input
              name="scheduled_for"
              type="datetime-local"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              name="action"
              value="save_draft"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8899BB', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Salvar rascunho
            </button>
            <button
              type="submit"
              name="action"
              value="send_now"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#FF4D00', color: '#fff' }}
            >
              <Send size={13} /> Enviar agora
            </button>
          </div>
        </form>
      </div>

      {/* Lista de campanhas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold" style={{ color: '#fff' }}>Campanhas Recentes</h2>
        {(campaigns ?? []).length === 0 && (
          <p className="text-sm" style={{ color: '#8899BB' }}>Nenhuma campanha criada ainda.</p>
        )}
        {(campaigns ?? []).map(c => {
          const color = STATUS_COLORS[c.status] ?? '#8899BB'
          return (
            <div
              key={c.id}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: '#fff' }}>{c.title}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                      style={{ background: `rgba(${hexToRgb(color)},0.12)`, color }}
                    >
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                    <span className="text-[11px]" style={{ color: '#8899BB' }}>
                      {SEGMENT_LABELS[c.target_segment] ?? c.target_segment}
                    </span>
                  </div>
                  <p className="text-xs mt-1 truncate" style={{ color: '#8899BB' }}>{c.push_body}</p>
                </div>
                <div className="text-right text-xs shrink-0">
                  {c.status === 'sent' && (
                    <div className="flex items-center gap-1" style={{ color: '#00FF88' }}>
                      <CheckCircle size={12} />
                      {c.sent_count?.toLocaleString('pt-BR')} enviados
                    </div>
                  )}
                  {c.status === 'failed' && (
                    <div className="flex items-center gap-1" style={{ color: '#FF4D00' }}>
                      <XCircle size={12} />
                      {c.failed_count} falharam
                    </div>
                  )}
                  {c.scheduled_for && (
                    <div className="flex items-center gap-1 mt-1" style={{ color: '#8899BB' }}>
                      <Clock size={11} />
                      {new Date(c.scheduled_for).toLocaleString('pt-BR')}
                    </div>
                  )}
                  <div className="mt-1" style={{ color: '#8899BB' }}>
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
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
