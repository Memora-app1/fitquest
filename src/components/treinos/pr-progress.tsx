import { createClient } from '@/lib/supabase/server';
import { TrendingUp, Trophy } from 'lucide-react';

interface SetRow {
  exercise_id: string;
  weight_kg: number;
  created_at: string;
  exercises: { name: string } | null;
}

interface ExerciseStats {
  id: string;
  name: string;
  currentPR: number;
  firstWeight: number;
  improvement: number; // %
  sessions: number;
  points: { date: string; weight: number }[]; // sorted by date
}

function buildSparklinePath(points: { weight: number }[], width: number, height: number): string {
  if (points.length < 2) return '';
  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p.weight - minW) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildAreaPath(points: { weight: number }[], width: number, height: number): string {
  if (points.length < 2) return '';
  const line = buildSparklinePath(points, width, height);
  const lastX = ((points.length - 1) / (points.length - 1)) * width;
  return `${line} L ${lastX.toFixed(1)} ${height} L 0 ${height} Z`;
}

export async function PrProgress({ userId }: { userId: string }) {
  const supabase = await createClient();

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  const { data: raw } = await supabase
    .from('workout_sets')
    .select('exercise_id, weight_kg, created_at, exercises(name)')
    .eq('user_id', userId)
    .gt('weight_kg', 0)
    .gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: true })
    .limit(2000);

  if (!raw || raw.length === 0) return null;

  const sets = raw as unknown as SetRow[];

  // Group by exercise, aggregate daily max weight
  const exerciseMap = new Map<string, { name: string; dailyMax: Map<string, number> }>();

  for (const s of sets) {
    if (!s.exercises?.name) continue;
    const existing = exerciseMap.get(s.exercise_id);
    if (!existing) {
      exerciseMap.set(s.exercise_id, {
        name: s.exercises.name,
        dailyMax: new Map([[s.created_at.split('T')[0]!, s.weight_kg]]),
      });
    } else {
      const day = s.created_at.split('T')[0]!;
      const prev = existing.dailyMax.get(day) ?? 0;
      if (s.weight_kg > prev) existing.dailyMax.set(day, s.weight_kg);
    }
  }

  // Build stats per exercise
  const stats: ExerciseStats[] = [];
  for (const [id, { name, dailyMax }] of exerciseMap.entries()) {
    const sortedEntries = [...dailyMax.entries()].sort(([a], [b]) => a.localeCompare(b));
    if (sortedEntries.length < 2) continue;

    const weights = sortedEntries.map(([, w]) => w);
    const currentPR = Math.max(...weights);
    const firstWeight = weights[0]!;
    const improvement =
      firstWeight > 0 ? Math.round(((currentPR - firstWeight) / firstWeight) * 100) : 0;

    stats.push({
      id,
      name,
      currentPR,
      firstWeight,
      improvement,
      sessions: sortedEntries.length,
      points: sortedEntries.map(([date, weight]) => ({ date, weight })),
    });
  }

  if (stats.length === 0) return null;

  // Sort by currentPR descending, take top 6
  const top = stats.sort((a, b) => b.currentPR - a.currentPR).slice(0, 6);

  // Overall improvement stats
  const improved = top.filter((e) => e.improvement > 0).length;
  const avgImprovement =
    top.length > 0
      ? Math.round(
          top.filter((e) => e.improvement > 0).reduce((s, e) => s + e.improvement, 0) /
            Math.max(1, improved)
        )
      : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
        border: '1px solid rgba(0,255,136,0.14)',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(0,255,136,0.07)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(0,255,136,0.12)',
                  border: '1px solid rgba(0,255,136,0.22)',
                }}
              >
                <TrendingUp size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Progressão de PRs
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Últimos 90 dias</h2>
            <p className="mt-0.5 text-sm text-text-muted">Evolução de carga por exercício</p>
          </div>

          {/* Overall improvement badge */}
          {avgImprovement > 0 && (
            <div
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.2)',
                color: '#00FF88',
              }}
            >
              <Trophy size={12} />
              <span>
                Força crescendo <span className="font-black">+{avgImprovement}% avg</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Exercise cards with sparklines ──────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {top.map((exercise, idx) => {
            const isFirst = idx === 0;
            const accentColor = isFirst
              ? '#F5C842'
              : exercise.improvement > 15
                ? '#00FF88'
                : exercise.improvement > 0
                  ? '#7C3AED'
                  : '#8899BB';

            const SPARK_W = 100;
            const SPARK_H = 32;
            const linePath = buildSparklinePath(exercise.points, SPARK_W, SPARK_H);
            const areaPath = buildAreaPath(exercise.points, SPARK_W, SPARK_H);

            return (
              <div
                key={exercise.id}
                className="relative overflow-hidden rounded-xl p-4"
                style={{
                  background: `linear-gradient(135deg, ${isFirst ? 'rgba(245,200,66,0.06)' : 'rgba(255,255,255,0.025)'} 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid ${isFirst ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {/* Subtle glow */}
                {isFirst && (
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                    style={{ background: 'rgba(245,200,66,0.15)' }}
                  />
                )}

                <div className="relative z-10 flex items-start gap-3">
                  {/* Rank badge */}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                    style={{
                      background: `${accentColor}18`,
                      border: `1px solid ${accentColor}30`,
                      color: accentColor,
                    }}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold leading-snug">
                          {exercise.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-text-muted">
                          {exercise.sessions} sessões · de {exercise.firstWeight}kg
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className="text-lg font-black leading-none"
                          style={{ color: accentColor }}
                        >
                          {exercise.currentPR}kg
                        </div>
                        {exercise.improvement !== 0 && (
                          <div
                            className="text-[10px] font-bold"
                            style={{ color: exercise.improvement > 0 ? '#00FF88' : '#EF4444' }}
                          >
                            {exercise.improvement > 0 ? '+' : ''}
                            {exercise.improvement}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inline SVG sparkline */}
                    {exercise.points.length >= 2 && (
                      <svg
                        width="100%"
                        viewBox={`0 0 ${SPARK_W} ${SPARK_H + 4}`}
                        preserveAspectRatio="none"
                        style={{ height: 36 }}
                      >
                        <defs>
                          <linearGradient
                            id={`sparkGrad-${exercise.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        {/* Area fill */}
                        <path d={areaPath} fill={`url(#sparkGrad-${exercise.id})`} />
                        {/* Line */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke={accentColor}
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Last point dot */}
                        {(() => {
                          const lastPt = exercise.points[exercise.points.length - 1]!;
                          const weights = exercise.points.map((p) => p.weight);
                          const minW = Math.min(...weights);
                          const maxW = Math.max(...weights);
                          const range = maxW - minW || 1;
                          const cy = SPARK_H - ((lastPt.weight - minW) / range) * SPARK_H;
                          return (
                            <circle
                              cx={SPARK_W}
                              cy={cy}
                              r={3}
                              fill={accentColor}
                              stroke="rgba(13,24,41,0.98)"
                              strokeWidth={1.5}
                            />
                          );
                        })()}
                      </svg>
                    )}

                    {/* Progress bar showing improvement */}
                    {exercise.improvement > 0 && (
                      <div
                        className="h-1 overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, exercise.improvement * 2)}%`,
                            background: accentColor,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer insight ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span className="shrink-0 text-xl">
            {improved >= 4 ? '🔥' : improved >= 2 ? '💪' : '⚡'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {improved >= 4
                ? `${improved} exercícios ficaram mais fortes nos últimos 90 dias!`
                : improved >= 2
                  ? `${improved} exercícios com PR melhorado — progresso real.`
                  : improved === 1
                    ? '1 exercício com PR melhorado — continue aumentando!'
                    : 'Registre mais treinos para ver sua progressão de força.'}
            </p>
            {top[0] && top[0].improvement > 0 && (
              <p className="mt-0.5 text-[11px] text-text-muted">
                Maior evolução:{' '}
                <span className="font-bold" style={{ color: '#F5C842' }}>
                  {top.sort((a, b) => b.improvement - a.improvement)[0]!.name} +
                  {top.sort((a, b) => b.improvement - a.improvement)[0]!.improvement}%
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
