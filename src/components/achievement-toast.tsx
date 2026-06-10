'use client'

/**
 * AchievementToast — toast premium que aparece ao desbloquear conquistas.
 * Dispara via: window.dispatchEvent(new CustomEvent('ascendia:achievement', {
 *   detail: { slug: 'first_habit' }
 * }))
 */

import { useState, useEffect, useRef } from 'react'
import { Trophy, Zap, X } from 'lucide-react'

// Mapa de slugs → dados da conquista (mantido em sincronia com o banco)
const ACHIEVEMENT_MAP: Record<string, { name: string; emoji: string; xp: number; rarity: 'common' | 'rare' | 'epic' | 'legendary' }> = {
  // Hábitos
  first_habit:      { name: 'Primeiro Passo',      emoji: '🎯', xp: 50,   rarity: 'common' },
  habits_100:       { name: '100 Hábitos',          emoji: '💪', xp: 200,  rarity: 'rare' },
  habits_500:       { name: '500 Hábitos',          emoji: '⚡', xp: 500,  rarity: 'epic' },
  habits_1000:      { name: '1.000 Hábitos',        emoji: '🏆', xp: 1000, rarity: 'legendary' },
  perfect_day:      { name: 'Dia Perfeito',         emoji: '⭐', xp: 100,  rarity: 'rare' },
  perfect_week:     { name: 'Semana Perfeita',      emoji: '🌟', xp: 300,  rarity: 'epic' },
  // Tarefas
  first_task:       { name: 'Primeira Tarefa',      emoji: '✅', xp: 30,   rarity: 'common' },
  tasks_50:         { name: '50 Tarefas',           emoji: '🎖️', xp: 150,  rarity: 'rare' },
  tasks_200:        { name: '200 Tarefas',          emoji: '🏅', xp: 400,  rarity: 'epic' },
  first_subtask:    { name: 'Subtarefa',            emoji: '📋', xp: 20,   rarity: 'common' },
  subtasks_50:      { name: '50 Subtarefas',        emoji: '📊', xp: 100,  rarity: 'rare' },
  // Treinos
  first_workout:    { name: 'Primeiro Treino',      emoji: '🏋️', xp: 100,  rarity: 'common' },
  workouts_10:      { name: '10 Treinos',           emoji: '💪', xp: 200,  rarity: 'rare' },
  workouts_50:      { name: '50 Treinos',           emoji: '🥇', xp: 500,  rarity: 'epic' },
  first_pr:         { name: 'Primeiro PR',          emoji: '🔥', xp: 150,  rarity: 'rare' },
  // Finanças
  first_transaction:     { name: 'Primeiro Registro', emoji: '💰', xp: 20,   rarity: 'common' },
  transactions_50:       { name: '50 Registros',      emoji: '📈', xp: 100,  rarity: 'rare' },
  finance_goal_completed:{ name: 'Meta Financeira',   emoji: '🎯', xp: 500,  rarity: 'epic' },
  finance_goals_3:       { name: '3 Metas Financeiras',emoji:'💎', xp: 200,  rarity: 'rare' },
  // Metas
  first_goal:       { name: 'Primeira Meta',        emoji: '🎯', xp: 50,   rarity: 'common' },
  goals_5:          { name: '5 Metas Concluídas',   emoji: '🏆', xp: 300,  rarity: 'epic' },
  // Saúde
  first_mood_checkin:  { name: 'Check-in de Humor', emoji: '😊', xp: 20,   rarity: 'common' },
  first_sleep_log:     { name: 'Primeiro Sono',     emoji: '😴', xp: 20,   rarity: 'common' },
  first_water_goal:    { name: '2L de Água',        emoji: '💧', xp: 50,   rarity: 'common' },
  water_goal_7:        { name: '7 Dias Hidratado',  emoji: '🌊', xp: 200,  rarity: 'rare' },
  // Nível
  level_2:          { name: 'Nível 2 — Dedicado',   emoji: '🥉', xp: 0,    rarity: 'common' },
  level_3:          { name: 'Nível 3 — Consistente',emoji: '🥈', xp: 0,    rarity: 'rare' },
  level_4:          { name: 'Nível 4 — Atleta',     emoji: '🥇', xp: 0,    rarity: 'rare' },
  level_5:          { name: 'Nível 5 — Guerreiro',  emoji: '⚔️', xp: 0,    rarity: 'epic' },
  level_6:          { name: 'Nível 6 — Elite',      emoji: '🛡️', xp: 0,    rarity: 'epic' },
  level_7:          { name: 'Nível 7 — Lendário',   emoji: '🏛️', xp: 0,    rarity: 'legendary' },
  level_8:          { name: 'Ascendia Master',      emoji: '👑', xp: 0,    rarity: 'legendary' },
}

