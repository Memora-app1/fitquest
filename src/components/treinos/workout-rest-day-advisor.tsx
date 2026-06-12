import { createClient } from '@/lib/supabase/server';
import { Activity, Zap, Clock, CheckCircle2 } from 'lucide-react';

interface SetRow {
  weight_kg: number | null;
  reps: number | null;
  sets_count?: number;
  is_warmup: boolean;
  created_at: string;
  exercises: {
    muscle_group: string;
    name: string;
  } | null;
}

const MUSCLE_META: Record<
  string,
  {
    label: string;
    emoji: string;
    color: string;
    rgb: string;
    recoveryHours: number; // typical full recovery time
    antagonist?: string; // can train with this muscle
  }
> = {
  chest: {
    label: 'Peito',
    emoji: '💪',
    color: '#FF4D00',
    rgb: '255,77,0',
    recoveryHours: 48,
    antagonist: 'back',
  },
  back: {
    label: 'Costas',
    emoji: '🔙',
    color: '#7C3AED',
    rgb: '124,58,237',
    recoveryHours: 48,
    antagonist: 'chest',
  },
  legs: { label: 'Pernas', emoji: '🦵', color: '#00FF88', rgb: '0,255,136', recoveryHours: 72 },
  shoulders: {
    label: 'Ombros',
    emoji: '🎯',
    color: '#F5C842',
    rgb: '245,200,66',
    recoveryHours: 48,
  },
  arms: { label: 'Braços', emoji: '💪', color: '#3B82F6', rgb: '59,130,246', recoveryHours: 36 },
  core: { label: 'Core', emoji: '⚡', color: '#EC4899', rgb: '236,72,153', recoveryHours: 24 },
  cardio: { label: 'Cardio', emoji: '🏃', color: '#00D9FF', rgb: '0,217,255', recoveryHours: 24 },
  full_body: {
    label: 'Corpo todo',
    emoji: '🏋️',
    color: '#8B5CF6',
    rgb: '139,92,246',
    recoveryHours: 72,
  },
};

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

function hoursAgo(dateStr: string, now: Date): number {
  return (now.getTime() - new Date(dateStr).getTime()) / 3600000;
}

