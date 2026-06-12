import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@/lib/utils';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';

interface GoalRow {
  id: string;
  title: string;
  icon: string | null;
  color: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  monthly_target: number | null;
  status: string;
  created_at: string;
}

interface TxRow {
  amount: number;
  created_at: string;
}

export async function FinanceGoalsMilestones({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]!;

  // 6 months back for deposit history
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();

  const [goalsRes, savingsLogsRes] = await Promise.all([
    supabase
      .from('finance_goals')
      .select(
        'id, title, icon, color, target_amount, current_amount, deadline, monthly_target, status, created_at'
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    // Transactions tagged as savings / income toward goals (approximate via goal deposits)
    // We'll use a simpler metric: months since creation to compute deposit rate
    supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('created_at', sixMonthsAgo)
      .limit(500),
  ]);

  const goals = (goalsRes.data ?? []) as GoalRow[];
  if (goals.length === 0) return null;

  // For each goal, compute projection and milestones
  interface GoalInsight {
    goal: GoalRow;
    remaining: number;
    pct: number;
    color: string;
    // Projection
    monthsElapsed: number;
    depositRateMonthly: number; // current_amount / months elapsed (or monthly_target if set)
    projectedMonthsLeft: number | null;
    projectedDate: string | null;
    isOnTrack: boolean;
    daysUntilDeadline: number | null;
    neededPerMonth: number | null; // to reach deadline from today
    urgencyLevel: 'ok' | 'warning' | 'danger' | 'completed';
    milestones: { pct: number; label: string; reached: boolean }[];
  }

  const insights: GoalInsight[] = goals.map((goal) => {
    const target = Number(goal.target_amount);
    const current = Number(goal.current_amount);
    const remaining = Math.max(0, target - current);
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const color = goal.color ?? '#7C3AED';

    // Months since goal was created
    const createdAt = new Date(goal.created_at);
    const monthsElapsed = Math.max(
      1,
      (now.getFullYear() - createdAt.getFullYear()) * 12 +
        (now.getMonth() - createdAt.getMonth()) +
        1
    );

    // Deposit rate: monthly_target if set, else infer from current_amount / months
    const depositRateMonthly = goal.monthly_target
      ? Number(goal.monthly_target)
      : current > 0
        ? Math.round(current / monthsElapsed)
        : 0;

    // Projected months to complete
    const projectedMonthsLeft =
      depositRateMonthly > 0 ? Math.ceil(remaining / depositRateMonthly) : null;

    let projectedDate: string | null = null;
    if (projectedMonthsLeft !== null) {
      const proj = new Date(now.getFullYear(), now.getMonth() + projectedMonthsLeft, 1);
      projectedDate = proj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    // Days until deadline
    let daysUntilDeadline: number | null = null;
    let neededPerMonth: number | null = null;
    if (goal.deadline) {
      const dl = new Date(goal.deadline);
      daysUntilDeadline = Math.ceil((dl.getTime() - now.getTime()) / 86400000);
      const monthsLeft = Math.max(1, Math.ceil(daysUntilDeadline / 30));
      neededPerMonth = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
    }

    // On track: projected date ≤ deadline, or no deadline and has positive rate
    let isOnTrack = false;
    if (goal.deadline && projectedMonthsLeft !== null && daysUntilDeadline !== null) {
      const projectedMs = projectedMonthsLeft * 30 * 86400000;
      isOnTrack = projectedMs <= daysUntilDeadline * 86400000;
    } else if (!goal.deadline && depositRateMonthly > 0) {
      isOnTrack = true;
    }

    // Urgency
    let urgencyLevel: GoalInsight['urgencyLevel'] = 'ok';
    if (pct >= 100) urgencyLevel = 'completed';
    else if (daysUntilDeadline !== null) {
      if (daysUntilDeadline < 0) urgencyLevel = 'danger';
      else if (!isOnTrack && daysUntilDeadline < 90) urgencyLevel = 'danger';
      else if (!isOnTrack) urgencyLevel = 'warning';
      else urgencyLevel = 'ok';
    }

    // Milestone markers
    const milestones = [25, 50, 75, 100].map((mp) => ({
      pct: mp,
      label: mp === 100 ? '🏆' : mp === 75 ? '75%' : mp === 50 ? '50%' : '25%',
      reached: pct >= mp,
    }));

    return {
      goal,
      remaining,
      pct,
      color,
      monthsElapsed,
      depositRateMonthly,
      projectedMonthsLeft,
      projectedDate,
      isOnTrack,
      daysUntilDeadline,
      neededPerMonth,
      urgencyLevel,
      milestones,
    };
  });

  // Sort: danger first, then by pct desc
  insights.sort((a, b) => {
    const urgencyOrder = { danger: 0, warning: 1, ok: 2, completed: 3 };
    const oa = urgencyOrder[a.urgencyLevel];
    const ob = urgencyOrder[b.urgencyLevel];
    if (oa !== ob) return oa - ob;
    return b.pct - a.pct;
  });

  const onTrackCount = insights.filter((i) => i.isOnTrack).length;
  const dangerCount = insights.filter((i) => i.urgencyLevel === 'danger').length;
  const totalRemaining = insights.reduce((s, i) => s + i.remaining, 0);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,77,0,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
        border: '1px solid rgba(255,77,0,0.12)',
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
                  background: 'rgba(255,77,0,0.12)',
                  border: '1px solid rgba(255,77,0,0.22)',
                }}
              >
                <Target size={12} style={{ color: '#FF4D00' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Projeções e Marcos
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Análise de Metas</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {insights.length} meta{insights.length !== 1 ? 's' : ''} ativa
              {insights.length !== 1 ? 's' : ''} · ainda faltam {formatBRL(totalRemaining)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>
                {onTrackCount}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">no prazo</div>
            </div>
            {dangerCount > 0 && (
              <>
                <div
                  className="h-8 w-px rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                />
                <div className="text-right">
                  <div className="text-2xl font-black" style={{ color: '#EF4444' }}>
                    {dangerCount}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted">
                    em risco
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Goal Cards ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {insights.map((insight, idx) => {
            const {
              goal,
              pct,
              remaining,
              color,
              depositRateMonthly,
              projectedDate,
              isOnTrack,
              daysUntilDeadline,
              neededPerMonth,
              urgencyLevel,
              milestones,
            } = insight;

            const urgencyColor =
              urgencyLevel === 'danger'
                ? '#EF4444'
                : urgencyLevel === 'warning'
                  ? '#F5C842'
                  : urgencyLevel === 'completed'
                    ? '#00FF88'
                    : '#00FF88';

            const urgencyBg =
              urgencyLevel === 'danger'
                ? 'rgba(239,68,68,0.05)'
                : urgencyLevel === 'warning'
                  ? 'rgba(245,200,66,0.05)'
                  : 'rgba(0,255,136,0.04)';

            const urgencyBorder =
              urgencyLevel === 'danger'
                ? 'rgba(239,68,68,0.2)'
                : urgencyLevel === 'warning'
                  ? 'rgba(245,200,66,0.18)'
                  : `${color}22`;

            // SVG progress ring
            const radius = 28;
            const circumference = 2 * Math.PI * radius;
            const strokeDash = (pct / 100) * circumference;

            return (
              <div
                key={goal.id}
                className="rounded-xl p-4"
                style={{
                  background: urgencyBg,
                  border: `1px solid ${urgencyBorder}`,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Progress ring */}
                  <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
                    <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                      {/* Track */}
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="5"
                      />
                      {/* Progress */}
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeLinecap="round"
                        opacity={0.85}
                      />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[11px] font-black" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base">{goal.icon ?? '🎯'}</span>
                      <span className="truncate text-sm font-bold">{goal.title}</span>
                      {urgencyLevel === 'danger' && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                        >
                          EM RISCO
                        </span>
                      )}
                      {urgencyLevel === 'warning' && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}
                        >
                          ATENÇÃO
                        </span>
                      )}
                      {isOnTrack && urgencyLevel === 'ok' && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88' }}
                        >
                          NO PRAZO
                        </span>
                      )}
                    </div>

                    {/* Progress bar with milestones */}
                    <div className="relative mt-2">
                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}99)`,
                          }}
                        />
                      </div>
                      {/* Milestone dots */}
                      <div className="absolute left-0 right-0 top-0 flex h-2 items-center">
                        {milestones
                          .filter((m) => m.pct < 100)
                          .map((m) => (
                            <div
                              key={m.pct}
                              className="absolute h-full w-[2px] rounded-full"
                              style={{
                                left: `${m.pct}%`,
                                background: m.reached
                                  ? 'rgba(255,255,255,0.6)'
                                  : 'rgba(255,255,255,0.2)',
                              }}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Amounts row */}
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span style={{ color }}>{formatBRL(Number(goal.current_amount))}</span>
                      <span className="text-text-muted">
                        {formatBRL(Number(goal.target_amount))}
                      </span>
                    </div>

                    {/* Projection info */}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {/* Monthly deposit rate */}
                      {depositRateMonthly > 0 && (
                        <div
                          className="rounded-lg px-2.5 py-1.5"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="text-[9px] uppercase tracking-wider text-text-muted">
                            Ritmo atual
                          </div>
                          <div className="mt-0.5 text-xs font-bold" style={{ color }}>
                            {formatBRL(depositRateMonthly)}/mês
                          </div>
                        </div>
                      )}

                      {/* Projected completion */}
                      {projectedDate && remaining > 0 && (
                        <div
                          className="rounded-lg px-2.5 py-1.5"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="text-[9px] uppercase tracking-wider text-text-muted">
                            Previsão
                          </div>
                          <div
                            className="mt-0.5 text-xs font-bold"
                            style={{ color: isOnTrack ? '#00FF88' : '#F5C842' }}
                          >
                            {projectedDate}
                          </div>
                        </div>
                      )}

                      {/* Deadline info */}
                      {goal.deadline && daysUntilDeadline !== null && (
                        <div
                          className="rounded-lg px-2.5 py-1.5"
                          style={{
                            background:
                              daysUntilDeadline < 0
                                ? 'rgba(239,68,68,0.08)'
                                : daysUntilDeadline < 90
                                  ? 'rgba(245,200,66,0.06)'
                                  : 'rgba(255,255,255,0.04)',
                            border:
                              daysUntilDeadline < 0
                                ? '1px solid rgba(239,68,68,0.2)'
                                : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="text-[9px] uppercase tracking-wider text-text-muted">
                            Prazo
                          </div>
                          <div
                            className="mt-0.5 text-xs font-bold"
                            style={{
                              color:
                                daysUntilDeadline < 0
                                  ? '#EF4444'
                                  : daysUntilDeadline < 90
                                    ? '#F5C842'
                                    : '#8899BB',
                            }}
                          >
                            {daysUntilDeadline < 0
                              ? `${Math.abs(daysUntilDeadline)}d vencido`
                              : daysUntilDeadline === 0
                                ? 'Hoje!'
                                : `${daysUntilDeadline}d restantes`}
                          </div>
                        </div>
                      )}

                      {/* Needed per month to hit deadline */}
                      {neededPerMonth !== null && neededPerMonth > 0 && remaining > 0 && (
                        <div
                          className="rounded-lg px-2.5 py-1.5"
                          style={{
                            background: isOnTrack ? 'rgba(0,255,136,0.06)' : 'rgba(239,68,68,0.06)',
                            border: isOnTrack
                              ? '1px solid rgba(0,255,136,0.15)'
                              : '1px solid rgba(239,68,68,0.15)',
                          }}
                        >
                          <div className="text-[9px] uppercase tracking-wider text-text-muted">
                            Necessário/mês
                          </div>
                          <div
                            className="mt-0.5 text-xs font-bold"
                            style={{ color: isOnTrack ? '#00FF88' : '#EF4444' }}
                          >
                            {formatBRL(neededPerMonth)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer insight ────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,77,0,0.04)',
            border: '1px solid rgba(255,77,0,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {dangerCount > 0 ? '⚠️' : onTrackCount === insights.length ? '🏆' : '💡'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {dangerCount > 0
                ? `${dangerCount} meta${dangerCount !== 1 ? 's' : ''} em risco de não bater o prazo — considere aumentar os aportes.`
                : onTrackCount === insights.length
                  ? 'Todas as metas estão no prazo. Ótima disciplina financeira!'
                  : 'Continue aportando regularmente para atingir seus objetivos.'}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              Faltam {formatBRL(totalRemaining)} para completar todas as metas ativas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