const RARITY_STYLE = {
  common:    { color: '#8899BB', rgb: '136,153,187', border: 'rgba(136,153,187,0.4)' },
  rare:      { color: '#3B82F6', rgb: '59,130,246',  border: 'rgba(59,130,246,0.5)'  },
  epic:      { color: '#7C3AED', rgb: '124,58,237',  border: 'rgba(124,58,237,0.55)' },
  legendary: { color: '#F5C842', rgb: '245,200,66',  border: 'rgba(245,200,66,0.6)'  },
}

const TOAST_DURATION = 4000

interface AchievementItem {
  id: number
  slug: string
  timestamp: number
}

let toastId = 0

export function AchievementToast() {
  const [queue, setQueue] = useState<AchievementItem[]>([])

  useEffect(() => {
    function handle(e: Event) {
      const ce = e as CustomEvent<{ slug: string }>
      const slug = ce.detail?.slug
      if (!slug || !ACHIEVEMENT_MAP[slug]) return
      const id = ++toastId
      setQueue((prev) => [...prev, { id, slug, timestamp: Date.now() }])
      setTimeout(() => setQueue((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION + 600)
    }
    window.addEventListener('ascendia:achievement', handle)
    return () => window.removeEventListener('ascendia:achievement', handle)
  }, [])

  if (queue.length === 0) return null

  return (
    <div className="fixed bottom-36 left-4 md:bottom-8 md:left-6 z-50 flex flex-col-reverse gap-2 pointer-events-none max-w-[280px]">
      {queue.map((item) => (
        <AchievementItem key={item.id} item={item} onDismiss={() => setQueue((p) => p.filter((t) => t.id !== item.id))} />
      ))}
    </div>
  )
}

function AchievementItem({ item, onDismiss }: { item: AchievementItem; onDismiss: () => void }) {
  const [entering, setEntering] = useState(true)   // começa fora de cena
  const [exiting, setExiting]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const data  = ACHIEVEMENT_MAP[item.slug]!
  const style = RARITY_STYLE[data.rarity]

  useEffect(() => {
    // Haptic + som ao entrar — diferenciado por raridade
    if (navigator.vibrate) {
      if (data.rarity === 'legendary') navigator.vibrate([80, 30, 150, 30, 200])
      else if (data.rarity === 'epic') navigator.vibrate([50, 20, 100, 20, 150])
      else if (data.rarity === 'rare') navigator.vibrate([30, 15, 70])
      else                              navigator.vibrate([20, 10, 40])
    }

    // Entra na cena após 1 tick
    const t0 = setTimeout(() => setEntering(false), 16)

    timerRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(onDismiss, 400)
    }, TOAST_DURATION)

    return () => {
      clearTimeout(t0)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="relative rounded-2xl overflow-hidden pointer-events-auto"
      style={{
        background: `linear-gradient(135deg, rgba(${style.rgb},0.18) 0%, rgba(13,24,41,0.97) 100%)`,
        border: `1px solid ${style.border}`,
        boxShadow: `0 8px 32px rgba(${style.rgb},0.2), 0 0 0 1px rgba(${style.rgb},0.08) inset`,
        transform: exiting
          ? 'translateX(calc(-100% - 1.5rem))'
          : entering
          ? 'translateX(calc(-100% - 1.5rem))'
          : 'translateX(0)',
        opacity: exiting || entering ? 0 : 1,
        transition: entering
          ? 'none'
          : 'transform 0.38s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.22s ease',
      }}
    >
      {/* Left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: `linear-gradient(180deg, ${style.color}, rgba(${style.rgb},0.4))` }}
      />

      <div className="flex items-start gap-3 px-4 pl-5 py-3">
        {/* Trophy icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `rgba(${style.rgb},0.12)`, border: `1px solid rgba(${style.rgb},0.25)` }}
        >
          {data.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <Trophy size={10} style={{ color: style.color }} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: style.color }}>
              {data.rarity === 'legendary' ? 'Lendário' : data.rarity === 'epic' ? 'Épico' : data.rarity === 'rare' ? 'Raro' : 'Conquista'}
            </span>
          </div>
          <div className="text-sm font-black text-white leading-tight">{data.name}</div>
          {data.xp > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Zap size={9} fill="currentColor" className="text-brand-gold" />
              <span className="text-[10px] font-bold text-brand-gold">+{data.xp} XP</span>
            </div>
          )}
        </div>

        <button
          onClick={() => { setExiting(true); setTimeout(onDismiss, 400) }}
          className="p-1 rounded-lg hover:bg-white/10 transition-all shrink-0 mt-0.5"
          style={{ color: '#5A6B85' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar duration={TOAST_DURATION} rgb={style.rgb} />
    </div>
  )
}

function ProgressBar({ duration, rgb }: { duration: number; rgb: string }) {
  const [width, setWidth] = useState(100)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts
      const remaining = Math.max(0, 1 - (ts - startRef.current) / duration)
      setWidth(remaining * 100)
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [duration])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div
        className="h-full"
        style={{
          width: `${width}%`,
          background: `rgba(${rgb},0.7)`,
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  )
}
