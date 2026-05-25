'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react'

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
          className="btn-ghost flex-1 flex items-center justify-center gap-2 hover:border-brand-orange/40 hover:text-brand-orange transition-all"
        >
          <RefreshCw size={16} />
          Repetir treino
        </Link>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#EF4444',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
          }}
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Excluir</span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm p-6 space-y-5 rounded-2xl relative overflow-hidden animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(239,68,68,0.08)',
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <AlertTriangle size={20} style={{ color: '#EF4444' }} />
                </div>
                <h2 className="font-bold text-lg">Excluir treino?</h2>
              </div>
              <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                Esta ação não pode ser desfeita. O treino{' '}
                <strong className="text-white">{workoutTitle}</strong> e todos os seus
                sets serão removidos permanentemente.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="btn-ghost flex-1 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteWorkout}
                  disabled={deleting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
                  style={{
                    background: 'rgba(239,68,68,0.2)',
                    border: '1px solid rgba(239,68,68,0.5)',
                    color: '#EF4444',
                  }}
                >
                  {deleting ? 'Excluindo...' : 'Sim, excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
