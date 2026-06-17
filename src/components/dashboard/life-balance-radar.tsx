import { createClient } from '@/lib/supabase/server';
import { Sparkles } from 'lucide-react';
import { WATER_GOAL_ML } from '@/lib/constants';

export async function LifeBalanceRadar({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]!;
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]!;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]!;

  const [
    habitsRes,
    habitLogsRes,
    tasksRes,
    workoutsRes,
    txRes,
    profileRes,
    waterLogsRes,
    sleepLogsRes,
  ] = await Promise.all([
    // Active habits count
    supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true),
    // Habit logs last 7 days
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', sevenDaysAgo)
      .lte('logged_date', todayStr),
    // Tasks completed last 7 days
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', new Date(now.getTime() - 7 * 86400000).toISOString()),
    // Workouts last 30 days
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(now.getTime() - 30 * 86400000).toISOString()),
    // Finance: paid transactions last 30 days (active management)
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_paid', true)
      .gte('transaction_date', thirtyDaysAgo),
    // Profile for XP and streak
    supabase.from('profiles').select('xp_total, level, streak_current').eq('id', userId).single(),
    // Water logs last 7 days
    supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .lte('date', todayStr)
      .limit(500),
    // Sleep logs last 7 days
    supabase
      .from('sleep_logs')
      .select('date, duration_hours')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .lte('date', todayStr)
      .limit(7),
  ]);

  const activeHabits = habitsRes.count ?? 0;
  const habitLogs = habitLogsRes.data ?? [];
  const tasksCompleted = tasksRes.count ?? 0;
  const workoutsCount = workoutsRes.count ?? 0;
  const txCount = txRes.count ?? 0;
  const profile = profileRes.data;

  // Water score: days reaching goal in last 7 days
  const waterByDay: Record<string, number> = {};
  for (const row of waterLogsRes.data ?? []) {
    const d = row.date as string;
    waterByDay[d] = (waterByDay[d] ?? 0) + ((row.amount_ml as number) ?? 0);
  }
  const waterGoalDays = Object.values(waterByDay).filter((v) => v >= WATER_GOAL_ML).length;

  // Sleep score: avg nights with 7h+ in last 7 days
  const sleepLogs = sleepLogsRes.data ?? [];
  const goodSleepDays = sleepLogs.filter(
    (l) => (l.duration_hours as number | null) !== null && (l.duration_hours as number) >= 7
  ).length;
  const sleepLogged = sleepLogs.length > 0;

  // Health score: combined water + sleep (each 50%)
  const waterScore = Math.round((waterGoalDays / 7) * 100);
  const sleepScore = sleepLogged ? Math.round((goodSleepDays / 7) * 100) : 0;
  const healthScore =
    sleepLogged || waterGoalDays > 0 ? Math.round((waterScore + sleepScore) / 2) : 0;

  // ── Score computation (0-100 each) ──────────────────────────────

  // HÁBITOS score: avg completion rate this week
  let habitScore = 0;
  if (activeHabits > 0) {
    const daysInRange = 7;
    const totalSlots = activeHabits * daysInRange;
    const uniqueLogs = new Set(habitLogs.map((l) => `${l.habit_id}::${l.logged_date}`)).size;
    habitScore = Math.min(100, Math.round((uniqueLogs / totalSlots) * 100));
  }

  // FITNESS score: workouts per month (target: 12-16 = 100)
  const fitnessScore = Math.min(100, Math.round((workoutsCount / 16) * 100));

  // PRODUTIVIDADE score: tasks completed per week (target: 10 = 100)
  const productivityScore = Math.min(100, Math.round((tasksCompleted / 10) * 100));

  // FINANÇAS score: transactions tracked per month (target: 20+ = 100)
  const financeScore = Math.min(100, Math.round((txCount / 20) * 100));

  // STREAK bonus: if streak ≥ 7, adds to all scores slightly
  const streak = profile?.streak_current ?? 0;
  const streakBonus = Math.min(10, Math.floor(streak / 7) * 5);

  const scores = [
    {
      label: 'Hábitos',
      value: Math.min(100, habitScore + (habitScore > 0 ? streakBonus : 0)),
      color: '#FF4D00',
      rgb: '255,77,0',
    },
    {
      label: 'Fitness',
      value: Math.min(100, fitnessScore + (fitnessScore > 0 ? streakBonus : 0)),
      color: '#00FF88',
      rgb: '0,255,136',
    },
    {
      label: 'Produtividade',
      value: Math.min(100, productivityScore),
      color: '#7C3AED',
      rgb: '124,58,237',
    },
    { label: 'Finanças', value: Math.min(100, financeScore), color: '#F5C842', rgb: '245,200,66' },
    { label: 'Saúde', value: healthScore, color: '#00D9FF', rgb: '0,217,255' },
  ];

  const avgScore = Math.round(scores.reduce((s, d) => s + d.value, 0) / scores.length);
  const weakest = scores.reduce((min, s) => (s.value < min.value ? s : min));
  const strongest = scores.reduce((max, s) => (s.value > max.value ? s : max));

  // ── SVG Radar chart (4 axes) ─────────────────────────────────────
  const cx = 100;
  const cy = 100;
  const maxR = 78;
  const n = scores.length;

  // Compute axis endpoints (top=0, then clockwise)
  const angles = scores.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);

  function axisPoint(i: number, r: number): [number, number] {
    return [cx + r * Math.cos(angles[i]!), cy + r * Math.sin(angles[i]!)];
  }

  // Grid rings at 25%, 50%, 75%, 100%
  const gridRings = [25, 50, 75, 100];

  function polygonPoints(r: number): string {
    return angles.map((_, i) => axisPoint(i, r).join(',')).join(' ');
  }

  // Data polygon
  const dataPoints = scores.map((s, i) => axisPoint(i, (s.value / 100) * maxR));
  const dataPolygon = dataPoints.map((p) => p.join(',')).join(' ');

  // Label positions (slightly outside the max ring)
  const labelR = maxR + 16;

  if (avgScore === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(245,200,66,0.06)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(245,200,66,0.14)',
                  border: '1px solid rgba(245,200,66,0.26)',
                }}
              >
                <Sparkles size={12} style={{ color: '#F5C842' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Equilíbrio de vida
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Life Balance Score</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Baseado nos últimos 7-30 dias de atividade
            </p>
          </div>

          <div className="text-right">
            <div
              className="text-4xl font-black"
              style={{
                color: avgScore >= 75 ? '#00FF88' : avgScore >= 50 ? '#F5C842' : '#FF4D00',
              }}
            >
              {avgScore}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">score global</div>
          </div>
        </div>

        {/* ── Radar SVG + scores ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {/* SVG Radar */}
          <svg
            viewBox="0 0 200 200"
            className="shrink-0"
            style={{ width: '180px', height: '180px' }}
          >
            {/* Grid rings */}
            {gridRings.map((pct) => (
              <polygon
                key={pct}
                points={polygonPoints((pct / 100) * maxR)}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />
            ))}

            {/* Axes */}
            {angles.map((_, i) => {
              const [x, y] = axisPoint(i, maxR);
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Data polygon fill */}
            <polygon
              points={dataPolygon}
              fill="rgba(245,200,66,0.12)"
              stroke="rgba(245,200,66,0.6)"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {dataPoints.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={scores[i]!.color}
                stroke="rgba(13,24,41,0.8)"
                strokeWidth="1.5"
              />
            ))}

            {/* Axis labels */}
            {scores.map((s, i) => {
              const [lx, ly] = axisPoint(i, labelR);
              const isLeft = lx < cx - 5;
              const isRight = lx > cx + 5;
              return (
                <text
                  key={i}
                  x={lx}
                  y={ly}
                  textAnchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
                  dominantBaseline="middle"
                  fill={s.color}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {s.label}
                </text>
              );
            })}

            {/* Center score */}
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fill={avgScore >= 75 ? '#00FF88' : avgScore >= 50 ? '#F5C842' : '#FF4D00'}
              fontSize="18"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              {avgScore}
            </text>
            <text
              x={cx}
              y={cy + 9}
              textAnchor="middle"
              fill="rgba(136,153,187,0.8)"
              fontSize="7"
              fontFamily="sans-serif"
            >
              SCORE
            </text>
          </svg>

          {/* Score bars */}
          <div className="min-w-[160px] flex-1 space-y-3">
            {scores.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: s.color }}>
                    {s.label}
                  </span>
                  <span className="text-xs font-black" style={{ color: s.color }}>
                    {s.value}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${s.value}%`,
                      background: `linear-gradient(90deg, rgba(${s.rgb},0.9), rgba(${s.rgb},0.5))`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(245,200,66,0.04)',
            border: '1px solid rgba(245,200,66,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {avgScore >= 80 ? '🌟' : avgScore >= 60 ? '⚡' : '🎯'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {avgScore >= 80
                ? `Score ${avgScore}/100 — vida equilibrada! Continue assim.`
                : avgScore >= 60
                  ? `Score ${avgScore}/100. Você está bem, mas há espaço para crescer.`
                  : `Score ${avgScore}/100. Foque em recuperar o equilíbrio.`}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {weakest.value < 40
                ? `Maior oportunidade: ${weakest.label} (${weakest.value}/100). Dedique atenção a esta área.`
                : strongest.value >= 80
                  ? `Destaque: ${strongest.label} (${strongest.value}/100). Mantenha este ritmo!`
                  : `Área mais forte: ${strongest.label} (${strongest.value}/100).`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
