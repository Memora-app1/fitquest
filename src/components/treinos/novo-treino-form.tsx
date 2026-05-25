'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ArrowLeft, Zap, Trophy } from 'lucide-react'

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

export function NovoTreinoForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [entries, setEntries] = useState<SetEntry[]>([emptyEntry()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)

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
      }, 2000)
    } catch {
      setError('Erro de conexão. Verifique sua internet.')
      setLoading(false)
    }
  }

  const estimatedXp =
    100 +
    Math.min(
      entries.reduce((acc, e) => acc + Math.max(1, parseInt(e.sets) || 1), 0) * 5,
      200
    )

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="card-glow w-full max-w-md p-10 text-center space-y-6 animate-slide-up">
          <div className="text-6xl">{success.isPR ? '🏆' : '💪'}</div>
          <h2 className="heading-display text-4xl gradient-text">
            {success.isPR ? 'Novo Recorde!' : 'Treino Feito!'}
          </h2>
          <div className="flex items-center justify-center gap-2 text-brand-gold text-3xl font-black">
            <Zap size={28} />
            +{success.xpEarned} XP
          </div>
          {success.leveledUp && (
            <div className="text-brand-green font-bold text-lg animate-pulse">
              🎉 Level up!
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

        <div>
          <h1 className="heading-display text-4xl">Novo Treino</h1>
          <p className="text-text-secondary">Registre sua sessão e ganhe XP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            {entries.map((entry, i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">
                    Exercício {i + 1}
                  </span>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(i)}
                      className="text-text-muted hover:text-brand-red transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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
                    <label className="block text-xs text-text-muted">Peso (kg)</label>
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
                    <label className="block text-xs text-text-muted">Reps</label>
                    <input
                      type="number"
                      min="0"
                      value={entry.reps}
                      onChange={(e) => updateEntry(i, 'reps', e.target.value)}
                      className="input w-full text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-text-muted">Sets</label>
                    <input
                      type="number"
                      min="1"
                      value={entry.sets}
                      onChange={(e) => updateEntry(i, 'sets', e.target.value)}
                      className="input w-full text-center"
                      placeholder="1"
                    />
                  </div>
                </div>
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

          {/* XP preview */}
          <div className="card p-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Trophy size={16} className="text-brand-gold" />
              XP estimado desta sessão
            </div>
            <div className="font-bold text-brand-gold">+{estimatedXp} XP</div>
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
