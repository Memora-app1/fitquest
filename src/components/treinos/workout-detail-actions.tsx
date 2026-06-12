'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface ExerciseEntry {
  exercise_name: string;
  weight_kg: string;
  reps: string;
  sets: string;
}

export function WorkoutDetailActions({
  workoutId,
  workoutTitle,
  exercises,
}: {
  workoutId: string;
  workoutTitle: string;
  exercises: ExerciseEntry[];
}) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useScrollLock(showDeleteConfirm);

  async function deleteWorkout() {
    setDeleting(true);
    const res = await fetch(`/api/treinos?id=${workoutId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/treinos');
      router.refresh();
    } else {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const doAgainParams = new URLSearchParams();
  doAgainParams.set('title', workoutTitle);
  exercises.forEach((ex, i) => {
    doAgainParams.set(`ex${i}_name`, ex.exercise_name);
    if (ex.weight_kg) doAgainParams.set(`ex${i}_weight`, ex.weight_kg);
    if (ex.reps) doAgainParams.set(`ex${i}_reps`, ex.reps);
    if (ex.sets) doAgainParams.set(`ex${i}_sets`, ex.sets);
  });

  return (
    <>
      <div className="flex gap-3 pt-2">
        <Link
          href={`/treinos/novo?${doAgainParams.toString()}`}
          className="btn-ghost flex flex-1 items-center justify-center gap-2 transition-all hover:border-brand-orange/40 hover:text-brand-orange"
        >
          <RefreshCw size={16} />
          Repetir treino
        </Link>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#EF4444',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
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
            className="relative w-full max-w-sm animate-slide-up space-y-5 overflow-hidden rounded-2xl p-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(239,68,68,0.08)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <div className="mb-1 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                  }}
                >
                  <AlertTriangle size={20} style={{ color: '#EF4444' }} />
                </div>
                <h2 className="text-lg font-bold">Excluir treino?</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Esta ação não pode ser desfeita. O treino{' '}
                <strong className="text-white">{workoutTitle}</strong> e todos os seus sets serão
                removidos permanentemente.
              </p>
              <div className="mt-5 flex gap-3">
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
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50"
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
  );
}
