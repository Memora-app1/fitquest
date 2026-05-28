'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Check, ChevronRight } from 'lucide-react'

const GOALS = [
  { value: 'lose_weight', label: 'Perder peso', icon: '🔥', desc: 'Queimar gordura e emagrecer com saúde' },
  { value: 'gain_muscle', label: 'Ganhar massa', icon: '💪', desc: 'Hipertrofia, força e volume muscular' },
  { value: 'consistency', label: 'Criar consistência', icon: '🎯', desc: 'Hábitos diários e sequência imparável' },
  { value: 'health', label: 'Mais saúde', icon: '❤️', desc: 'Bem-estar, sono e qualidade de vida' },
  { value: 'productivity', label: 'Ser mais produtivo', icon: '⚡', desc: 'Foco, tarefas e resultado no trabalho' },
  { value: 'finance', label: 'Controlar finanças', icon: '💰', desc: 'Gastos, metas e liberdade financeira' },
]

const TARGETS = [
  { value: 3, label: '3x por semana', sub: 'Leve — bom pra começar', emoji: '😊' },
  { value: 4, label: '4x por semana', sub: 'Moderado — o sweet spot', emoji: '💪', recommended: true },
  { value: 5, label: '5x por semana', sub: 'Intenso — para sérios', emoji: '🔥' },
  { value: 7, label: 'Todo dia', sub: 'Máquina absoluta', emoji: '👑' },
]

