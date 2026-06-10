import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Activity, Dumbbell, CheckSquare, Flame, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EngajamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin')

  const db = createServiceClient()

  const last30     = new Date(Date.now() - 30 * 86400000)
  const last30date = last30.toISOString().split('T')[0]!
  const last30iso  = last30.toISOString()

  const [habitsRes, workoutsRes, tasksRes, xpSourcesRes, snapshotsRes, topHabitsRes, levelDist] = await Promise.all([
    // Hábitos logados nos últimos 30d
    db.from('habit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('logged_date', last30date),
    // Treinos nos últimos 30d
    db.from('workouts')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', last30iso),
    // Tarefas completadas nos últimos 30d
    db.from('tasks')
      .select('id', { count: 'exact', head: true })
      .gte('completed_at', last30iso),
    // XP por fonte (últimos 30d)
    db.from('xp_transactions')
      .select('source_type, amount')
      .gte('created_at', last30iso)
      .limit(5000),
    // Snapshots para trend line
    db.from('metrics_daily')
      .select('date, habits_logged, workouts_done, tasks_completed, xp_granted')
      .gte('date', last30date)
      .order('date', { ascending: true }),
    // Top 10 hábitos
    db.from('habit_logs')
      .select('habit_id, habits(name, icon, category)')
      .gte('logged_date', last30date)
      .limit(2000),
    // Distribuição de levels
    db.from('profiles')
      .select('level')
      .in('subscription_status', ['trial', 'active', 'lifetime'])
      .limit(5000),
  ])

  const habitsCount   = habitsRes.count ?? 0
  const workoutsCount = workoutsRes.count ?? 0
  const tasksCount    = tasksRes.count ?? 0

  // XP por fonte
  const xpBySource: Record<string, number> = {}
  let totalXp = 0
  for (const tx of (xpSourcesRes.data ?? [])) {
    const k = tx.source_type ?? 'other'
    xpBySource[k] = (xpBySource[k] ?? 0) + (tx.amount ?? 0)
    totalXp += tx.amount ?? 0
  }
  const xpSourceEntries = Object.entries(xpBySource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
  const maxXpSource = xpSourceEntries[0]?.[1] ?? 1

  // Top hábitos
  const habitCounts: Record<string, { name: string; icon: string; count: number }> = {}
  for (const log of (topHabitsRes.data ?? [])) {
    if (!log.habit_id) continue
    const h = Array.isArray(log.habits) ? log.habits[0] as { name: string; icon: string; category: string } | undefined : log.habits as { name: string; icon: string; category: string } | null
    if (!h) continue
    if (!habitCounts[log.habit_id]) habitCounts[log.habit_id] = { name: h.name, icon: h.icon, count: 0 }
    habitCounts[log.habit_id]!.count++
  }
  const topHabits = Object.values(habitCounts).sort((a, b) => b.count - a.count).slice(0, 8)
  const maxHabitCount = topHabits[0]?.count ?? 1

  // Distribuição de levels
  const levelMap: Record<number, number> = {}
  for (const p of (levelDist.data ?? [])) {
    const l = p.level ?? 1
    levelMap[l] = (levelMap[l] ?? 0) + 1
  }
  const levelEntries = Array.from({ length: 8 }, (_, i) => [i + 1, levelMap[i + 1] ?? 0] as [number, number])
  const maxLevelCount = Math.max(...levelEntries.map(([, v]) => v), 1)

  const snapshots  = snapshotsRes.data ?? []
  const maxHabits  = Math.max(...snapshots.map(s => s.habits_logged ?? 0), 1)

  const xpSourceLabels: Record<string, string> = {
    habit:       'Hábitos',
    workout:     'Treinos',
    task:        'Tarefas',
    achievement: 'Conquistas',
    streak:      'Streak',
    login:       'Login diário',
    admin_grant: 'Admin',
    other:       'Outros',
  }

  const xpSourceColors: Record<string, string> = {
    habit:       '#FF4D00',
    workout:     '#7C3AED',
    task:        '#3B82F6',
    achievement: '#F5C842',
    streak:      '#00FF88',
    login:       '#8899BB',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
          <Activity size={20} style={{ color: '#7C3AED' }} /> Engajamento
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          Hábitos, treinos, tarefas, XP por fonte e distribuição de levels — últimos 30 dias.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Hábitos logados',    value: habitsCount.toLocaleString('pt-BR'),   icon: <Flame size={14} />,       color: '#FF4D00' },
          { label: 'Treinos realizados', value: workoutsCount.toLocaleString('pt-BR'), icon: <Dumbbell size={14} />,    color: '#7C3AED' },
          { label: 'Tarefas concluídas', value: tasksCount.toLocaleString('pt-BR'),    icon: <CheckSquare size={14} />, color: '#3B82F6' },
          { label: 'XP gerado total',    value: totalXp.toLocaleString('pt-BR'),       icon: <Zap size={14} />,         color: '#F5C842' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#8899BB' }}>{k.label}</span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* Top hábitos */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#fff' }}>Top Hábitos (30d)</h2>
          {topHabits.length === 0 ? (
            <p className="text-xs" style={{ color: '#8899BB' }}>Sem dados.</p>
          ) : (
            <div className="space-y-2">
              {topHabits.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-center">{h.icon}</span>
                  <span className="w-28 truncate" style={{ color: '#fff' }}>{h.name}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(h.count / maxHabitCount) * 100}%`, background: '#FF4D00' }} />
                  </div>
                  <span className="w-12 text-right font-bold" style={{ color: '#FF4D00' }}>{h.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XP por fonte */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#fff' }}>XP por Fonte (30d)</h2>
          {xpSourceEntries.length === 0 ? (
            <p className="text-xs" style={{ color: '#8899BB' }}>Sem dados.</p>
          ) : (
            <div className="space-y-2">
              {xpSourceEntries.map(([source, xp]) => {
                const color = xpSourceColors[source] ?? '#8899BB'
                const pct   = (xp / totalXp * 100).toFixed(1)
                return (
                  <div key={source} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate" style={{ color: '#8899BB' }}>{xpSourceLabels[source] ?? source}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(xp / maxXpSource) * 100}%`, background: color }} />
                    </div>
                    <span className="w-8 text-right text-[10px]" style={{ color: '#8899BB' }}>{pct}%</span>
                    <span className="w-16 text-right font-bold" style={{ color }}>{xp.toLocaleString('pt-BR')}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Distribuição de levels */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: '#fff' }}>Distribuição de Levels</h2>
        <div className="flex items-end gap-2">
          {levelEntries.map(([level, count]) => {
            const h      = Math.max(4, Math.round((count / maxLevelCount) * 96))
            const colors = ['#8899BB','#3B82F6','#7C3AED','#F5C842','#FF4D00','#00FF88','#FF4D00','#F5C842']
            const color  = colors[level - 1] ?? '#8899BB'
            const titles = ['Iniciante','Dedicado','Consistente','Atleta','Guerreiro','Elite','Lendário','Ascendia Master']
            return (
              <div key={level} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full rounded-t group-hover:opacity-90" style={{ height: `${h}px`, background: color }} />
                <span className="text-[10px] font-bold" style={{ color }}>{level}</span>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-1.5 py-1 rounded hidden group-hover:block whitespace-nowrap z-10 text-center">
                  <div style={{ color }}>{titles[level - 1]}</div>
                  <div>{count.toLocaleString('pt-BR')} usuários</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-1 text-[10px]" style={{ color: '#8899BB' }}>
          <span>Nv 1 — Iniciante</span>
          <span>Nv 8 — Ascendia Master</span>
        </div>
      </div>

      {/* Trend de hábitos (se tiver snapshots) */}
      {snapshots.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#fff' }}>Tendência de Hábitos (30d)</h2>
          <div className="flex items-end gap-1 h-24">
            {snapshots.map((s, i) => {
              const h = Math.max(2, Math.round(((s.habits_logged ?? 0) / maxHabits) * 96))
              const isLast = i === snapshots.length - 1
              return (
                <div key={s.date} className="flex-1 group relative flex flex-col justify-end">
                  <div
                    className="w-full rounded-t-sm"
                    style={{ height: `${h}px`, background: isLast ? '#FF4D00' : 'rgba(255,77,0,0.35)' }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded hidden group-hover:block whitespace-nowrap z-10">
                    {s.habits_logged} hábitos
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
