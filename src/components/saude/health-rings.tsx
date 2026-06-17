/**
 * HealthRings — 3 anéis concêntricos estilo Apple Watch.
 * Anel externo: Sono, Médio: Água, Interno: Recovery.
 * Server component — todos os dados calculados no servidor.
 */

import { createClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils';
import { WATER_GOAL_ML, SLEEP_GOAL_H } from '@/lib/constants';

interface Ring {
  label: string;
  emoji: string;
  pct: number;
  color: string;
  rgb: string;
  value: string;
  sub: string;
  r: number; // raio SVG
}

function strokeDash(pct: number, r: number) {
  const circ = 2 * Math.PI * r;
  return { strokeDasharray: circ, strokeDashoffset: circ * (1 - Math.min(pct, 100) / 100) };
}

export async function HealthRings({ userId }: { userId: string }) {
  const supabase = await createClient();
  const today = todayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]!;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!;

  const [waterRes, sleepRes, workoutsRes, sleepAvgRes] = await Promise.all([
    supabase.from('water_logs').select('amount_ml').eq('user_id', userId).eq('date', today).limit(100),
    supabase
      .from('sleep_logs')
      .select('duration_hours, quality')
      .eq('user_id', userId)
      .eq('date', yesterday)
      .maybeSingle(),
    supabase
      .from('workouts')
      .select('started_at')
      .eq('user_id', userId)
      .gte('started_at', `${threeDaysAgo}T00:00:00`)
      .limit(20),
    supabase
      .from('sleep_logs')
      .select('duration_hours')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .limit(7),
  ]);

  // ── Água ──────────────────────────────────────────────────────────
  const waterTotal = (waterRes.data ?? []).reduce((s, r) => s + (r.amount_ml as number), 0);
  const waterPct = Math.min(100, Math.round((waterTotal / WATER_GOAL_ML) * 100));
  const waterLabel = waterTotal >= 1000 ? `${(waterTotal / 1000).toFixed(1)}L` : `${waterTotal}ml`;

  // ── Sono ──────────────────────────────────────────────────────────
  const sleepH = (sleepRes.data?.duration_hours as number | null) ?? null;
  const sleepPct = sleepH !== null ? Math.min(100, Math.round((sleepH / SLEEP_GOAL_H) * 100)) : 0;
  const sh = sleepH !== null ? Math.floor(sleepH) : null;
  const sm = sleepH !== null ? Math.round((sleepH - Math.floor(sleepH)) * 60) : null;
  const sleepLabel = sh !== null ? (sm === 0 ? `${sh}h` : `${sh}h${sm}m`) : '—';

  // ── Recovery (mesmo cálculo do RecoveryScore) ─────────────────────
  const sleepQuality = (sleepRes.data?.quality as number | null) ?? null;
  const sleepScore =
    sleepH !== null
      ? Math.round(
          Math.min(100, Math.round((sleepH / 8) * 100)) * 0.6 + (sleepQuality ?? 3) * 20 * 0.4
        )
      : 50;
  const waterYesterdayRes = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', userId)
    .eq('date', yesterday)
    .limit(100);
  const waterYest = (waterYesterdayRes.data ?? []).reduce((s, r) => s + (r.amount_ml as number), 0);
  const waterScore =
    waterYest > 0 ? Math.min(100, Math.round((waterYest / WATER_GOAL_ML) * 100)) : 0;
  const wkLast1 = (workoutsRes.data ?? []).filter(
    (w) => w.started_at >= `${yesterday}T00:00:00`
  ).length;
  const wkLast3 = (workoutsRes.data ?? []).length;
  const restScore = wkLast1 >= 1 ? 40 : wkLast3 >= 2 ? 60 : 90;
  const sleepLogs7d = (sleepAvgRes.data ?? []).filter(
    (l) => (l.duration_hours as number | null) !== null
  );
  const goodNights = sleepLogs7d.filter((l) => (l.duration_hours as number) >= 7).length;
  const consistScore =
    sleepLogs7d.length >= 3 ? Math.round((goodNights / sleepLogs7d.length) * 100) : 50;
  const recoveryPct = Math.round(
    sleepScore * 0.35 + waterScore * 0.25 + restScore * 0.25 + consistScore * 0.15
  );

  const recoveryLabel = recoveryPct >= 75 ? 'Ótimo' : recoveryPct >= 50 ? 'Moderado' : 'Baixo';
  const recoveryColor = recoveryPct >= 75 ? '#00FF88' : recoveryPct >= 50 ? '#F5C842' : '#00D9FF';
  const recoveryRgb =
    recoveryPct >= 75 ? '0,255,136' : recoveryPct >= 50 ? '245,200,66' : '0,217,255';

  const rings: Ring[] = [
    {
      label: 'Sono',
      emoji: '🌙',
      pct: sleepPct,
      color: '#7C3AED',
      rgb: '124,58,237',
      value: sleepLabel,
      sub: `meta ${SLEEP_GOAL_H}h`,
      r: 78,
    },
    {
      label: 'Água',
      emoji: '💧',
      pct: waterPct,
      color: '#00D9FF',
      rgb: '0,217,255',
      value: waterLabel,
      sub: 'meta 2L',
      r: 58,
    },
    {
      label: 'Recovery',
      emoji: '⚡',
      pct: recoveryPct,
      color: recoveryColor,
      rgb: recoveryRgb,
      value: `${recoveryPct}%`,
      sub: recoveryLabel,
      r: 38,
    },
  ];

  const noData = sleepH === null && waterTotal === 0;

  return (
    <div
      className="relative animate-fade-in overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 55%, rgba(0,217,255,0.05) 100%)',
        border: '1px solid rgba(124,58,237,0.2)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(124,58,237,0.08)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-5 flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
          >
            <span className="text-[10px]">🏥</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Anéis de Saúde
          </span>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          {/* SVG rings */}
          <div className="relative shrink-0" style={{ width: 176, height: 176 }}>
            <svg width="176" height="176" style={{ overflow: 'visible' }}>
              {rings.map((ring) => {
                const { strokeDasharray, strokeDashoffset } = strokeDash(ring.pct, ring.r);
                return (
                  <g key={ring.label}>
                    {/* Track */}
                    <circle
                      cx="88"
                      cy="88"
                      r={ring.r}
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="10"
                    />
                    {/* Fill */}
                    <circle
                      cx="88"
                      cy="88"
                      r={ring.r}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 88 88)"
                      style={{
                        filter: `drop-shadow(0 0 6px ${ring.color}60)`,
                        transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              {noData ? (
                <span className="text-2xl">🏃</span>
              ) : (
                <>
                  <span className="text-[9px] uppercase tracking-widest text-text-muted">hoje</span>
                  <span
                    className="heading-display text-lg leading-none"
                    style={{ color: '#00FF88' }}
                  >
                    {Math.round((waterPct + sleepPct + recoveryPct) / 3)}%
                  </span>
                  <span className="text-[9px] text-text-muted">saúde</span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3.5">
            {rings.map((ring) => (
              <div key={ring.label} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base"
                  style={{
                    background: `rgba(${ring.rgb},0.12)`,
                    border: `1px solid rgba(${ring.rgb},0.25)`,
                    boxShadow: `0 0 10px rgba(${ring.rgb},0.15)`,
                  }}
                >
                  {ring.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-text-secondary">{ring.label}</span>
                    <span className="text-sm font-black" style={{ color: ring.color }}>
                      {ring.value}
                    </span>
                  </div>
                  <div
                    className="h-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${ring.pct}%`, backgroundColor: ring.color, opacity: 0.9 }}
                    />
                  </div>
                  <div className="mt-0.5 flex justify-between text-[9px] text-text-muted">
                    <span>{ring.sub}</span>
                    <span>{ring.pct}%</span>
                  </div>
                </div>
              </div>
            ))}

            {noData && (
              <p className="text-xs text-text-muted">
                Registre sono e água para ver seus anéis preenchidos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
