import { createClient } from '@/lib/supabase/server';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

interface SetRow {
  weight_kg: number | null;
  reps: number | null;
  is_warmup: boolean;
  is_personal_record: boolean;
  created_at: string;
  exercises: {
    id: string;
    name: string;
    muscle_group: string;
  } | null;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#FF4D00',
  back: '#7C3AED',
  legs: '#00FF88',
  shoulders: '#F5C842',
  arms: '#3B82F6',
  core: '#EC4899',
  cardio: '#00D9FF',
  full_body: '#8B5CF6',
};

export async function WorkoutPrsWidget({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 56 * 86400000).toISOString();

  const { data: raw } = await supabase
    .from('workout_sets')
    .select(
      'weight_kg, reps, is_warmup, is_personal_record, created_at, exercises(id, name, muscle_group)'
    )
    .eq('user_id', userId)
    .eq('is_warmup', false)
    .gt('weight_kg', 0)
    .gte('created_at', eightWeeksAgo)
    .order('created_at', { ascending: false })
    .limit(2000);

  const rows = (raw ?? []) as unknown as SetRow[];
  if (rows.length === 0) return null;

  // Find best weight per exercise in 8-week window
  const bestByExercise = new Map<
    string,
    { name: string; muscle: string; weight: number; reps: number; date: string }
  >();

  for (const r of rows) {
    if (!r.exercises?.id || r.is_warmup) continue;
    const id = r.exercises.id;
    const w = Number(r.weight_kg ?? 0);
    const existing = bestByExercise.get(id);
    if (
      !existing ||
      w > existing.weight ||
      (w === existing.weight && Number(r.reps ?? 0) > existing.reps)
    ) {
      bestByExercise.set(id, {
        name: r.exercises.name,
        muscle: r.exercises.muscle_group,
        weight: w,
        reps: Number(r.reps ?? 0),
        date: r.created_at.split('T')[0]!,
      });
    }
  }

  const recent_pr_count = rows.filter((r) => r.is_personal_record).length;

  const topPRs = Array.from(bestByExercise.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  if (topPRs.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.14)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-3xl"
        style={{ background: 'rgba(245,200,66,0.07)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(245,200,66,0.14)',
                border: '1px solid rgba(245,200,66,0.26)',
              }}
            >
              <Trophy size={12} style={{ color: '#F5C842' }} />
            </div>
            <div>
              <div className="text-sm font-black">Top PRs (8 semanas)</div>
              {recent_pr_count > 0 && (
                <div className="text-[10px] text-text-muted">
                  {recent_pr_count} recordes batidos
                </div>
              )}
            </div>
          </div>
          <Link
            href="/treinos"
            className="text-[10px] text-text-muted transition-colors hover:text-brand-gold"
          >
            Ver tudo →
          </Link>
        </div>

        {/* PRs List */}
        <div className="space-y-2">
          {topPRs.map((pr, i) => {
            const color = MUSCLE_COLORS[pr.muscle] ?? '#8899BB';
            return (
              <div
                key={pr.name}
                className="flex items-center gap-3 rounded-xl p-2.5"
                style={{
                  background: i === 0 ? 'rgba(245,200,66,0.07)' : 'rgba(255,255,255,0.025)',
                  border:
                    i === 0
                      ? '1px solid rgba(245,200,66,0.15)'
                      : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                  style={{
                    background: i === 0 ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)',
                    color: i === 0 ? '#F5C842' : '#5A6B8A',
                  }}
                >
                  {i === 0 ? '🏆' : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold">{pr.name}</div>
                  <div className="mt-0.5 text-[9px]" style={{ color }}>
                    {pr.muscle.replace('_', ' ')}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-black" style={{ color: '#F5C842' }}>
                    {pr.weight}kg
                  </div>
                  <div className="text-[9px] text-text-muted">×{pr.reps}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
