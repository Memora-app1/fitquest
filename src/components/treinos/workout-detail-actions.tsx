'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExerciseEntry {
  exercise_name: string
  weight_kg: string
  reps: string
  sets: string
}

export function WorkoutDetailActions({
  workoutId,
  workoutTitle,
  exercises,
}: {
  workoutId: string
  workoutTitle: string
  exercises: ExerciseEntry[]
}) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function deleteWorkout() {
    setDeleting(true)
    const res = await fetch(`/api/treinos?id=${workoutId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/treinos')
      router.refresh()
    } else {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Build the "do again" URL with exercises pre-filled as query params
  const doAgainParams = new URLSearchParams()
  doAgainParams.set('title', workoutTitle)
  exercises.forEach((ex, i) => {
    doAgainParams.set(`ex${i}_name`, ex.exercise_name)
    if (ex.weight_kg) doAgainParams.set(`ex${i}_weight`, ex.weight_kg)
    if (ex.reps) doAgainParams.set(`ex${i}_reps`, ex.reps)
    if (ex.sets) doAgainParams.set(`ex${i}_sets`, ex.sets)
  })

  return (
    <>
      <div className="flex gap-3 pt-2">
        <Link
          href={`/treinos/novo?${doAgainParams.toString()}`}
          className="btn-ghost flex-1 flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Repetir treino
        </Link>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-ghost flex items-center gap-2 text-brand-red border-brand-red/30 hover:bg-brand-red/10 px-4"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Excluir</span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card-glow w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-brand-red">
              <AlertTriangle size={24} />
              <h2 className="font-bold text-lg">Excluir treino?</h2>
            </div>
            <p className="text-text-secondary text-sm">
              Esta ação não pode ser desfeita. O treino <strong className="text-white">{workoutTitle}</strong> e todos os seus sets serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={deleteWorkout}
                disabled={deleting}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl font-medium border transition-all text-sm',
                  'bg-brand-red/20 border-brand-red text-brand-red hover:bg-brand-red/30',
                  deleting && 'opacity-50 pointer-events-none'
                )}
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
