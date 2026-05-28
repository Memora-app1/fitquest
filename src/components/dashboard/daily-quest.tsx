/**
 * Missão do Dia — 3 missões personalizadas que resetam à meia-noite.
 * Cada missão reflete dados REAIS do usuário e mostra progresso em tempo real.
 * Garante que o usuário sempre tenha um objetivo imediato e alcançável.
 */

import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { Target, Droplets, Moon, Dumbbell, CheckSquare, Zap, Trophy } from 'lucide-react'

const WATER_GOAL_ML = 2000

interface Quest {
  id: string
  emoji: string
  label: string
  description: string
  xpReward: number
  current: number
  target: number
  completed: boolean
  color: string
  rgb: string
  href: string
}

export async function DailyQuest({ userId }: { userId: string }) {
  const supabase = await createClient()
  const today = todayString()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!
  const todayStart = `${today}T00:00:00`

  const [habitsRes, habitLogsRes, waterRes, sleepRes, tasksRes, workoutRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('logged_date', today),
    supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('date', today),
    supabase
      .from('sleep_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('date', yesterday)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('id, status, urgent, important')
      .eq('user_id', userId)
      .not('status', 'eq', 'archived')
      .order('urgent', { ascending: false })
      .limit(20),
    supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .gte('started_at', todayStart)
      .limit(1),
  ])

  const habits = habitsRes.data ?? []
  const loggedHabits = new Set((habitLogsRes.data ?? []).map(l => l.habit_id))
  const doneHabits = loggedHabits.size
  const totalHabits = habits.length

  const waterTotal = (waterRes.data ?? []).reduce((s, r) => s + (r.amount_ml as number), 0)
  const sleepLogged = sleepRes.data !== null
  const tasks = tasksRes.data ?? []
  const urgentTasks = tasks.filter(t => t.urgent && t.important && t.status !== 'done')
  const doneTasksToday = tasks.filter(t => t.status === 'done').length
  const hasTrained = (workoutRes.data ?? []).length > 0

  // ── Build candidate quests ─────────────────────────────────────────
  const candidates: Quest[] = []

  if (totalHabits > 0) {
    candidates.push({
      id: 'habits',
      emoji: '🎯',
      label: 'Hábitos do Dia',
      description: `Complete ${totalHabits === 1 ? 'o seu hábito' : `todos os ${totalHabits} hábitos`} hoje`,
      xpReward: totalHabits * 50,
      current: doneHabits,
      target: totalHabits,
      completed: doneHabits >= totalHabits,
      color: '#FF4D00',
      rgb: '255,77,0',
      href: '/habitos',
    })
  }

  candidates.push({
    id: 'water',
    emoji: '💧',
    label: 'Hidratação Plena',
    description: 'Beba 2L de água hoje',
    xpReward: 30,
    current: waterTotal,
    target: WATER_GOAL_ML,
    completed: waterTotal >= WATER_GOAL_ML,
    color: '#00D9FF',
    rgb: '0,217,255',
    href: '/saude',
  })

  if (!sleepLogged) {
    candidates.push({
      id: 'sleep',
      emoji: '🌙',
      label: 'Registrar Sono',
      description: 'Registre quanto dormiu ontem',
      xpReward: 20,
      current: 0,
      target: 1,
      completed: false,
      color: '#7C3AED',
      rgb: '124,58,237',
      href: '/saude',
    })
  } else {
    candidates.push({
      id: 'sleep',
      emoji: '🌙',
      label: 'Sono Registrado',
      description: 'Sono de ontem registrado!',
      xpReward: 20,
      current: 1,
      target: 1,
      completed: true,
      color: '#7C3AED',
      rgb: '124,58,237',
      href: '/saude',
    })
  }

  if (urgentTasks.length > 0) {
    candidates.push({
      id: 'task',
      emoji: '⚡',
      label: 'Tarefa Crítica',
      description: `Resolva uma tarefa urgente + importante`,
      xpReward: 50,
      current: Math.max(0, urgentTasks.length - (urgentTasks.length - Math.max(0, doneTasksToday))),
      target: 1,
      completed: doneTasksToday >= 1,
      color: '#EF4444',
      rgb: '239,68,68',
      href: '/tarefas',
    })
  } else {
    candidates.push({
      id: 'task',
      emoji: '✅',
      label: 'Produtividade',
      description: 'Complete uma tarefa hoje',
      xpReward: 30,
      current: Math.min(doneTasksToday, 1),
      target: 1,
      completed: doneTasksToday >= 1,
      color: '#7C3AED',
      rgb: '124,58,237',
      href: '/tarefas',
    })
  }

  candidates.push({
    id: 'workout',
    emoji: '🏋️',
    label: 'Treinar Hoje',
    description: 'Complete uma sessão de treino',
    xpReward: 100,
    current: hasTrained ? 1 : 0,
    target: 1,
    completed: hasTrained,
    color: '#00FF88',
    rgb: '0,255,136',
    href: '/treinos/novo',
  })

  // Sort: incomplete first, then completed. Always show 4.
  const quests = [
    ...candidates.filter(q => !q.completed),
    ...candidates.filter(q => q.completed),
  ].slice(0, 4)

  const completedCount = quests.filter(q => q.completed).length
  const totalXpAvailable = quests.reduce((s, q) => s + (q.completed ? 0 : q.xpReward), 0)
  const totalXpEarned = quests.filter(q => q.completed).reduce((s, q) => s + q.xpReward, 0)

  if (quests.length === 0) return null

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(245,200,66,0.06)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)' }}
              >
                <Trophy size={12} className="text-brand-gold" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Missões do Dia
              </span>
            </div>
            <h2 className="text-lg font-black">
              {completedCount === quests.length
                ? '🏆 Tudo concluído!'
                : `${completedCount}/${quests.length} missões`}
            </h2>
          </div>

          <div className="text-right">
            {totalXpEarned > 0 && (
              <div className="flex items-center gap-1 justify-end animate-counter">
                <Zap size={12} className="text-brand-gold" fill="currentColor" />
                <span className="text-sm font-black text-brand-gold">+{totalXpEarned} XP</span>
              </div>
            )}
            {totalXpAvailable > 0 && (
              <div className="text-[10px] text-text-muted">+{totalXpAvailable} disponíveis</div>
            )}
          </div>
        </div>

        {/* Progress bar geral */}
        <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-5">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${quests.length > 0 ? Math.round((completedCount / quests.length) * 100) : 0}%`,
              background: completedCount === quests.length
                ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                : 'linear-gradient(90deg, #F5C842, #FF4D00)',
            }}
          />
        </div>

        {/* Quest list */}
        <div className="space-y-2.5">
          {quests.map((quest) => {
            const pct = quest.target > 0 ? Math.min(100, Math.round((quest.current / quest.target) * 100)) : 0
            const displayCurrent = quest.id === 'water'
              ? quest.current >= 1000 ? `${(quest.current / 1000).toFixed(1)}L` : `${quest.current}ml`
              : quest.current
            const displayTarget = quest.id === 'water' ? '2L' : quest.target

            return (
              <a
                key={quest.id}
                href={quest.href}
                className="block rounded-xl p-3.5 transition-all hover:scale-[1.01] hover:bg-white/[0.03]"
                style={{
                  background: quest.completed
                    ? `rgba(${quest.rgb},0.06)`
                    : 'rgba(255,255,255,0.025)',
                  border: quest.completed
                    ? `1px solid rgba(${quest.rgb},0.2)`
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all"
                    style={{
                      background: quest.completed
                        ? `rgba(${quest.rgb},0.2)`
                        : 'rgba(255,255,255,0.05)',
                      boxShadow: quest.completed ? `0 0 12px rgba(${quest.rgb},0.25)` : 'none',
                    }}
                  >
                    {quest.completed ? '✅' : quest.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-sm font-bold leading-none"
                        style={{
                          color: quest.completed ? quest.color : '#FFFFFF',
                          textDecoration: quest.completed ? 'line-through' : 'none',
                          opacity: quest.completed ? 0.7 : 1,
                        }}
                      >
                        {quest.label}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] text-text-muted">
                          {displayCurrent}/{displayTarget}
                        </span>
                        <span
                          className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                          style={{
                            color: quest.color,
                            background: `rgba(${quest.rgb},0.15)`,
                          }}
                        >
                          +{quest.xpReward}XP
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: quest.completed ? quest.color : quest.color,
                          opacity: quest.completed ? 0.5 : 1,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
