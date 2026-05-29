'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ArrowLeft, Zap, Trophy, ChevronDown, ChevronUp, Dumbbell, TrendingUp } from 'lucide-react'

type SetEntry = {
  exercise_name: string
  weight_kg: string
  reps: string
  sets: string
}

const emptyEntry = (): SetEntry => ({
  exercise_name: '',
  weight_kg: '',
  reps: '',
  sets: '3',
})

type SuccessState = {
  workoutId: string
  xpEarned: number
  leveledUp: boolean
  isPR: boolean
}

const WORKOUT_TEMPLATES: { name: string; emoji: string; exercises: string[]; color: string }[] = [
  { name: 'Peito & Tríceps', emoji: '💪', exercises: ['Supino Reto', 'Supino Inclinado', 'Crucifixo', 'Tríceps Pulley', 'Tríceps Testa'], color: '#FF4D00' },
  { name: 'Costas & Bíceps', emoji: '🦾', exercises: ['Puxada Alta', 'Remada Curvada', 'Serrote', 'Rosca Direta', 'Rosca Martelo'], color: '#7C3AED' },
  { name: 'Pernas', emoji: '🦵', exercises: ['Agachamento', 'Leg Press', 'Extensora', 'Flexora', 'Panturrilha'], color: '#3B82F6' },
  { name: 'Ombros', emoji: '🏋️', exercises: ['Desenvolvimento', 'Elevação Lateral', 'Elevação Frontal', 'Crucifixo Inverso', 'Encolhimento'], color: '#EC4899' },
  { name: 'Full Body', emoji: '⚡', exercises: ['Agachamento', 'Supino Reto', 'Puxada Alta', 'Desenvolvimento', 'Abdominal'], color: '#F5C842' },
  { name: 'HIIT', emoji: '🔥', exercises: ['Burpee', 'Mountain Climber', 'Jump Squat', 'Push-up', 'Sprint'], color: '#00FF88' },
]

function buildEntriesFromTemplate(template: typeof WORKOUT_TEMPLATES[number]): SetEntry[] {
  return template.exercises.map((name) => ({
    exercise_name: name,
    weight_kg: '',
    reps: '12',
    sets: '3',
  }))
}

