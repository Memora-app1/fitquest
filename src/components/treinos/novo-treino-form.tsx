'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ArrowLeft, Zap, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const WORKOUT_TEMPLATES: { name: string; emoji: string; exercises: string[] }[] = [
  { name: 'Peito & Tríceps', emoji: '💪', exercises: ['Supino Reto', 'Supino Inclinado', 'Crucifixo', 'Tríceps Pulley', 'Tríceps Testa'] },
  { name: 'Costas & Bíceps', emoji: '🦾', exercises: ['Puxada Alta', 'Remada Curvada', 'Serrote', 'Rosca Direta', 'Rosca Martelo'] },
  { name: 'Pernas', emoji: '🦵', exercises: ['Agachamento', 'Leg Press', 'Extensora', 'Flexora', 'Panturrilha'] },
  { name: 'Ombros', emoji: '🏋️', exercises: ['Desenvolvimento', 'Elevação Lateral', 'Elevação Frontal', 'Crucifixo Inverso', 'Encolhimento'] },
  { name: 'Full Body', emoji: '⚡', exercises: ['Agachamento', 'Supino Reto', 'Puxada Alta', 'Desenvolvimento', 'Abdominal'] },
  { name: 'HIIT', emoji: '🔥', exercises: ['Burpee', 'Mountain Climber', 'Jump Squat', 'Push-up', 'Sprint'] },
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

  // Read from URL params (for "repeat workout" feature)
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
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="card-glow w-full max-w-md p-10 text-center space-y-6 animate-slide-up">
          <div className="text-7xl">{success.isPR ? '🏆' : '💪'}</div>
          <h2 className="heading-display text-5xl gradient-text">
            {success.isPR ? 'Novo Recorde!' : 'Treino Feito!'}
          </h2>
          <div className="flex items-center justify-center gap-2 text-brand-gold text-4xl font-black">
            <Zap size={32} />
            +{success.xpEarned} XP
          </div>
          {success.leveledUp && (
            <div className="text-brand-green font-bold text-xl animate-pulse">
              🎉 LEVEL UP!
            </div>
          )}
          <p className="text-text-secondary text-sm">Redirecionando para os detalhes…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/treinos"
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          Voltar para treinos
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="heading-display text-4xl">Novo Treino</h1>
            <p className="text-text-secondary">Registre sua sessão e ganhe XP</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className={cn(
              'btn-ghost text-sm flex items-center gap-1.5 shrink-0',
              showTemplates && 'border-brand-orange/50 text-brand-orange'
            )}
          >
            Templates {showTemplates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Templates picker */}
        {showTemplates && (
          <div className="card p-4 space-y-3">
            <p className="text-sm text-text-secondary">Escolha um template para preencher rapidamente:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {WORKOUT_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="p-3 bg-bg-elevated border border-border rounded-xl text-left hover:border-brand-orange/50 hover:bg-brand-orange/5 transition-all group"
                >
                  <div className="text-2xl mb-1">{t.emoji}</div>
                  <div className="font-medium text-sm group-hover:text-brand-orange transition-colors">{t.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">{t.exercises.length} exercícios</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="card p-4 space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
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
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-secondary">
                Exercícios ({entries.filter((e) => e.exercise_name.trim()).length})
              </h2>
            </div>

            {entries.map((entry, i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">
                    Exercício {i + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateEntry(i)}
                      className="text-xs text-text-muted hover:text-brand-orange px-2 py-1 rounded hover:bg-brand-orange/10 transition-all"
                      title="Duplicar exercício"
                    >
                      Copiar
                    </button>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(i)}
                        className="text-text-muted hover:text-brand-red transition-colors p-1"
                      >
                        <Trash2 size={15} />
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

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs text-text-muted text-center">Peso (kg)</label>
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
                  <div className="space-y-1">
                    <label className="block text-xs text-text-muted text-center">Reps</label>
                    <input
                      type="number"
                      min="0"
                      value={entry.reps}
                      onChange={(e) => updateEntry(i, 'reps', e.target.value)}
                      className="input w-full text-center"
                      placeholder="12"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-text-muted text-center">Sets</label>
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

                {/* Volume preview for this exercise */}
                {entry.weight_kg && entry.reps && (
                  <div className="text-xs text-text-muted text-right">
                    Volume: {Math.round(parseFloat(entry.weight_kg) * parseInt(entry.reps) * Math.max(1, parseInt(entry.sets) || 1))}kg total
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add exercise button */}
          <button
            type="button"
            onClick={addEntry}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Adicionar exercício
          </button>

          {error && (
            <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Session summary */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-medium text-text-secondary">Resumo da sessão</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="heading-display text-xl text-brand-orange">{totalSetsCount}</div>
                <div className="text-xs text-text-muted">sets</div>
              </div>
              <div>
                <div className="heading-display text-xl text-brand-purple">
                  {totalEstimatedVolume > 0
                    ? totalEstimatedVolume > 1000
                      ? `${(totalEstimatedVolume / 1000).toFixed(1)}t`
                      : `${Math.round(totalEstimatedVolume)}kg`
                    : '—'}
                </div>
                <div className="text-xs text-text-muted">volume</div>
              </div>
              <div>
                <div className="heading-display text-xl text-brand-gold flex items-center justify-center gap-1">
                  <Zap size={16} />
                  {estimatedXp}
                </div>
                <div className="text-xs text-text-muted">XP estimado</div>
              </div>
            </div>
            <div className="text-xs text-text-muted flex items-center gap-1">
              <Trophy size={12} />
              Pesos acima do histórico geram +150 XP de record pessoal
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-4 disabled:opacity-60"
          >
            {loading ? 'Salvando treino…' : '⚡ Finalizar treino'}
          </button>
        </form>
      </div>
    </div>
  )
}