export async function WorkoutRestDayAdvisor({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  const { data: raw } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, is_warmup, created_at, exercises(muscle_group, name)')
    .eq('user_id', userId)
    .eq('is_warmup', false)
    .gte('created_at', fourteenDaysAgo)
    .order('created_at', { ascending: false });

  const rows = (raw ?? []) as unknown as SetRow[];
  if (rows.length === 0) return null;

  // Per muscle group: find last trained datetime + volume in last 7 days
  interface MuscleStatus {
    muscle: string;
    lastTrainedAt: string | null; // ISO datetime string
    hoursRested: number; // hours since last session
    recoveryHours: number;
    recoveryPct: number; // 0-100 (100 = fully recovered)
    volume7d: number; // total sets (not weighted) in last 7 days
    status: 'ready' | 'recovering' | 'fresh';
    recommendation: string;
  }

  const muscleLastTrained = new Map<string, string>(); // muscle → last created_at
  const muscleVolume7d = new Map<string, number>();

  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  for (const r of rows) {
    const muscle = r.exercises?.muscle_group ?? 'full_body';
    if (!muscleLastTrained.has(muscle)) {
      muscleLastTrained.set(muscle, r.created_at);
    }
    if (r.created_at >= sevenDaysAgo) {
      muscleVolume7d.set(muscle, (muscleVolume7d.get(muscle) ?? 0) + 1);
    }
  }

  const statuses: MuscleStatus[] = Object.keys(MUSCLE_META)
    .map((muscle) => {
      const meta = MUSCLE_META[muscle]!;
      const lastTrainedAt = muscleLastTrained.get(muscle) ?? null;
      const hoursRested = lastTrainedAt ? hoursAgo(lastTrainedAt, now) : 999;
      const recoveryPct = lastTrainedAt
        ? Math.min(100, Math.round((hoursRested / meta.recoveryHours) * 100))
        : 100;
      const volume7d = muscleVolume7d.get(muscle) ?? 0;

      let status: MuscleStatus['status'] = 'fresh';
      if (lastTrainedAt) {
        status = recoveryPct >= 100 ? 'ready' : 'recovering';
      }

      let recommendation = '';
      if (status === 'fresh') {
        recommendation = 'Não treinado recentemente — ótimo para começar!';
      } else if (status === 'recovering') {
        const hoursLeft = Math.round(meta.recoveryHours - hoursRested);
        recommendation = `Em recuperação — ${hoursLeft}h para recuperação total`;
      } else {
        if (volume7d >= 10) {
          recommendation = 'Recuperado, mas volume alto esta semana. Modere.';
        } else {
          recommendation = 'Totalmente recuperado e pronto para treinar!';
        }
      }

      return {
        muscle,
        lastTrainedAt,
        hoursRested: Math.round(hoursRested),
        recoveryHours: meta.recoveryHours,
        recoveryPct,
        volume7d,
        status,
        recommendation,
      };
    })
    .filter((s) => s.lastTrainedAt !== null || s.volume7d > 0 || s.recoveryPct < 100);

  // Only show muscles that have been trained in 14 days
  const trainedMuscles = statuses.filter((s) => s.lastTrainedAt !== null);

  if (trainedMuscles.length === 0) return null;

  // Sort: recovering first (most tired), then ready, then fresh
  trainedMuscles.sort((a, b) => {
    if (a.status === 'recovering' && b.status !== 'recovering') return -1;
    if (b.status === 'recovering' && a.status !== 'recovering') return 1;
    return a.recoveryPct - b.recoveryPct;
  });

  const readyCount = trainedMuscles.filter((s) => s.status === 'ready').length;
  const recoveringCount = trainedMuscles.filter((s) => s.status === 'recovering').length;

  // Today's recommendation
  const readyMuscles = trainedMuscles.filter((s) => s.status === 'ready');
  const todayRecommendation =
    readyMuscles.length >= 2
      ? readyMuscles
          .slice(0, 3)
          .map((s) => MUSCLE_META[s.muscle]!.label)
          .join(' + ')
      : readyMuscles.length === 1
        ? `Foco em ${MUSCLE_META[readyMuscles[0]!.muscle]!.label}`
        : recoveringCount > 0
          ? 'Dia de descanso ou cardio leve recomendado'
          : 'Todos os grupos treinados — dia de descanso';

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,217,255,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
        border: '1px solid rgba(0,217,255,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(0,217,255,0.05)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(0,217,255,0.12)',
                  border: '1px solid rgba(0,217,255,0.22)',
                }}
              >
                <Activity size={12} style={{ color: '#00D9FF' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Recuperação muscular
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Advisor de Descanso</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {readyCount} grupo{readyCount !== 1 ? 's' : ''} recuperado
              {readyCount !== 1 ? 's' : ''} · {recoveringCount} em recuperação
            </p>
          </div>

          {/* Today's suggestion */}
          <div
            className="flex flex-col items-end gap-0.5 rounded-xl px-3 py-2 text-right"
            style={{
              background: readyCount >= 2 ? 'rgba(0,255,136,0.08)' : 'rgba(245,200,66,0.07)',
              border:
                readyCount >= 2
                  ? '1px solid rgba(0,255,136,0.2)'
                  : '1px solid rgba(245,200,66,0.18)',
            }}
          >
            <div className="text-[9px] uppercase tracking-wider text-text-muted">Treinar hoje</div>
            <div
              className="max-w-[140px] text-right text-xs font-bold"
              style={{ color: readyCount >= 2 ? '#00FF88' : '#F5C842' }}
            >
              {todayRecommendation}
            </div>
          </div>
        </div>

        {/* ── Muscle Recovery Status ────────────────────────────────────── */}
        <div className="space-y-3">
          {trainedMuscles.map((s) => {
            const meta = MUSCLE_META[s.muscle]!;
            const isReady = s.status === 'ready';
            const daysSince = s.lastTrainedAt
              ? Math.round(hoursAgo(s.lastTrainedAt, now) / 24)
              : null;

            return (
              <div
                key={s.muscle}
                className="rounded-xl p-3"
                style={{
                  background: isReady ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.025)',
                  border: isReady
                    ? '1px solid rgba(0,255,136,0.12)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Emoji + name */}
                  <div className="flex w-28 shrink-0 items-center gap-2">
                    <span className="text-base">{meta.emoji}</span>
                    <div>
                      <div className="text-xs font-bold">{meta.label}</div>
                      {daysSince !== null && (
                        <div className="text-[9px] text-text-muted">
                          {daysSince === 0 ? 'hoje' : `${daysSince}d atrás`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recovery bar */}
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: isReady ? '#00FF88' : '#F5C842' }}
                      >
                        {isReady ? '✓ Recuperado' : `${s.recoveryPct}%`}
                      </span>
                      <span className="text-[9px] text-text-muted">
                        {s.volume7d > 0 ? `${s.volume7d} séries/7d` : ''}
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${s.recoveryPct}%`,
                          background: isReady
                            ? 'linear-gradient(90deg, #00FF88, rgba(0,255,136,0.6))'
                            : `linear-gradient(90deg, rgba(${meta.rgb},0.8), rgba(${meta.rgb},0.4))`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status icon */}
                  <div className="shrink-0">
                    {isReady ? (
                      <CheckCircle2 size={16} style={{ color: '#00FF88' }} />
                    ) : (
                      <Clock size={16} style={{ color: '#F5C842' }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Recovery Key ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <div className="text-xl font-black text-brand-green">{readyCount}</div>
            <div className="mt-0.5 text-[9px] text-text-muted">Recuperados</div>
          </div>
          <div
            className="rounded-xl p-2.5 text-center"
            style={{
              background: 'rgba(245,200,66,0.06)',
              border: '1px solid rgba(245,200,66,0.12)',
            }}
          >
            <div className="text-xl font-black text-brand-gold">{recoveringCount}</div>
            <div className="mt-0.5 text-[9px] text-text-muted">Recuperando</div>
          </div>
          <div
            className="rounded-xl p-2.5 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="text-xl font-black text-white">{trainedMuscles.length}</div>
            <div className="mt-0.5 text-[9px] text-text-muted">Monitorados</div>
          </div>
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(0,217,255,0.04)',
            border: '1px solid rgba(0,217,255,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {recoveringCount === 0 ? '💪' : recoveringCount > readyCount ? '🛌' : '⚡'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {recoveringCount === 0 && readyCount > 0
                ? 'Todos os grupos musculares estão recuperados. Hora de treinar!'
                : recoveringCount > readyCount
                  ? `${recoveringCount} grupos ainda em recuperação. Priorize descanso ou cardio leve.`
                  : `${readyCount} grupos prontos para treinar. Aproveite o momento!`}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              Baseado nos treinos registrados nos últimos 14 dias. Tempos estimados: core 24h ·
              braços 36h · peito/costas 48h · pernas 72h.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
