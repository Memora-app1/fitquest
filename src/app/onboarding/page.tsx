'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GOALS = [
  { value: 'lose_weight', label: 'Perder peso', icon: '🔥' },
  { value: 'gain_muscle', label: 'Ganhar massa', icon: '💪' },
  { value: 'consistency', label: 'Criar consistência', icon: '🎯' },
  { value: 'health', label: 'Mais saúde', icon: '❤️' },
  { value: 'productivity', label: 'Ser mais produtivo', icon: '⚡' },
]

const TARGETS = [
  { value: 3, label: '3 dias/semana — leve' },
  { value: 4, label: '4 dias/semana — moderado' },
  { value: 5, label: '5 dias/semana — intenso' },
  { value: 7, label: 'Todo dia — máquina' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [weeklyTarget, setWeeklyTarget] = useState(4)
  const [loading, setLoading] = useState(false)

  async function finishOnboarding() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    await supabase
      .from('profiles')
      .update({
        primary_goal: primaryGoal,
        weekly_target: weeklyTarget,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    // Criar hábitos iniciais sugeridos baseado no goal
    const suggestedHabits = getSuggestedHabits(primaryGoal)
    if (suggestedHabits.length > 0) {
      await supabase.from('habits').insert(
        suggestedHabits.map((h, i) => ({
          ...h,
          user_id: user.id,
          display_order: i,
        }))
      )
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow w-full max-w-lg p-8 space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 rounded-full transition-all ${
                n === step ? 'w-8 bg-brand-orange' : n < step ? 'w-2 bg-brand-orange/50' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="text-center">
              <h1 className="heading-display text-3xl mb-2">Bem-vindo ao FitQuest</h1>
              <p className="text-text-secondary">Vamos configurar sua jornada em 3 passos</p>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full">
              Bora começar →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-2xl font-bold mb-2">Qual seu objetivo principal?</h2>
              <p className="text-text-secondary text-sm">Vamos personalizar pra você</p>
            </div>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setPrimaryGoal(g.value)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    primaryGoal === g.value
                      ? 'bg-brand-orange/10 border-brand-orange'
                      : 'bg-bg-elevated border-border hover:border-brand-orange/40'
                  }`}
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span className="font-medium">{g.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={!primaryGoal}
              className="btn-primary w-full disabled:opacity-50"
            >
              Próximo →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="text-2xl font-bold mb-2">Quantos dias por semana?</h2>
              <p className="text-text-secondary text-sm">Seja realista — pode mudar depois</p>
            </div>
            <div className="space-y-2">
              {TARGETS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setWeeklyTarget(t.value)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    weeklyTarget === t.value
                      ? 'bg-brand-orange/10 border-brand-orange'
                      : 'bg-bg-elevated border-border hover:border-brand-orange/40'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                </button>
              ))}
            </div>
            <button onClick={finishOnboarding} disabled={loading} className="btn-primary w-full">
              {loading ? 'Configurando...' : 'Começar minha jornada →'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

function getSuggestedHabits(goal: string) {
  const base = { is_active: true, target_period: 'week' as const, frequency_per_week: 4, xp_per_completion: 50 }
  const map: Record<string, Array<Record<string, unknown>>> = {
    lose_weight: [
      { name: 'Treinar', icon: '💪', color: '#FF4D00', category: 'strength', target_type: 'count', target_value: 4, target_unit: 'treinos' },
      { name: 'Cardio 30min', icon: '🏃', color: '#00FF88', category: 'cardio', target_type: 'minutes', target_value: 30, target_unit: 'min' },
      { name: 'Beber 2L água', icon: '💧', color: '#3B82F6', category: 'nutrition', target_type: 'count', target_value: 1, target_unit: 'vez' },
    ],
    gain_muscle: [
      { name: 'Treinar', icon: '💪', color: '#FF4D00', category: 'strength', target_type: 'count', target_value: 5, target_unit: 'treinos' },
      { name: 'Comer proteína', icon: '🍗', color: '#F59E0B', category: 'nutrition', target_type: 'count', target_value: 1, target_unit: 'vez' },
      { name: 'Dormir 7h+', icon: '😴', color: '#7C3AED', category: 'sleep', target_type: 'count', target_value: 1, target_unit: 'vez' },
    ],
    consistency: [
      { name: 'Hábito principal', icon: '🎯', color: '#FF4D00', category: 'custom', target_type: 'count', target_value: 1, target_unit: 'vez' },
    ],
    health: [
      { name: 'Caminhar 30min', icon: '🚶', color: '#00FF88', category: 'cardio', target_type: 'minutes', target_value: 30, target_unit: 'min' },
      { name: 'Meditar 10min', icon: '🧘', color: '#7C3AED', category: 'mindfulness', target_type: 'minutes', target_value: 10, target_unit: 'min' },
    ],
    productivity: [
      { name: 'Focus 2h', icon: '⚡', color: '#FF4D00', category: 'custom', target_type: 'minutes', target_value: 120, target_unit: 'min' },
      { name: 'Planejar o dia', icon: '📋', color: '#7C3AED', category: 'custom', target_type: 'count', target_value: 1, target_unit: 'vez' },
    ],
  }
  return (map[goal] ?? []).map((h) => ({ ...base, ...h }))
}