export function NovoTreinoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [title, setTitle] = useState('')
  const [entries, setEntries] = useState<SetEntry[]>([emptyEntry()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    const titleParam = searchParams.get('title')
    if (titleParam) {
      setTitle(titleParam)
      const builtEntries: SetEntry[] = []
      let i = 0
      while (searchParams.has(`ex${i}_name`)) {
        builtEntries.push({
          exercise_name: searchParams.get(`ex${i}_name`) ?? '',
          weight_kg: searchParams.get(`ex${i}_weight`) ?? '',
          reps: searchParams.get(`ex${i}_reps`) ?? '',
          sets: searchParams.get(`ex${i}_sets`) ?? '3',
        })
        i++
      }
      if (builtEntries.length > 0) {
        setEntries(builtEntries)
      }
    }
  }, [searchParams])

  function applyTemplate(template: typeof WORKOUT_TEMPLATES[number]) {
    setTitle(template.name)
    setEntries(buildEntriesFromTemplate(template))
    setShowTemplates(false)
  }

  function updateEntry(index: number, field: keyof SetEntry, value: string) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    )
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()])
  }

  function removeEntry(index: number) {
    if (entries.length === 1) return
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  function duplicateEntry(index: number) {
    const entry = entries[index]
    if (!entry) return
    setEntries((prev) => [
      ...prev.slice(0, index + 1),
      { ...entry },
      ...prev.slice(index + 1),
    ])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Dê um nome ao treino.')
      return
    }

    const validEntries = entries.filter((e) => e.exercise_name.trim())
    if (validEntries.length === 0) {
      setError('Adicione ao menos um exercício.')
      return
    }

    const parsedSets = validEntries.map((e) => ({
      exercise_name: e.exercise_name.trim(),
      weight_kg: parseFloat(e.weight_kg) || 0,
      reps: parseInt(e.reps) || 0,
      sets: Math.max(1, parseInt(e.sets) || 1),
    }))

    setLoading(true)
    if (navigator.vibrate) navigator.vibrate([15, 10, 40])

    try {
      const res = await fetch('/api/treinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), sets: parsedSets }),
      })

      const data = await res.json() as {
        workoutId?: string
        xpEarned?: number
        leveledUp?: boolean
        newLevel?: number
        isPR?: boolean
        error?: string
      }

      if (!res.ok || !data.workoutId) {
        setError(
          data.error === 'unauthorized'
            ? 'Sessão expirada. Faça login novamente.'
            : 'Erro ao salvar treino. Tente novamente.'
        )
        setLoading(false)
        return
      }

      setSuccess({
        workoutId: data.workoutId,
        xpEarned: data.xpEarned ?? 0,
        leveledUp: data.leveledUp ?? false,
        isPR: data.isPR ?? false,
      })

      if (data.leveledUp && data.newLevel) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } }))
        }, 800)
      }

      setTimeout(() => {
        router.push(`/treinos/${data.workoutId}`)
      }, 2500)
    } catch {
      setError('Erro de conexão. Verifique sua internet.')
      setLoading(false)
    }
  }

  const totalSetsCount = entries.reduce((acc, e) => acc + Math.max(1, parseInt(e.sets) || 1), 0)
  const estimatedXp = 100 + Math.min(totalSetsCount * 5, 200)

  const totalEstimatedVolume = entries.reduce((acc, e) => {
    const weight = parseFloat(e.weight_kg) || 0
    const reps = parseInt(e.reps) || 0
    const sets = Math.max(1, parseInt(e.sets) || 1)
    return acc + weight * reps * sets
  }, 0)

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div
          className="w-full max-w-md p-10 text-center space-y-6 animate-slide-up rounded-2xl relative overflow-hidden"
          style={{
            background: success.isPR
              ? 'linear-gradient(135deg, rgba(245,200,66,0.12) 0%, rgba(13,24,41,0.99) 100%)'
              : 'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.99) 100%)',
            border: success.isPR
              ? '1px solid rgba(245,200,66,0.35)'
              : '1px solid rgba(255,77,0,0.3)',
            boxShadow: success.isPR
              ? '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,200,66,0.1)'
              : '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,77,0,0.08)',
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: success.isPR
                ? 'radial-gradient(circle, rgba(245,200,66,0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255,77,0,0.12) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="text-7xl mb-2">{success.isPR ? '🏆' : '💪'}</div>
            <h2 className="heading-display text-5xl" style={{ color: success.isPR ? '#F5C842' : '#FF4D00' }}>
              {success.isPR ? 'Novo Recorde!' : 'Treino Feito!'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-brand-gold text-4xl font-black mt-4">
              <Zap size={32} fill="currentColor" />
              +{success.xpEarned} XP
            </div>
            {success.leveledUp && (
              <div className="text-brand-green font-bold text-xl animate-pulse mt-2">
                🎉 LEVEL UP!
              </div>
            )}
            <p className="text-text-secondary text-sm mt-4">Redirecionando para os detalhes…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">

        <Link
          href="/treinos"
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          Voltar para treinos
        </Link>

        {/* Page header */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <div
            className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.12) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl flex items-center gap-3">
                <Dumbbell size={32} className="text-brand-orange" />
                Novo Treino
              </h1>
              <p className="text-text-secondary mt-1">
                {estimatedXp > 100 ? `~${estimatedXp} XP estimado · ${totalSetsCount} sets` : 'Registre sua sessão e ganhe XP'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all font-medium"
              style={
                showTemplates
                  ? { background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.4)', color: '#FF4D00' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899BB' }
              }
            >
              Templates {showTemplates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Templates picker */}
        {showTemplates && (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,0,0.05) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(255,77,0,0.15)',
            }}
          >
            <p className="text-sm text-text-secondary">Escolha um template para preencher rapidamente:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {WORKOUT_TEMPLATES.map((t) => {
                const r = parseInt(t.color.slice(1, 3), 16)
                const g = parseInt(t.color.slice(3, 5), 16)
                const b = parseInt(t.color.slice(5, 7), 16)
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="p-3 rounded-xl text-left transition-all hover:scale-[1.02] group"
                    style={{
                      background: `rgba(${r},${g},${b},0.06)`,
                      border: `1px solid rgba(${r},${g},${b},0.2)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `rgba(${r},${g},${b},0.12)`
                      e.currentTarget.style.borderColor = `rgba(${r},${g},${b},0.4)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `rgba(${r},${g},${b},0.06)`
                      e.currentTarget.style.borderColor = `rgba(${r},${g},${b},0.2)`
                    }}
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div className="font-medium text-sm text-white">{t.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">{t.exercises.length} exercícios</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Nome do treino
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Ex: Peito e Tríceps, Full Body, Leg Day…"
            />
          </div>

          {/* Exercise entries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-semibold text-text-secondary text-sm uppercase tracking-wider">
                Exercícios ({entries.filter((e) => e.exercise_name.trim()).length})
              </h2>
            </div>

            {entries.map((entry, i) => {
              const hasVolume = entry.weight_kg && entry.reps
              const vol = hasVolume
                ? Math.round(parseFloat(entry.weight_kg) * parseInt(entry.reps) * Math.max(1, parseInt(entry.sets) || 1))
                : 0

              return (
                <div
                  key={i}
                  className="rounded-2xl p-5 space-y-4 relative overflow-hidden"
                  style={{
                    background: entry.exercise_name.trim()
                      ? 'linear-gradient(135deg, rgba(255,77,0,0.05) 0%, rgba(13,24,41,0.98) 100%)'
                      : 'rgba(13,24,41,0.7)',
                    border: entry.exercise_name.trim()
                      ? '1px solid rgba(255,77,0,0.18)'
                      : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Exercise number badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(255,77,0,0.12)', color: '#FF4D00' }}
                    >
                      #{i + 1}
                    </div>
                    <div className="flex gap-1 items-center">
                      <button
                        type="button"
                        onClick={() => duplicateEntry(i)}
                        className="text-xs text-text-muted hover:text-brand-orange px-2 py-1 rounded-lg hover:bg-brand-orange/10 transition-all"
                        title="Duplicar exercício"
                      >
                        Copiar
                      </button>
                      {entries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEntry(i)}
                          className="text-text-muted hover:text-brand-red transition-colors p-1.5 rounded-lg hover:bg-brand-red/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={entry.exercise_name}
                    onChange={(e) => updateEntry(i, 'exercise_name', e.target.value)}
                    className="input w-full"
                    placeholder="Nome do exercício (ex: Supino Reto)"
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs text-text-muted text-center uppercase tracking-wider">Peso (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={entry.weight_kg}
                        onChange={(e) => updateEntry(i, 'weight_kg', e.target.value)}
                        className="input w-full text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs text-text-muted text-center uppercase tracking-wider">Reps</label>
                      <input
                        type="number"
                        min="0"
                        value={entry.reps}
                        onChange={(e) => updateEntry(i, 'reps', e.target.value)}
                        className="input w-full text-center"
                        placeholder="12"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs text-text-muted text-center uppercase tracking-wider">Sets</label>
                      <input
                        type="number"
                        min="1"
                        value={entry.sets}
                        onChange={(e) => updateEntry(i, 'sets', e.target.value)}
                        className="input w-full text-center"
                        placeholder="3"
                      />
                    </div>
                  </div>

                  {vol > 0 && (
                    <div
                      className="text-xs flex items-center justify-end gap-1.5"
                      style={{ color: '#7C3AED' }}
                    >
                      <TrendingUp size={11} />
                      Volume: {vol > 1000 ? `${(vol / 1000).toFixed(1)}t` : `${vol}kg`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add exercise button */}
          <button
            type="button"
            onClick={addEntry}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-all"
            style={{
              background: 'rgba(255,77,0,0.06)',
              border: '1px dashed rgba(255,77,0,0.3)',
              color: '#FF4D00',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,77,0,0.12)'
              e.currentTarget.style.borderColor = 'rgba(255,77,0,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,77,0,0.06)'
              e.currentTarget.style.borderColor = 'rgba(255,77,0,0.3)'
            }}
          >
            <Plus size={18} />
            Adicionar exercício
          </button>

          {error && (
            <div
              className="text-sm rounded-xl p-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
            >
              {error}
            </div>
          )}

          {/* Session summary */}
          <div
            className="rounded-2xl p-5 space-y-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
              style={{ background: 'rgba(245,200,66,0.15)' }}
            />
            <div className="relative z-10">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Resumo da sessão
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.15)' }}
                >
                  <div className="heading-display text-2xl text-brand-orange">{totalSetsCount}</div>
                  <div className="text-xs text-text-muted mt-0.5">sets</div>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
                >
                  <div className="heading-display text-2xl text-brand-purple">
                    {totalEstimatedVolume > 0
                      ? totalEstimatedVolume > 1000
                        ? `${(totalEstimatedVolume / 1000).toFixed(1)}t`
                        : `${Math.round(totalEstimatedVolume)}kg`
                      : '—'}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">volume</div>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.15)' }}
                >
                  <div className="heading-display text-2xl text-brand-gold flex items-center justify-center gap-1">
                    <Zap size={16} fill="currentColor" />
                    {estimatedXp}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">XP estimado</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-3">
                <Trophy size={11} className="text-brand-gold" />
                Pesos acima do histórico geram +150 XP de record pessoal
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-4 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Salvando treino…'
            ) : (
              <>
                <Zap size={20} fill="currentColor" className="text-brand-gold" />
                Finalizar treino
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
