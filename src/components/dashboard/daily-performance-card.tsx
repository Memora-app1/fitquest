import { createClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils';
import { Zap, Droplets, Moon, Flame, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { WATER_GOAL_ML } from '@/lib/constants';

type PerfState = 'great' | 'good' | 'alert';

interface PerfConfig {
  label: string;
  emoji: string;
  color: string;
  rgb: string;
  bg: string;
  border: string;
  glow: string;
  phrase: string;
  sub: string;
}

const PERF_CONFIG: Record<PerfState, PerfConfig> = {
  great: {
    label: 'ÓTIMO',
    emoji: '⚡',
    color: '#00FF88',
    rgb: '0,255,136',
    bg: 'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(13,24,41,0.98) 60%, rgba(0,217,255,0.06) 100%)',
    border: 'rgba(0,255,136,0.3)',
    glow: 'rgba(0,255,136,0.15)',
    phrase: 'Você está no modo elite hoje.',
    sub: 'Todos os sistemas no verde — é isso!',
  },
  good: {
    label: 'BOM',
    emoji: '🔥',
    color: '#F5C842',
    rgb: '245,200,66',
    bg: 'linear-gradient(135deg, rgba(245,200,66,0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)',
    border: 'rgba(245,200,66,0.3)',
    glow: 'rgba(245,200,66,0.12)',
    phrase: 'Bom ritmo — mais um passo.',
    sub: 'Complete os hábitos e suba o nível.',
  },
  alert: {
    label: 'ALERTA',
    emoji: '🎯',
    color: '#FF4D00',
    rgb: '255,77,0',
    bg: 'linear-gradient(135deg, rgba(255,77,0,0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(239,68,68,0.05) 100%)',
    border: 'rgba(255,77,0,0.3)',
    glow: 'rgba(255,77,0,0.12)',
    phrase: 'Hoje é o dia de virar o jogo.',
    sub: 'Pequenas ações agora = grande progresso amanhã.',
  },
};

export async function DailyPerformanceCard({ userId }: { userId: string }) {
  const supabase = await createClient();
  const today = todayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;

  const [habitsRes, habitLogsRes, waterRes, sleepRes, xpTodayRes, profileRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase.from('habit_logs').select('habit_id').eq('user_id', userId).eq('logged_date', today),
    supabase.from('water_logs').select('amount_ml').eq('user_id', userId).eq('date', today),
    supabase
      .from('sleep_logs')
      .select('duration_hours, quality')
      .eq('user_id', userId)
      .eq('date', yesterday)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`),
    supabase.from('profiles').select('streak_current, level').eq('id', userId).single(),
  ]);

  const totalHabits = habitsRes.count ?? 0;
  const doneHabits = (habitLogsRes.data ?? []).length;
  const habitScore = totalHabits > 0 ? doneHabits / totalHabits : 0;

  const waterTotal = (waterRes.data ?? []).reduce((s, r) => s + (r.amount_ml as number), 0);
  const waterScore = Math.min(1, waterTotal / WATER_GOAL_ML);

  const sleepHours = (sleepRes.data?.duration_hours as number | null) ?? null;
  const sleepScore = sleepHours !== null ? Math.min(1, sleepHours / 8) : 0.5;
  const sleepLogged = sleepHours !== null;

  const xpToday = (xpTodayRes.data ?? []).reduce((s, r) => s + (r.amount as number), 0);

  const profile = profileRes.data;
  const streak = profile?.streak_current ?? 0;

  // Weighted performance score 0-100
  const score = Math.round(
    habitScore * 40 + waterScore * 25 + sleepScore * 25 + Math.min(1, xpToday / 200) * 10
  );

  const state: PerfState = score >= 70 ? 'great' : score >= 40 ? 'good' : 'alert';
  const cfg = PERF_CONFIG[state];

  // Don't show if user has zero activity at all (brand new user, no habits yet)
  if (totalHabits === 0 && xpToday === 0) return null;

  // Build pillar array for the visual meters
  const pillars = [
    {
      label: 'Hábitos',
      icon: Target,
      value: totalHabits > 0 ? Math.round(habitScore * 100) : 0,
      display: totalHabits > 0 ? `${doneHabits}/${totalHabits}` : '—',
      color: habitScore === 1 ? '#00FF88' : habitScore >= 0.5 ? '#F5C842' : '#FF4D00',
      href: '/habitos',
    },
    {
      label: 'Água',
      icon: Droplets,
      value: Math.round(waterScore * 100),
      display: waterTotal >= 1000 ? `${(waterTotal / 1000).toFixed(1)}L` : `${waterTotal}ml`,
      color: waterScore >= 1 ? '#00FF88' : waterScore >= 0.5 ? '#00D9FF' : '#8899BB',
      href: '/saude',
    },
    {
      label: 'Sono',
      icon: Moon,
      value: sleepLogged ? Math.round(sleepScore * 100) : 0,
      display: sleepLogged
        ? (() => {
            const h = Math.floor(sleepHours!);
            const m = Math.round((sleepHours! - h) * 60);
            return m === 0 ? `${h}h` : `${h}h${m}m`;
          })()
        : 'Não reg.',
      color: sleepLogged
        ? sleepScore >= 0.875
          ? '#00FF88'
          : sleepScore >= 0.625
            ? '#7C3AED'
            : '#F5C842'
        : '#5A6B85',
      href: '/saude',
    },
  ];

  return (
    <div
      className="relative animate-fade-in overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 40px ${cfg.glow}`,
      }}
    >
      {/* Ambient glow circles */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `rgba(${cfg.rgb},0.08)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full blur-2xl"
        style={{ background: `rgba(${cfg.rgb},0.05)` }}
      />

      <div className="relative z-10">
        {/* ── Header row ──────────────────────────────────────────────── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Performance do Dia
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* State badge */}
              <div
                className="flex animate-bounce-in items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  background: `rgba(${cfg.rgb},0.15)`,
                  border: `1px solid rgba(${cfg.rgb},0.35)`,
                }}
              >
                <span className="text-base">{cfg.emoji}</span>
                <span className="heading-display text-lg leading-none" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>

              {/* Streak badge */}
              {streak > 0 && (
                <div
                  className="flex items-center gap-1 rounded-xl px-2.5 py-1.5"
                  style={{
                    background: streak >= 7 ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${streak >= 7 ? 'rgba(255,77,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <Flame
                    size={13}
                    fill={streak >= 7 ? '#FF4D00' : '#8899BB'}
                    style={{
                      color: streak >= 7 ? '#FF4D00' : '#8899BB',
                      animation: streak >= 7 ? 'streakFire 1.5s ease-in-out infinite' : 'none',
                    }}
                  />
                  <span
                    className="text-xs font-black"
                    style={{ color: streak >= 7 ? '#FF4D00' : '#8899BB' }}
                  >
                    {streak}d
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Score ring */}
          <div className="relative shrink-0">
            <svg width="72" height="72" className="animate-bounce-in">
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="5"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke={cfg.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - score / 100)}`}
                transform="rotate(-90 36 36)"
                style={{
                  filter: `drop-shadow(0 0 6px ${cfg.color}60)`,
                  transition: 'stroke-dashoffset 1s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="heading-display text-xl leading-none" style={{ color: cfg.color }}>
                {score}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-text-muted">score</span>
            </div>
          </div>
        </div>

        {/* ── Motivational phrase ─────────────────────────────────────── */}
        <p className="mb-1 text-sm font-semibold" style={{ color: cfg.color }}>
          {cfg.phrase}
        </p>
        <p className="mb-5 text-xs text-text-muted">{cfg.sub}</p>

        {/* ── Pillars ─────────────────────────────────────────────────── */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.label} href={p.href} className="group">
                <div
                  className="rounded-xl p-3 transition-all hover:scale-[1.03]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <Icon size={11} style={{ color: p.color }} />
                    <span className="text-[9px] uppercase tracking-wider text-text-muted">
                      {p.label}
                    </span>
                  </div>
                  <div className="mb-2 text-sm font-black leading-none" style={{ color: p.color }}>
                    {p.display}
                  </div>
                  {/* Mini progress bar */}
                  <div
                    className="h-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${p.value}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── XP today + CTA ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          {xpToday > 0 ? (
            <div className="flex animate-counter items-center gap-1.5">
              <Zap size={13} className="text-brand-gold" fill="currentColor" />
              <span className="text-sm font-black text-brand-gold">
                +{xpToday.toLocaleString('pt-BR')} XP hoje
              </span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">Nenhum XP ainda — comece agora!</span>
          )}

          <Link
            href="/habitos"
            className="flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2"
            style={{ color: cfg.color }}
          >
            Ver hábitos <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
