import { createClient } from '@/lib/supabase/server';
import { PiggyBank, TrendingUp, Flag, AlertTriangle } from 'lucide-react';

interface FinanceGoalRow {
  id: string;
  title: string;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  monthly_target: number | null;
  status: string;
  completed_at: string | null;
  created_at: string;
}

function formatBRL(v: number): string {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function monthsToGoal(remaining: number, monthlyRate: number): number | null {
  if (monthlyRate <= 0 || remaining <= 0) return null;
  return Math.ceil(remaining / monthlyRate);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatProjectedDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 0) return 'Alcançada!';
  if (diffDays <= 30) return `em ${diffDays} dias`;
  if (diffDays <= 90)
    return `em ~${Math.round(diffDays / 30)} mês${Math.round(diffDays / 30) > 1 ? 'es' : ''}`;
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export async function FinanceGoalsOverview({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Fetch active finance goals and last 3 months of transactions for savings rate
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0]!;

  const [goalsRes, txRes] = await Promise.all([
    supabase
      .from('finance_goals')
      .select(
        'id, title, icon, color, target_amount, current_amount, deadline, monthly_target, status, completed_at, created_at'
      )
      .eq('user_id', userId)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('transactions')
      .select('amount, type, transaction_date')
      .eq('user_id', userId)
      .gte('transaction_date', threeMonthsAgoStr)
      .eq('is_paid', true)
      .limit(5000),
  ]);

  const goals = (goalsRes.data ?? []) as FinanceGoalRow[];
  const txns = txRes.data ?? [];

  if (goals.length === 0) return null;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  if (activeGoals.length === 0 && completedGoals.length === 0) return null;

  // Compute monthly savings rate from last 3 months (income - expense) / 3
  const totalIncome = txns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = txns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const avgMonthlySavings = Math.max(0, (totalIncome - totalExpense) / 3);

  // Build projections for active goals
  interface GoalProjection extends FinanceGoalRow {
    pct: number;
    remaining: number;
    monthsNeeded: number | null;
    projectedDate: Date | null;
    deadlineDays: number | null;
    isOnTrack: boolean | null;
    monthlyRate: number;
  }

  const projections: GoalProjection[] = activeGoals.map((g) => {
    const pct = Math.min(
      100,
      Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
    );
    const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));

    // Use explicit monthly_target if set, otherwise use overall savings rate
    const monthlyRate = g.monthly_target
      ? Number(g.monthly_target)
      : activeGoals.length > 0
        ? avgMonthlySavings / activeGoals.length
        : 0;

    const monthsNeeded = monthsToGoal(remaining, monthlyRate);
    const projectedDate = monthsNeeded !== null ? addMonths(new Date(), monthsNeeded) : null;

    const deadlineDays = g.deadline ? daysUntil(g.deadline) : null;

    let isOnTrack: boolean | null = null;
    if (projectedDate && g.deadline) {
      isOnTrack = projectedDate <= new Date(g.deadline);
    }

    return {
      ...g,
      pct,
      remaining,
      monthsNeeded,
      projectedDate,
      deadlineDays,
      isOnTrack,
      monthlyRate,
    };
  });

  // Sort: at-risk first, then by deadline proximity, then by progress
  projections.sort((a, b) => {
    if (a.isOnTrack === false && b.isOnTrack !== false) return -1;
    if (b.isOnTrack === false && a.isOnTrack !== false) return 1;
    if (a.deadlineDays !== null && b.deadlineDays !== null) return a.deadlineDays - b.deadlineDays;
    if (a.deadlineDays !== null) return -1;
    if (b.deadlineDays !== null) return 1;
    return b.pct - a.pct;
  });

  const totalTarget = activeGoals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = activeGoals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalRemaining = totalTarget - totalSaved;
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const atRiskCount = projections.filter((p) => p.isOnTrack === false).length;
  const onTrackCount = projections.filter((p) => p.isOnTrack === true).length;

  return (
    <div className="space-y-4">
      {/* ── Overall savings summary ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 md:p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
          border: '1px solid rgba(245,200,66,0.14)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: 'rgba(245,200,66,0.07)' }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{
                    background: 'rgba(245,200,66,0.12)',
                    border: '1px solid rgba(245,200,66,0.22)',
                  }}
                >
                  <PiggyBank size={12} style={{ color: '#F5C842' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Visão Geral
                </span>
              </div>
              <h2 className="text-xl font-black leading-tight">
                {formatBRL(totalSaved)} guardado de {formatBRL(totalTarget)}
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">
                {formatBRL(totalRemaining)} restante para todas as metas ativas
              </p>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              {onTrackCount > 0 && (
                <div
                  className="rounded-xl px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: 'rgba(0,255,136,0.1)',
                    border: '1px solid rgba(0,255,136,0.2)',
                    color: '#00FF88',
                  }}
                >
                  ✓ {onTrackCount} no prazo
                </div>
              )}
              {atRiskCount > 0 && (
                <div
                  className="rounded-xl px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: 'rgba(255,77,0,0.1)',
                    border: '1px solid rgba(255,77,0,0.2)',
                    color: '#FF4D00',
                  }}
                >
                  ⚠ {atRiskCount} em risco
                </div>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-text-muted">Progresso geral</span>
              <span
                className="font-bold"
                style={{ color: overallPct >= 75 ? '#00FF88' : '#F5C842' }}
              >
                {overallPct}%
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${overallPct}%`,
                  background:
                    overallPct >= 75
                      ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                      : 'linear-gradient(90deg, #F5C842, #FF9500)',
                }}
              />
            </div>
          </div>

          {/* Monthly savings rate */}
          {avgMonthlySavings > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <TrendingUp size={14} style={{ color: '#00FF88' }} />
              <span className="text-sm text-text-secondary">
                Taxa de poupança média:{' '}
                <span className="font-bold" style={{ color: '#00FF88' }}>
                  {formatBRL(avgMonthlySavings)}/mês
                </span>
                <span className="ml-1 text-xs text-text-muted">(últimos 3 meses)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Per-goal projections ─────────────────────────────────────────── */}
      {projections.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-5 md:p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.22)',
              }}
            >
              <Flag size={12} style={{ color: '#7C3AED' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Projeção por Meta
            </span>
          </div>

          <div className="space-y-4">
            {projections.map((p) => {
              const accentColor =
                p.isOnTrack === false
                  ? '#FF4D00'
                  : p.isOnTrack === true
                    ? '#00FF88'
                    : p.pct >= 75
                      ? '#F5C842'
                      : '#7C3AED';

              return (
                <div key={p.id} className="space-y-2">
                  {/* Header row */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base"
                      style={{
                        background: `${p.color ?? '#7C3AED'}18`,
                        border: `1px solid ${p.color ?? '#7C3AED'}25`,
                      }}
                    >
                      {p.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{p.title}</span>
                        {p.isOnTrack === false && (
                          <AlertTriangle
                            size={12}
                            style={{ color: '#FF4D00' }}
                            className="shrink-0"
                          />
                        )}
                        {p.isOnTrack === true && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88' }}
                          >
                            ✓ No prazo
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {formatBRL(Number(p.current_amount))} / {formatBRL(Number(p.target_amount))}
                        {p.monthly_target && (
                          <span className="ml-2">· {formatBRL(Number(p.monthly_target))}/mês</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-black" style={{ color: accentColor }}>
                        {p.pct}%
                      </div>
                      {p.projectedDate && p.remaining > 0 && (
                        <div className="text-[10px] text-text-muted">
                          {formatProjectedDate(p.projectedDate)}
                        </div>
                      )}
                      {p.remaining === 0 && (
                        <div className="text-[10px] font-bold" style={{ color: '#00FF88' }}>
                          Meta!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar with deadline marker + shimmer animation */}
                  <div className="relative">
                    <div
                      className="h-2.5 overflow-hidden rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="relative h-full overflow-hidden rounded-full"
                        style={{
                          width: `${p.pct}%`,
                          background:
                            p.isOnTrack === false
                              ? 'linear-gradient(90deg, #FF4D00, #FF6B35)'
                              : p.pct >= 75
                                ? 'linear-gradient(90deg, #F5C842, #00FF88)'
                                : `linear-gradient(90deg, ${p.color ?? '#7C3AED'}, ${accentColor})`,
                          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                          boxShadow: `0 0 8px ${accentColor}50`,
                        }}
                      >
                        {/* Shimmer overlay — só em barras ativas com progresso */}
                        {p.pct > 0 && p.pct < 100 && (
                          <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                              background:
                                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                              animation: 'shimmerSlide 2.4s ease-in-out infinite',
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Deadline marker — only if deadline is set */}
                    {p.deadline &&
                      p.projectedDate &&
                      p.monthlyRate > 0 &&
                      (() => {
                        const totalDays =
                          (new Date(p.deadline).getTime() - new Date(p.created_at).getTime()) /
                          86400000;
                        const elapsedDays =
                          (Date.now() - new Date(p.created_at).getTime()) / 86400000;
                        const deadlinePct = Math.min(
                          100,
                          Math.round((elapsedDays / totalDays) * 100)
                        );
                        return (
                          <div
                            className="absolute top-0 h-2 w-0.5 rounded"
                            style={{
                              left: `${deadlinePct}%`,
                              background:
                                p.deadlineDays && p.deadlineDays < 0 ? '#EF4444' : '#8899BB',
                            }}
                            title={`Prazo: ${new Date(p.deadline).toLocaleDateString('pt-BR')}`}
                          />
                        );
                      })()}
                  </div>

                  {/* Deadline info */}
                  {p.deadline && p.deadlineDays !== null && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Flag
                        size={9}
                        style={{
                          color:
                            p.deadlineDays < 0
                              ? '#EF4444'
                              : p.deadlineDays <= 30
                                ? '#FF4D00'
                                : '#8899BB',
                        }}
                      />
                      <span
                        style={{ color: p.deadlineDays < 0 ? '#EF4444' : 'inherit' }}
                        className="text-text-muted"
                      >
                        {p.deadlineDays < 0
                          ? `Prazo vencido há ${Math.abs(p.deadlineDays)} dias`
                          : p.deadlineDays === 0
                            ? 'Prazo hoje!'
                            : `Prazo em ${p.deadlineDays} dia${p.deadlineDays !== 1 ? 's' : ''}`}
                      </span>
                      {p.isOnTrack === false && p.projectedDate && p.remaining > 0 && (
                        <span className="ml-1 text-text-muted">
                          · projeção: {formatProjectedDate(p.projectedDate)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Completed goals ──────────────────────────────────────────────── */}
      {completedGoals.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}
        >
          <span className="shrink-0 text-xl">{completedGoals.length >= 5 ? '🏆' : '🎉'}</span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {completedGoals.length} meta
              {completedGoals.length !== 1 ? 's financeiras' : ' financeira'} alcançada
              {completedGoals.length !== 1 ? 's' : ''}!
            </p>
            {completedGoals[0] && (
              <p className="mt-0.5 text-[11px] text-text-muted">
                Última: <span className="font-medium text-white">{completedGoals[0].title}</span>
                {completedGoals[0].completed_at && (
                  <> em {new Date(completedGoals[0].completed_at).toLocaleDateString('pt-BR')}</>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
