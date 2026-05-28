import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, Flame, Target, Wallet, ArrowRight } from 'lucide-react'

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export async function MorningBrief({ userId }: { userId: string }) {
  const supabase = await createClient()
  const today = todayString()
  const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]!

  const [habitsRes, habitLogsRes, tasksRes, billsRes, profileRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, icon, color')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('logged_date', today),
    supabase
      .from('tasks')
      .select('id, title, urgent, important, due_date')
      .eq('user_id', userId)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'archived')
      .lte('due_date', today)
      .order('urgent', { ascending: false })
      .limit(3),
    supabase
      .from('transactions')
      .select('id, description, amount, transaction_date')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .gte('transaction_date', today)
      .lte('transaction_date', threeDaysOut)
      .order('transaction_date')
      .limit(3),
    supabase
      .from('profiles')
      .select('streak_current, xp_total, level')
      .eq('id', userId)
      .single(),
  ])

  const habits = habitsRes.data ?? []
  const loggedSet = new Set((habitLogsRes.data ?? []).map(l => l.habit_id))
  const pendingHabits = habits.filter(h => !loggedSet.has(h.id))
  const overdueTaskCount = (tasksRes.data ?? []).length
  const urgentBills = billsRes.data ?? []
  const streak = profileRes.data?.streak_current ?? 0
  const level = profileRes.data?.level ?? 1

  const totalHabits = habits.length
  const doneHabits = totalHabits - pendingHabits.length
  const habitsComplete = totalHabits > 0 && doneHabits === totalHabits

  // Nothing to show = great day already in progress
  if (totalHabits === 0 && overdueTaskCount === 0 && urgentBills.length === 0) return null

  const billsTotal = urgentBills.reduce((s, b) => s + Number(b.amount), 0)

  // Compute priority score for alert color
  const alertLevel =
    overdueTaskCount >= 3 || urgentBills.some(b => b.transaction_date <= today)
      ? 'danger'
      : overdueTaskCount > 0 || urgentBills.length > 0
      ? 'warning'
      : habitsComplete
      ? 'success'
      : 'info'

  const borderColor =
    alertLevel === 'danger'  ? 'rgba(239,68,68,0.35)'
    : alertLevel === 'warning' ? 'rgba(245,200,66,0.3)'
    : alertLevel === 'success' ? 'rgba(0,255,136,0.3)'
    : 'rgba(124,58,237,0.25)'

  const bgColor =
    alertLevel === 'danger'  ? 'rgba(239,68,68,0.05)'
    : alertLevel === 'warning' ? 'rgba(245,200,66,0.05)'
    : alertLevel === 'success' ? 'rgba(0,255,136,0.05)'
    : 'rgba(124,58,237,0.05)'

  const titleEmoji =
    alertLevel === 'success' ? '⭐'
    : alertLevel === 'danger' ? '🚨'
    : alertLevel === 'warning' ? '⚡'
    : '📋'

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-3xl"
        style={{ background: borderColor }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{titleEmoji}</span>
              <span className="text-sm font-black">Prioridades de hoje</span>
            </div>
            <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-2">
              {streak > 0 && (
                <span className="flex items-center gap-0.5 text-brand-orange">
                  <Flame size={9} fill="currentColor" />
                  {streak}d streak
                </span>
              )}
              <span>Nível {level}</span>
            </div>
          </div>
          {habitsComplete && (
            <div
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88' }}
            >
              <CheckCircle2 size={12} />
              Hábitos OK
            </div>
          )}
        </div>

        {/* Habits section */}
        {totalHabits > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Target size={12} className="text-brand-orange" />
                <span>Hábitos — {doneHabits}/{totalHabits}</span>
              </div>
              <Link
                href="/habitos"
                className="text-[10px] text-text-muted hover:text-brand-orange transition-colors flex items-center gap-0.5"
              >
                Ver <ArrowRight size={9} />
              </Link>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: totalHabits > 0 ? `${(doneHabits / totalHabits) * 100}%` : '0%',
                  background: habitsComplete
                    ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                    : 'linear-gradient(90deg, #FF4D00, #F59E0B)',
                }}
              />
            </div>

            {/* Pending habit chips (up to 4) */}
            {pendingHabits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pendingHabits.slice(0, 4).map(h => (
                  <Link
                    key={h.id}
                    href="/habitos"
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{
                      background: `${h.color}14`,
                      border: `1px solid ${h.color}30`,
                      color: h.color,
                    }}
                  >
                    <span>{h.icon}</span>
                    <span className="font-semibold truncate max-w-[80px]">{h.name}</span>
                  </Link>
                ))}
                {pendingHabits.length > 4 && (
                  <span className="text-[10px] text-text-muted self-center">
                    +{pendingHabits.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Overdue tasks */}
        {overdueTaskCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-red">
                <AlertTriangle size={12} />
                <span>{overdueTaskCount} tarefa{overdueTaskCount > 1 ? 's' : ''} vencida{overdueTaskCount > 1 ? 's' : ''}</span>
              </div>
              <Link
                href="/tarefas"
                className="text-[10px] text-text-muted hover:text-brand-red transition-colors flex items-center gap-0.5"
              >
                Ver <ArrowRight size={9} />
              </Link>
            </div>
            <div className="space-y-1.5">
              {(tasksRes.data ?? []).map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                  style={{
                    background: t.urgent && t.important ? 'rgba(239,68,68,0.08)' : 'rgba(245,200,66,0.06)',
                    border: t.urgent && t.important ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,200,66,0.15)',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: t.urgent && t.important ? '#EF4444' : '#F5C842' }}
                  />
                  <span className="text-xs truncate flex-1">{t.title}</span>
                  {t.urgent && t.important && (
                    <span className="text-[9px] text-brand-red font-bold shrink-0">URGENTE</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming bills */}
        {urgentBills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-gold">
                <Wallet size={12} />
                <span>{urgentBills.length} conta{urgentBills.length > 1 ? 's' : ''} próxima{urgentBills.length > 1 ? 's' : ''} · {formatBRL(billsTotal)}</span>
              </div>
              <Link
                href="/financas/transacoes"
                className="text-[10px] text-text-muted hover:text-brand-gold transition-colors flex items-center gap-0.5"
              >
                Ver <ArrowRight size={9} />
              </Link>
            </div>
            <div className="space-y-1">
              {urgentBills.map(b => {
                const daysUntil = Math.ceil(
                  (new Date(b.transaction_date).getTime() - Date.now()) / 86400000
                )
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                    style={{
                      background: daysUntil <= 0 ? 'rgba(239,68,68,0.07)' : 'rgba(245,200,66,0.06)',
                      border: daysUntil <= 0 ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(245,200,66,0.14)',
                    }}
                  >
                    <span className="text-xs truncate flex-1">{b.description}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-text-muted">
                        {daysUntil <= 0 ? 'Hoje' : `${daysUntil}d`}
                      </span>
                      <span className="text-xs font-bold text-brand-gold">
                        {formatBRL(Number(b.amount))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
