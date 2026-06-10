import { createClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'
import { CronTriggerButton } from './cron-trigger-button'

export const dynamic = 'force-dynamic'

interface CronDef {
  path:        string
  schedule:    string
  label:       string
  description: string
  time:        string
  frequency:   'daily' | 'weekly'
  category:    string
}

const CRONS: CronDef[] = [
  {
    path:        '/api/cron/streaks',
    schedule:    '0 3 * * *',
    label:       'Atualizar Streaks',
    description: 'Reseta streaks de usuários que não completaram hábitos no dia anterior',
    time:        '03:00 UTC (00:00 Brasília)',
    frequency:   'daily',
    category:    'Gamificação',
  },
  {
    path:        '/api/cron/streak-alerts',
    schedule:    '0 23 * * *',
    label:       'Alertas de Streak em Risco',
    description: 'Notifica usuários com streak em risco de quebrar antes da meia-noite',
    time:        '23:00 UTC (20:00 Brasília)',
    frequency:   'daily',
    category:    'Gamificação',
  },
  {
    path:        '/api/cron/perfect-day-reminder',
    schedule:    '30 1 * * *',
    label:       'Lembrete de Dia Perfeito',
    description: 'Lembra usuários que ainda não completaram todos os hábitos do dia',
    time:        '01:30 UTC (22:30 Brasília)',
    frequency:   'daily',
    category:    'Gamificação',
  },
  {
    path:        '/api/cron/league-reset',
    schedule:    '30 3 * * 1',
    label:       'Reset de Ligas',
    description: 'Fecha a liga da semana e aplica promoções/rebaixamentos',
    time:        'Segundas 03:30 UTC (00:30 Brasília)',
    frequency:   'weekly',
    category:    'Gamificação',
  },
  {
    path:        '/api/cron/weekly-challenges',
    schedule:    '0 7 * * 1',
    label:       'Desafios Semanais',
    description: 'Gera novos desafios semanais para os usuários ativos',
    time:        'Segundas 07:00 UTC (04:00 Brasília)',
    frequency:   'weekly',
    category:    'Gamificação',
  },
  {
    path:        '/api/cron/notifications',
    schedule:    '0 8 * * *',
    label:       'Fila de Notificações',
    description: 'Processa a fila de notificações agendadas e envia push',
    time:        '08:00 UTC (05:00 Brasília)',
    frequency:   'daily',
    category:    'Notificações',
  },
  {
    path:        '/api/cron/habit-reminders',
    schedule:    '0 12 * * *',
    label:       'Lembretes de Hábito',
    description: 'Envia push para usuários com reminder_time próximo do horário',
    time:        '12:00 UTC (09:00 Brasília)',
    frequency:   'daily',
    category:    'Notificações',
  },
  {
    path:        '/api/cron/goal-reminders',
    schedule:    '0 9 * * *',
    label:       'Lembretes de Metas',
    description: 'Notifica sobre metas com prazo se aproximando',
    time:        '09:00 UTC (06:00 Brasília)',
    frequency:   'daily',
    category:    'Notificações',
  },
  {
    path:        '/api/cron/trial-emails',
    schedule:    '0 10 * * *',
    label:       'Emails de Trial',
    description: 'Envia sequência de onboarding e alertas de expiração de trial',
    time:        '10:00 UTC (07:00 Brasília)',
    frequency:   'daily',
    category:    'Email',
  },
  {
    path:        '/api/cron/weekly-digest',
    schedule:    '0 9 * * 1',
    label:       'Digest Semanal',
    description: 'Email com resumo de XP, hábitos e conquistas da semana',
    time:        'Segundas 09:00 UTC (06:00 Brasília)',
    frequency:   'weekly',
    category:    'Email',
  },
  {
    path:        '/api/cron/memories',
    schedule:    '0 14 * * *',
    label:       'Memórias ("1 ano atrás")',
    description: 'Gera notificações de memórias de atividades de anos anteriores',
    time:        '14:00 UTC (11:00 Brasília)',
    frequency:   'daily',
    category:    'Engajamento',
  },
  {
    path:        '/api/cron/daily-recap',
    schedule:    '0 0 * * *',
    label:       'Recap Diário',
    description: 'Envia resumo das atividades do dia anterior para usuários engajados',
    time:        '00:00 UTC (21:00 Brasília)',
    frequency:   'daily',
    category:    'Engajamento',
  },
  {
    path:        '/api/cron/calendar-sync',
    schedule:    '0 6 * * *',
    label:       'Sincronização de Calendário',
    description: 'Importa eventos do Google Calendar para usuários com integração ativa',
    time:        '06:00 UTC (03:00 Brasília)',
    frequency:   'daily',
    category:    'Integrações',
  },
  {
    path:        '/api/cron/metrics-snapshot',
    schedule:    '0 1 * * *',
    label:       'Snapshot de Métricas',
    description: 'Captura snapshot diário de DAU/MAU/MRR para o painel de analytics',
    time:        '01:00 UTC (22:00 Brasília)',
    frequency:   'daily',
    category:    'Analytics',
  },
]

export default async function CronsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin')

  const isSuperAdmin = session.role === 'super_admin'
  const categories = [...new Set(CRONS.map(c => c.category))]

  const dailyCount  = CRONS.filter(c => c.frequency === 'daily').length
  const weeklyCount = CRONS.filter(c => c.frequency === 'weekly').length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
          <Clock size={20} style={{ color: '#F5C842' }} /> Cron Jobs
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          {CRONS.length} automações — {dailyCount} diárias, {weeklyCount} semanais
        </p>
      </div>

      {/* Aviso se CRON_SECRET não está configurado */}
      {!process.env.CRON_SECRET && (
        <div
          className="rounded-xl p-3 flex items-start gap-3"
          style={{ background: 'rgba(255,77,0,0.06)', border: '1px solid rgba(255,77,0,0.2)' }}
        >
          <span className="text-base">⚠️</span>
          <div>
            <div className="text-sm font-semibold" style={{ color: '#FF4D00' }}>CRON_SECRET não configurado</div>
            <div className="text-xs mt-0.5" style={{ color: '#8899BB' }}>
              Adicione a variável CRON_SECRET no Vercel para autenticar os cron jobs. Sem ela, os crons podem ser executados por qualquer pessoa.
            </div>
          </div>
        </div>
      )}

      {categories.map(category => {
        const catCrons = CRONS.filter(c => c.category === category)
        return (
          <div key={category}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8899BB' }}>
              {category} ({catCrons.length})
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {catCrons.map((cron, i) => (
                <div
                  key={cron.path}
                  className="px-4 py-3.5 flex items-center gap-4"
                  style={{
                    borderBottom: i < catCrons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  {/* Status indicator */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cron.frequency === 'weekly' ? '#7C3AED' : '#00FF88' }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: '#fff' }}>{cron.label}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: cron.frequency === 'weekly' ? 'rgba(124,58,237,0.12)' : 'rgba(0,255,136,0.08)',
                          color:      cron.frequency === 'weekly' ? '#7C3AED' : '#00FF88',
                        }}
                      >
                        {cron.frequency === 'weekly' ? '7d' : '24h'}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#8899BB' }}>{cron.description}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={10} style={{ color: '#5A6B85' }} />
                      <code className="text-[10px]" style={{ color: '#5A6B85' }}>{cron.time}</code>
                      <span className="text-[10px]" style={{ color: '#3A4B65' }}>|</span>
                      <code className="text-[10px]" style={{ color: '#3A4B65' }}>{cron.schedule}</code>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <CronTriggerButton path={cron.path} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <p className="text-xs text-center" style={{ color: '#3A4B65' }}>
        Crons executados pelo Vercel Scheduler via vercel.json • Autenticados via Authorization: Bearer {'{'}CRON_SECRET{'}'}
      </p>
    </div>
  )
}