const MODULES = [
  { value: 'fitness', label: 'Fitness & Hábitos', icon: '💪', desc: 'Treinos, séries, hábitos diários', rgb: '255,77,0' },
  { value: 'productivity', label: 'Tarefas', icon: '✅', desc: 'Kanban + Matriz Eisenhower', rgb: '124,58,237' },
  { value: 'finance', label: 'Finanças', icon: '💰', desc: 'Gastos, receitas e metas', rgb: '0,255,136' },
  { value: 'coach', label: 'Coach IA', icon: '🤖', desc: 'Assistente com contexto total', rgb: '245,200,66' },
]

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [weeklyTarget, setWeeklyTarget] = useState(4)
  const [loading, setLoading] = useState(false)

  const MAX_GOALS = 3

  function toggleGoal(value: string) {
    setSelectedGoals((prev) => {
      if (prev.includes(value)) return prev.filter((g) => g !== value)
      if (prev.length >= MAX_GOALS) return prev // already at limit
      return [...prev, value]
    })
  }

  async function finishOnboarding() {
    setLoading(true)

    const suggestedHabits = getSuggestedHabitsMulti(selectedGoals)

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primary_goal: selectedGoals.join(','),
        weekly_target: weeklyTarget,
        habits: suggestedHabits.map((h, i) => ({ ...h, display_order: i })),
      }),
    })

    if (!res.ok) {
      setLoading(false)
      return
    }

    const data = await res.json() as { xpEarned?: number; leveledUp?: boolean; newLevel?: number }
    if (data.leveledUp && data.newLevel) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } }))
      }, 1500)
    }

    router.push('/dashboard?welcome=1')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-orange/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[200px] bg-brand-purple/8 blur-[100px] rounded-full" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Progress bar */}
        {step > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted">Passo {step - 1} de {TOTAL_STEPS - 1}</span>
              <span className="text-xs text-text-muted">{Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div
          className="p-6 md:p-8 space-y-6 animate-fade-in rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)' }} />
          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">⚡</div>
              <div>
                <h1 className="heading-display text-4xl gradient-text mb-3">Bem-vindo ao Ascendia</h1>
                <p className="text-text-secondary leading-relaxed">
                  O único app que gamifica sua academia, tarefas e finanças ao mesmo tempo.
                  Cada ação vira XP. Cada dia vira evolução.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MODULES.map((m) => (
                  <div
                    key={m.value}
                    className="p-3 text-left rounded-xl"
                    style={{
                      background: `rgba(${m.rgb},0.06)`,
                      border: `1px solid rgba(${m.rgb},0.2)`,
                    }}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{m.desc}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button onClick={() => setStep(2)} className="btn-primary w-full text-lg py-4">
                  Vamos começar <ChevronRight size={18} className="inline" />
                </button>
                <p className="text-xs text-text-muted">Configuração rápida · menos de 1 minuto</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Goals (multi-select, max 3) ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Quais seus objetivos?</h2>
                <div className="flex items-center justify-between">
                  <p className="text-text-secondary text-sm">
                    Vamos personalizar sua experiência com hábitos sugeridos.
                  </p>
                  <span
                    className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ml-3 transition-all',
                      selectedGoals.length === MAX_GOALS
                        ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/40'
                        : 'bg-bg-elevated text-text-muted border border-border'
                    )}
                  >
                    {selectedGoals.length}/{MAX_GOALS}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {GOALS.map((g) => {
                  const isSelected = selectedGoals.includes(g.value)
                  const isDisabled = !isSelected && selectedGoals.length >= MAX_GOALS
                  return (
                    <button
                      key={g.value}
                      onClick={() => toggleGoal(g.value)}
                      disabled={isDisabled}
                      className={cn(
                        'w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all',
                        isSelected
                          ? 'bg-brand-orange/10 border-brand-orange'
                          : isDisabled
                          ? 'bg-bg-elevated border-border opacity-35 cursor-not-allowed'
                          : 'bg-bg-elevated border-border hover:border-brand-orange/40'
                      )}
                    >
                      <span className="text-2xl shrink-0">{g.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{g.label}</div>
                        <div className="text-xs text-text-muted">{g.desc}</div>
                      </div>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected
                            ? 'bg-brand-orange border-brand-orange'
                            : 'border-border bg-transparent'
                        )}
                      >
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedGoals.length === MAX_GOALS && (
                <p className="text-xs text-brand-orange text-center">
                  Máximo de {MAX_GOALS} objetivos atingido. Desmarque um para trocar.
                </p>
              )}

              <button
                onClick={() => setStep(3)}
                disabled={selectedGoals.length === 0}
                className="btn-primary w-full disabled:opacity-40"
              >
                Próximo →
              </button>
            </div>
          )}

          {/* ── Step 3: Weekly Target ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Quantos dias por semana?</h2>
                <p className="text-text-secondary text-sm">Seja realista. Consistência bate intensidade — você pode ajustar depois.</p>
              </div>

              <div className="space-y-2">
                {TARGETS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setWeeklyTarget(t.value)}
                    className={cn(
                      'w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all',
                      weeklyTarget === t.value
                        ? 'bg-brand-orange/10 border-brand-orange'
                        : 'bg-bg-elevated border-border hover:border-brand-orange/40'
                    )}
                  >
                    <span className="text-2xl shrink-0">{t.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t.label}</span>
                        {t.recommended && (
                          <span className="text-[10px] bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full font-bold uppercase">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted">{t.sub}</div>
                    </div>
                    {weeklyTarget === t.value && (
                      <Check size={18} className="text-brand-orange shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Visual week preview */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-xs text-text-muted mb-2">Sua semana vai parecer assim:</div>
                <div className="flex gap-1.5">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => {
                    const isActive = i < weeklyTarget
                    return (
                      <div key={i} className="flex-1 text-center">
                        <div
                          className={cn(
                            'h-8 rounded-lg mb-1 transition-all',
                            isActive ? 'bg-brand-orange/40' : 'bg-bg-elevated'
                          )}
                        />
                        <span className={cn('text-[10px]', isActive ? 'text-brand-orange' : 'text-text-muted')}>
                          {day}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-ghost flex-1">
                  Voltar
                </button>
                <button onClick={() => setStep(4)} className="btn-primary flex-1">
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirmation ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-3">🚀</div>
                <h2 className="text-2xl font-bold mb-2">Tudo pronto!</h2>
                <p className="text-text-secondary text-sm">
                  Configuramos seu perfil e criamos hábitos iniciais baseados no seu objetivo.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-bg-elevated rounded-xl">
                  <span className="text-xl mt-0.5">🎯</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted mb-1">
                      {selectedGoals.length === 1 ? 'Objetivo' : `${selectedGoals.length} objetivos`}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGoals.map(gv => {
                        const g = GOALS.find(x => x.value === gv)
                        return g ? (
                          <span key={gv} className="flex items-center gap-1 text-sm font-medium bg-brand-orange/10 text-brand-orange border border-brand-orange/25 px-2 py-0.5 rounded-lg">
                            {g.icon} {g.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl">
                  <span className="text-xl">{TARGETS.find((t) => t.value === weeklyTarget)?.emoji}</span>
                  <div>
                    <div className="text-xs text-text-muted">Meta semanal</div>
                    <div className="font-medium">{TARGETS.find((t) => t.value === weeklyTarget)?.label}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl">
                  <span className="text-xl">🌱</span>
                  <div>
                    <div className="text-xs text-text-muted">Hábitos criados</div>
                    <div className="font-medium">
                      {getSuggestedHabitsMulti(selectedGoals).length} hábito(s) personalizado(s)
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.95) 100%)',
                  border: '1px solid rgba(245,200,66,0.3)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-semibold text-brand-gold">Bônus de boas-vindas</div>
                    <div className="text-sm text-text-secondary">
                      Você começa com <strong className="text-brand-gold">+100 XP</strong> só por completar o onboarding!
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="btn-ghost flex-1">
                  Voltar
                </button>
                <button
                  onClick={finishOnboarding}
                  disabled={loading}
                  className="btn-primary flex-1 text-base py-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Configurando...
                    </span>
                  ) : (
                    'Começar minha jornada →'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function getSuggestedHabitsMulti(goals: string[]) {
  const seen = new Set<string>()
  const result: ReturnType<typeof getSuggestedHabits> = []
  for (const g of goals) {
    for (const h of getSuggestedHabits(g)) {
      const key = String((h as Record<string, unknown>)['name'] ?? '')
      if (!seen.has(key)) {
        seen.add(key)
        result.push(h)
      }
    }
  }
  return result.slice(0, 6) // cap at 6 to not overwhelm new user
}

function getSuggestedHabits(goal: string) {
  const base = { is_active: true, target_period: 'week' as const, xp_per_completion: 50 }
  const map: Record<string, Array<Record<string, unknown>>> = {
    lose_weight: [
      { name: 'Treinar', icon: '💪', color: '#FF4D00', category: 'strength', target_type: 'count', target_value: 4, target_unit: 'treinos', frequency_per_week: 4 },
      { name: 'Cardio 30min', icon: '🏃', color: '#00FF88', category: 'cardio', target_type: 'minutes', target_value: 30, target_unit: 'min', frequency_per_week: 4 },
      { name: 'Beber 2L água', icon: '💧', color: '#3B82F6', category: 'nutrition', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 7 },
    ],
    gain_muscle: [
      { name: 'Treinar', icon: '💪', color: '#FF4D00', category: 'strength', target_type: 'count', target_value: 5, target_unit: 'treinos', frequency_per_week: 5 },
      { name: 'Comer proteína', icon: '🍗', color: '#F59E0B', category: 'nutrition', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 7 },
      { name: 'Dormir 7h+', icon: '😴', color: '#7C3AED', category: 'sleep', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 7 },
    ],
    consistency: [
      { name: 'Hábito principal', icon: '🎯', color: '#FF4D00', category: 'custom', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 5 },
      { name: 'Revisar o dia', icon: '📋', color: '#7C3AED', category: 'custom', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 7 },
    ],
    health: [
      { name: 'Caminhar 30min', icon: '🚶', color: '#00FF88', category: 'cardio', target_type: 'minutes', target_value: 30, target_unit: 'min', frequency_per_week: 5 },
      { name: 'Meditar 10min', icon: '🧘', color: '#7C3AED', category: 'mindfulness', target_type: 'minutes', target_value: 10, target_unit: 'min', frequency_per_week: 5 },
      { name: 'Dormir 8h', icon: '😴', color: '#3B82F6', category: 'sleep', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 7 },
    ],
    productivity: [
      { name: 'Focus 2h', icon: '⚡', color: '#FF4D00', category: 'custom', target_type: 'minutes', target_value: 120, target_unit: 'min', frequency_per_week: 5 },
      { name: 'Planejar o dia', icon: '📋', color: '#7C3AED', category: 'custom', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 7 },
      { name: 'Ler 20min', icon: '📖', color: '#00FF88', category: 'custom', target_type: 'minutes', target_value: 20, target_unit: 'min', frequency_per_week: 5 },
    ],
    finance: [
      { name: 'Registrar gastos', icon: '💰', color: '#00FF88', category: 'custom', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 7 },
      { name: 'Revisar extratos', icon: '📊', color: '#F5C842', category: 'custom', target_type: 'count', target_value: 1, target_unit: 'vez', frequency_per_week: 1 },
    ],
  }
  return (map[goal] ?? []).map((h) => ({ ...base, ...h }))
}
