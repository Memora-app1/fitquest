import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import Link from 'next/link';
import {
  Trophy,
  Zap,
  Flame,
  Clock,
  Target,
  Dumbbell,
  CheckSquare,
  Droplets,
  TrendingUp,
  Wallet,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';
import {
  getISOWeek,
  getWeekStartString,
  getWeekEndString,
  getDaysLeftInWeek,
} from '@/lib/dates';
import { WATER_GOAL_ML } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Desafios Semanais',
  description: 'Todos os desafios desta semana e histórico de conquistas anteriores.',
};

export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  icon: string;
  label: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  color: string;
  rgb: string;
  completed: boolean;
  IconComp: React.ElementType;
}

interface WeekHistory {
  weekNum: number;
  year: number;
  xpEarned: number;
  completedCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, React.ElementType> = {
  habits: Target,
  workouts: Dumbbell,
  tasks: CheckSquare,
  xp: Zap,
  streak: Flame,
  health: Droplets,
  finance: Wallet,
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DesafiosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const weekNum = getISOWeek(now);
  const year = now.getFullYear();
  const weekStart = getWeekStartString(now);
  const weekEnd = getWeekEndString(now);
  const daysLeft = getDaysLeftInWeek(now);

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  const [
    habitLogsRes,
    habitsRes,
    workoutsRes,
    tasksDoneRes,
    tasksAllRes,
    xpRes,
    transactionsRes,
    profileRes,
    waterLogsRes,
    challengeXpHistoryRes,
  ] = await Promise.all([
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', weekStart)
      .lte('logged_date', weekEnd)
      .limit(500),

    supabase.from('habits').select('id').eq('user_id', user.id).eq('is_active', true).limit(50),

    supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', weekStart + 'T00:00:00')
      .lte('created_at', weekEnd + 'T23:59:59')
      .limit(50),

    supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('updated_at', weekStart + 'T00:00:00')
      .lte('updated_at', weekEnd + 'T23:59:59')
      .limit(200),

    supabase.from('tasks').select('id').eq('user_id', user.id).neq('status', 'archived').limit(2000),

    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', weekStart + 'T00:00:00')
      .lte('created_at', weekEnd + 'T23:59:59')
      .limit(500),

    supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .gte('transaction_date', weekStart)
      .lte('transaction_date', weekEnd)
      .limit(200),

    supabase.from('profiles').select('streak_current, level').eq('id', user.id).single(),

    supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .limit(100),

    // Histórico de XP de desafios das últimas 8 semanas
    supabase
      .from('xp_transactions')
      .select('amount, source_id, created_at')
      .eq('user_id', user.id)
      .ilike('source_id', 'wc_%')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  // ── Compute current values ────────────────────────────────────────────────

  const waterByDay: Record<string, number> = {};
  for (const row of waterLogsRes.data ?? []) {
    const d = row.date as string;
    waterByDay[d] = (waterByDay[d] ?? 0) + ((row.amount_ml as number) ?? 0);
  }
  const waterGoalDays = Object.values(waterByDay).filter((v) => v >= WATER_GOAL_ML).length;

  const habitsCount = habitsRes.data?.length ?? 0;
  const habitLogsCount = habitLogsRes.data?.length ?? 0;
  const workoutsCount = workoutsRes.data?.length ?? 0;
  const tasksDoneCount = tasksDoneRes.data?.length ?? 0;
  const totalTasksCount = tasksAllRes.data?.length ?? 0;
  const weekXp = (xpRes.data ?? []).reduce((s, t) => s + ((t.amount as number) ?? 0), 0);
  const transactionsCount = transactionsRes.data?.length ?? 0;
  const streakCurrent = profileRes.data?.streak_current ?? 0;
  const level = profileRes.data?.level ?? 1;

  // ── Build all challenges ──────────────────────────────────────────────────

  const seed = weekNum + year * 100;
  const levelMult = 1 + (level - 1) * 0.2;

  const allChallenges: Challenge[] = [];

  // 1. Habits
  if (habitsCount > 0) {
    const target = Math.max(3, Math.round(habitsCount * 4 * levelMult));
    allChallenges.push({
      id: 'habits',
      icon: '🎯',
      label: 'Mestre dos Hábitos',
      description: `Registre ${target} hábitos esta semana`,
      target,
      current: Math.min(habitLogsCount, target),
      xpReward: Math.round(150 * levelMult),
      color: '#FF4D00',
      rgb: '255,77,0',
      completed: habitLogsCount >= target,
      IconComp: CATEGORY_ICON['habits']!,
    });
  }

  // 2. Workouts
  {
    const baseTarget = level <= 2 ? 1 : level <= 4 ? 2 : 3;
    const target = Math.max(1, Math.round(baseTarget * levelMult));
    allChallenges.push({
      id: 'workouts',
      icon: '💪',
      label: 'Guerreiro Fitness',
      description: `Complete ${target} treino${target > 1 ? 's' : ''} esta semana`,
      target,
      current: Math.min(workoutsCount, target),
      xpReward: Math.round(200 * levelMult),
      color: '#00FF88',
      rgb: '0,255,136',
      completed: workoutsCount >= target,
      IconComp: CATEGORY_ICON['workouts']!,
    });
  }

  // 3. Tasks
  if (totalTasksCount > 0) {
    const baseTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7;
    const target = Math.round(baseTarget * levelMult);
    allChallenges.push({
      id: 'tasks',
      icon: '✅',
      label: 'Executor Elite',
      description: `Conclua ${target} tarefa${target > 1 ? 's' : ''} esta semana`,
      target,
      current: Math.min(tasksDoneCount, target),
      xpReward: Math.round(120 * levelMult),
      color: '#7C3AED',
      rgb: '124,58,237',
      completed: tasksDoneCount >= target,
      IconComp: CATEGORY_ICON['tasks']!,
    });
  }

  // 4. XP
  {
    const baseXpTarget = level <= 2 ? 200 : level <= 4 ? 500 : level <= 6 ? 1000 : 2000;
    const xpVariance = Math.round(baseXpTarget * 0.2);
    const target = Math.round((baseXpTarget + ((seed * 3571) % xpVariance)) * levelMult);
    allChallenges.push({
      id: 'xp',
      icon: '⚡',
      label: 'Caçador de XP',
      description: `Acumule ${target.toLocaleString('pt-BR')} XP esta semana`,
      target,
      current: Math.min(weekXp, target),
      xpReward: Math.round(250 * levelMult),
      color: '#F5C842',
      rgb: '245,200,66',
      completed: weekXp >= target,
      IconComp: CATEGORY_ICON['xp']!,
    });
  }

  // 5. Streak
  {
    const streakTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7;
    allChallenges.push({
      id: 'streak',
      icon: '🔥',
      label: 'Sequência Implacável',
      description: `Mantenha sequência de ${streakTarget} dias`,
      target: streakTarget,
      current: Math.min(streakCurrent, streakTarget),
      xpReward: Math.round(300 * levelMult),
      color: '#FF4D00',
      rgb: '255,77,0',
      completed: streakCurrent >= streakTarget,
      IconComp: CATEGORY_ICON['streak']!,
    });
  }

  // 6. Health
  {
    const target = 5;
    allChallenges.push({
      id: 'health',
      icon: '💧',
      label: 'Hidratação Plena',
      description: `Atingir a meta de 2L em ${target} dias desta semana`,
      target,
      current: Math.min(waterGoalDays, target),
      xpReward: Math.round(130 * levelMult),
      color: '#00D9FF',
      rgb: '0,217,255',
      completed: waterGoalDays >= target,
      IconComp: CATEGORY_ICON['health']!,
    });
  }

  // 7. Finance (rotates every other week by seed parity)
  if (seed % 2 === 0 || transactionsCount > 0) {
    const target = level <= 2 ? 3 : level <= 4 ? 5 : 8;
    allChallenges.push({
      id: 'finance',
      icon: '💰',
      label: 'Controle Financeiro',
      description: `Registre ${target} transações esta semana`,
      target,
      current: Math.min(transactionsCount, target),
      xpReward: Math.round(100 * levelMult),
      color: '#3B82F6',
      rgb: '59,130,246',
      completed: transactionsCount >= target,
      IconComp: CATEGORY_ICON['finance']!,
    });
  }

  // Sort: incomplete first, then by XP reward descending
  allChallenges.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.xpReward - a.xpReward;
  });

  const completedCount = allChallenges.filter((c) => c.completed).length;
  const totalXpAvailable = allChallenges.reduce((s, c) => s + c.xpReward, 0);
  const totalXpEarned = allChallenges.filter((c) => c.completed).reduce((s, c) => s + c.xpReward, 0);
  const allCompleted = completedCount === allChallenges.length;

  // ── Build history from XP transactions ───────────────────────────────────

  const historyMap: Record<string, { xpEarned: number; completedCount: number }> = {};
  for (const tx of challengeXpHistoryRes.data ?? []) {
    const sourceId = tx.source_id as string;
    // Pattern: wc_{year}w{week}_{challengeId}
    const match = sourceId.match(/^wc_(\d+)w(\d+)_/);
    if (!match) continue;
    const txYear = match[1]!;
    const txWeek = match[2]!;
    const key = `${txYear}w${txWeek}`;
    if (!historyMap[key]) historyMap[key] = { xpEarned: 0, completedCount: 0 };
    historyMap[key].xpEarned += (tx.amount as number) ?? 0;
    historyMap[key].completedCount += 1;
  }

  // Build sorted history (last 4 weeks, excluding current week)
  const currentKey = `${year}w${weekNum}`;
  const weekHistory: WeekHistory[] = Object.entries(historyMap)
    .filter(([key]) => key !== currentKey)
    .map(([key, val]) => {
      const [y, w] = key.split('w').map(Number);
      return { weekNum: w!, year: y!, ...val };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNum - a.weekNum;
    })
    .slice(0, 4);

  // XP earned THIS week from challenges
  const thisWeekChallengeXp = historyMap[currentKey]?.xpEarned ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">

        {/* ── Back link ───────────────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: allCompleted
              ? 'linear-gradient(135deg, rgba(245,200,66,0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(124,58,237,0.09) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
            border: allCompleted ? '1px solid rgba(245,200,66,0.28)' : '1px solid rgba(124,58,237,0.22)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full blur-3xl"
            style={{ background: allCompleted ? 'rgba(245,200,66,0.12)' : 'rgba(124,58,237,0.10)' }}
          />

          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: allCompleted ? 'rgba(245,200,66,0.12)' : 'rgba(124,58,237,0.12)',
                    border: allCompleted ? '1px solid rgba(245,200,66,0.3)' : '1px solid rgba(124,58,237,0.3)',
                  }}
                >
                  <Trophy size={22} style={{ color: allCompleted ? '#F5C842' : '#7C3AED' }} />
                </div>
                <div>
                  <h1 className="heading-display text-3xl md:text-4xl">Desafios</h1>
                  <p className="text-sm text-text-secondary">
                    Semana {weekNum} · {completedCount}/{allChallenges.length} concluídos
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                style={{
                  background: daysLeft <= 2 ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.06)',
                  border: daysLeft <= 2 ? '1px solid rgba(255,77,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: daysLeft <= 2 ? '#FF4D00' : '#8899BB',
                }}
              >
                <Clock size={11} />
                {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="heading-display text-2xl" style={{ color: allCompleted ? '#F5C842' : '#7C3AED' }}>
                  {completedCount}/{allChallenges.length}
                </div>
                <div className="mt-0.5 text-[10px] text-text-muted">Concluídos</div>
              </div>
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.15)' }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Zap size={12} className="text-brand-gold" fill="currentColor" />
                  <span className="heading-display text-2xl text-brand-gold">
                    {thisWeekChallengeXp > 0 ? `+${thisWeekChallengeXp.toLocaleString('pt-BR')}` : totalXpEarned.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-text-muted">XP ganho</div>
              </div>
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)' }}
              >
                <div className="heading-display text-2xl text-brand-green">
                  {totalXpAvailable.toLocaleString('pt-BR')}
                </div>
                <div className="mt-0.5 text-[10px] text-text-muted">XP disponível</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Progresso da semana</span>
                <span className="font-bold" style={{ color: allCompleted ? '#F5C842' : '#7C3AED' }}>
                  {Math.round((completedCount / allChallenges.length) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((completedCount / allChallenges.length) * 100)}%`,
                    background: allCompleted
                      ? 'linear-gradient(90deg, #F5C842, #FF4D00)'
                      : 'linear-gradient(90deg, #7C3AED, #FF4D00)',
                    boxShadow: allCompleted
                      ? '0 0 8px rgba(245,200,66,0.5)'
                      : '0 0 8px rgba(124,58,237,0.4)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── All challenges ───────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-text-muted">
            Desafios desta semana
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allChallenges.map((challenge) => {
              const pct = Math.min(100, Math.round((challenge.current / challenge.target) * 100));
              const Icon = challenge.IconComp;

              return (
                <div
                  key={challenge.id}
                  className="relative overflow-hidden rounded-2xl p-5 transition-all"
                  style={{
                    background: challenge.completed
                      ? 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)'
                      : `linear-gradient(135deg, rgba(${challenge.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                    border: challenge.completed
                      ? '1px solid rgba(0,255,136,0.25)'
                      : `1px solid rgba(${challenge.rgb},0.2)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl"
                    style={{
                      background: challenge.completed
                        ? 'rgba(0,255,136,0.15)'
                        : `rgba(${challenge.rgb},0.15)`,
                    }}
                  />

                  <div className="relative z-10 space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                          style={{
                            background: challenge.completed
                              ? 'rgba(0,255,136,0.12)'
                              : `rgba(${challenge.rgb},0.12)`,
                            border: challenge.completed
                              ? '1px solid rgba(0,255,136,0.25)'
                              : `1px solid rgba(${challenge.rgb},0.25)`,
                          }}
                        >
                          {challenge.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight text-white">
                            {challenge.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-text-secondary">
                            {challenge.description}
                          </div>
                        </div>
                      </div>

                      {/* XP badge */}
                      <div
                        className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black"
                        style={{
                          background: challenge.completed
                            ? 'rgba(0,255,136,0.12)'
                            : `rgba(${challenge.rgb},0.1)`,
                          border: challenge.completed
                            ? '1px solid rgba(0,255,136,0.2)'
                            : `1px solid rgba(${challenge.rgb},0.2)`,
                          color: challenge.completed ? '#00FF88' : challenge.color,
                        }}
                      >
                        <Zap size={10} fill="currentColor" />+
                        {challenge.xpReward.toLocaleString('pt-BR')}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Icon size={11} />
                          <span>
                            {challenge.current.toLocaleString('pt-BR')} /&nbsp;
                            {challenge.target.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <span
                          className="text-xs font-bold"
                          style={{ color: challenge.completed ? '#00FF88' : challenge.color }}
                        >
                          {challenge.completed ? '✓ Concluído!' : `${pct}%`}
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: challenge.completed
                              ? 'linear-gradient(90deg, #00FF88, rgba(0,255,136,0.6))'
                              : `linear-gradient(90deg, ${challenge.color}, rgba(${challenge.rgb},0.5))`,
                            boxShadow: pct > 0
                              ? `0 0 6px rgba(${challenge.completed ? '0,255,136' : challenge.rgb},0.4)`
                              : 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── All completed banner ─────────────────────────────────────────── */}
        {allCompleted && (
          <div
            className="flex items-center gap-4 rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.10) 0%, rgba(0,255,136,0.05) 100%)',
              border: '1px solid rgba(245,200,66,0.28)',
            }}
          >
            <span className="text-4xl">🎉</span>
            <div>
              <p className="font-black text-white">Semana perfeita nos desafios!</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                +{totalXpEarned.toLocaleString('pt-BR')} XP de desafios acumulados esta semana. Continue
                assim! 🏆
              </p>
            </div>
          </div>
        )}

        {/* ── How XP is granted ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <TrendingUp size={14} className="text-brand-green" />
            Como o XP é concedido
          </h3>
          <p className="text-xs leading-relaxed text-text-secondary">
            O XP de desafios é liberado automaticamente quando os critérios são detectados. Os desafios
            são recalculados toda segunda-feira e escalam com o seu nível — quanto mais alto, maiores
            as metas e maiores as recompensas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: 'Hábitos', color: '#FF4D00' },
              { label: 'Treinos', color: '#00FF88' },
              { label: 'Tarefas', color: '#7C3AED' },
              { label: 'XP', color: '#F5C842' },
              { label: 'Streak', color: '#FF4D00' },
              { label: 'Saúde', color: '#00D9FF' },
              { label: 'Finanças', color: '#3B82F6' },
            ].map((cat) => (
              <span
                key={cat.label}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}25`, color: cat.color }}
              >
                {cat.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Weekly history ───────────────────────────────────────────────── */}
        {weekHistory.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-widest text-text-muted">
              <CalendarDays size={12} />
              Histórico de semanas anteriores
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {weekHistory.map((wk) => (
                <div
                  key={`${wk.year}w${wk.weekNum}`}
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: wk.xpEarned > 0
                      ? 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)'
                      : 'rgba(255,255,255,0.025)',
                    border: wk.xpEarned > 0
                      ? '1px solid rgba(124,58,237,0.2)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Semana {wk.weekNum}
                  </div>
                  {wk.xpEarned > 0 ? (
                    <>
                      <div
                        className="flex items-center justify-center gap-1 text-lg font-black"
                        style={{ color: '#F5C842' }}
                      >
                        <Zap size={14} fill="currentColor" />
                        {wk.xpEarned.toLocaleString('pt-BR')}
                      </div>
                      <div className="mt-0.5 text-[10px] text-text-muted">
                        {wk.completedCount} desafio{wk.completedCount !== 1 ? 's' : ''}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-text-muted">—</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick links ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: '/habitos', label: 'Hábitos', icon: Target, color: '#FF4D00', rgb: '255,77,0' },
            { href: '/treinos', label: 'Treinos', icon: Dumbbell, color: '#00FF88', rgb: '0,255,136' },
            { href: '/tarefas', label: 'Tarefas', icon: CheckSquare, color: '#7C3AED', rgb: '124,58,237' },
            { href: '/financas', label: 'Finanças', icon: Wallet, color: '#3B82F6', rgb: '59,130,246' },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: `rgba(${link.rgb},0.06)`,
                  border: `1px solid rgba(${link.rgb},0.18)`,
                }}
              >
                <Icon size={20} style={{ color: link.color }} />
                <span className="text-xs font-semibold text-text-secondary">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
