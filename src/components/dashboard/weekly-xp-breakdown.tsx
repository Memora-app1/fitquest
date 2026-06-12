import { createClient } from '@/lib/supabase/server';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface XpTxRow {
  amount: number;
  source_type: string;
  created_at: string;
}

const SOURCE_META: Record<string, { label: string; emoji: string; color: string; rgb: string }> = {
  habit: { label: 'Hábitos', emoji: '🔥', color: '#FF4D00', rgb: '255,77,0' },
  task: { label: 'Tarefas', emoji: '✅', color: '#7C3AED', rgb: '124,58,237' },
  workout: { label: 'Treinos', emoji: '💪', color: '#00FF88', rgb: '0,255,136' },
  finance: { label: 'Finanças', emoji: '💰', color: '#F5C842', rgb: '245,200,66' },
  achievement: { label: 'Conquistas', emoji: '🏆', color: '#EC4899', rgb: '236,72,153' },
  streak: { label: 'Streak', emoji: '⚡', color: '#00D9FF', rgb: '0,217,255' },
  level_up: { label: 'Level Up', emoji: '🚀', color: '#8B5CF6', rgb: '139,92,246' },
};

const DOW_LABELS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export async function WeeklyXpBreakdown({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();

  // Last 14 days to compare week vs prior week
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  const { data: raw } = await supabase
    .from('xp_transactions')
    .select('amount, source_type, created_at')
    .eq('user_id', userId)
    .gte('created_at', fourteenDaysAgo)
    .order('created_at', { ascending: true });

  const rows = (raw ?? []) as XpTxRow[];
  if (rows.length === 0) return null;

  // Split into this week (last 7 days) vs prior week
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const thisWeekRows = rows.filter((r) => new Date(r.created_at) >= sevenDaysAgo);
  const lastWeekRows = rows.filter((r) => new Date(r.created_at) < sevenDaysAgo);

  if (thisWeekRows.length === 0) return null;

  const thisWeekTotal = thisWeekRows.reduce((s, r) => s + Number(r.amount), 0);
  const lastWeekTotal = lastWeekRows.reduce((s, r) => s + Number(r.amount), 0);
  const weekDiff =
    lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : null;

  // Daily totals for last 7 days
  const dailyXp = new Array(7).fill(0) as number[];
  const dailyLabels: string[] = [];
  const dailyDates: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    dailyDates.push(toISO(d));
    dailyLabels.push(DOW_LABELS_SHORT[d.getDay()]!);
  }

  for (const r of thisWeekRows) {
    const rDate = toISO(new Date(r.created_at));
    const idx = dailyDates.indexOf(rDate);
    if (idx !== -1) dailyXp[idx] = (dailyXp[idx] ?? 0) + Number(r.amount);
  }

  const maxDailyXp = Math.max(...dailyXp, 1);

  // By source type (this week)
  const bySource = new Map<string, number>();
  for (const r of thisWeekRows) {
    const s = r.source_type ?? 'other';
    bySource.set(s, (bySource.get(s) ?? 0) + Number(r.amount));
  }

  const sourceBreakdown = Array.from(bySource.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, xp]) => ({
      type,
      xp,
      pct: thisWeekTotal > 0 ? Math.round((xp / thisWeekTotal) * 100) : 0,
      meta: SOURCE_META[type] ?? { label: type, emoji: '⭐', color: '#8899BB', rgb: '136,153,187' },
    }));

  // Best day
  const bestDayIdx = dailyXp.indexOf(Math.max(...dailyXp));
  const bestDayLabel = dailyLabels[bestDayIdx] ?? '';
  const bestDayXp = dailyXp[bestDayIdx] ?? 0;

  // Today's XP
  const todayStr = toISO(now);
  const todayIdx = dailyDates.indexOf(todayStr);
  const todayXp = todayIdx !== -1 ? (dailyXp[todayIdx] ?? 0) : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.14)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(245,200,66,0.07)' }}
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
                <Zap size={12} style={{ color: '#F5C842' }} fill="#F5C842" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                XP — últimos 7 dias
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Análise de XP Semanal</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {thisWeekTotal.toLocaleString('pt-BR')} XP acumulados esta semana
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: '#F5C842' }}>
              +{thisWeekTotal.toLocaleString('pt-BR')}
            </div>
            {weekDiff !== null && (
              <div
                className="mt-0.5 flex items-center justify-end gap-1 text-xs font-bold"
                style={{ color: weekDiff >= 0 ? '#00FF88' : '#EF4444' }}
              >
                {weekDiff >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {weekDiff >= 0 ? '+' : ''}
                {weekDiff}% vs semana passada
              </div>
            )}
          </div>
        </div>

        {/* ── Daily Bar Chart ────────────────────────────────────────────── */}
        <div>
          <div className="flex h-20 items-end gap-1.5">
            {dailyXp.map((xp, i) => {
              const heightPct = maxDailyXp > 0 ? (xp / maxDailyXp) * 100 : 0;
              const isToday = dailyDates[i] === todayStr;
              const isBest = xp === bestDayXp && xp > 0;

              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                  title={`${dailyLabels[i]}: ${xp.toLocaleString('pt-BR')} XP`}
                >
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${Math.max(heightPct, xp > 0 ? 3 : 0)}%`,
                      minHeight: xp > 0 ? '3px' : '0px',
                      background: isToday
                        ? 'linear-gradient(180deg, #F5C842 0%, rgba(245,200,66,0.5) 100%)'
                        : isBest
                          ? 'linear-gradient(180deg, #00FF88 0%, rgba(0,255,136,0.4) 100%)'
                          : 'linear-gradient(180deg, rgba(245,200,66,0.7) 0%, rgba(245,200,66,0.25) 100%)',
                    }}
                  />
                  <div
                    className="text-center text-[9px] font-medium"
                    style={{ color: isToday ? '#F5C842' : '#5A6B8A' }}
                  >
                    {dailyLabels[i]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* XP amounts on bars (only if > 0 and fits) */}
          <div className="mt-1 flex gap-1.5">
            {dailyXp.map((xp, i) => (
              <div
                key={i}
                className="flex-1 text-center text-[8px]"
                style={{ color: xp > 0 ? 'rgba(245,200,66,0.7)' : 'transparent' }}
              >
                {xp > 0 ? (xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp) : ''}
              </div>
            ))}
          </div>
        </div>

        {/* ── Source Breakdown ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
            XP por categoria
          </div>
          {sourceBreakdown.map(({ type, xp, pct, meta }) => (
            <div key={type} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-center text-base">{meta.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium">{meta.label}</span>
                  <span className="ml-2 shrink-0 text-xs font-bold" style={{ color: meta.color }}>
                    +{xp.toLocaleString('pt-BR')} XP
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, rgba(${meta.rgb},0.9), rgba(${meta.rgb},0.4))`,
                    }}
                  />
                </div>
              </div>
              <span
                className="shrink-0 text-[10px] font-semibold"
                style={{ width: '28px', textAlign: 'right', color: '#5A6B8A' }}
              >
                {pct}%
              </span>
            </div>
          ))}
        </div>

        {/* ── Quick Stats Row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: 'rgba(245,200,66,0.06)',
              border: '1px solid rgba(245,200,66,0.12)',
            }}
          >
            <div className="text-xl font-black text-brand-gold">
              +{todayXp.toLocaleString('pt-BR')}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wider text-text-muted">
              XP hoje
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <div className="text-xl font-black text-brand-green">
              {bestDayXp > 0 ? `+${bestDayXp.toLocaleString('pt-BR')}` : '—'}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wider text-text-muted">
              Melhor dia ({bestDayLabel})
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.12)',
            }}
          >
            <div className="text-xl font-black text-brand-purple">
              +{Math.round(thisWeekTotal / 7).toLocaleString('pt-BR')}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wider text-text-muted">
              Média diária
            </div>
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
            {weekDiff !== null && weekDiff >= 20
              ? '🚀'
              : weekDiff !== null && weekDiff >= 0
                ? '⭐'
                : '💡'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {weekDiff !== null && weekDiff >= 20
                ? `Semana explosiva — ${weekDiff}% mais XP que na semana anterior!`
                : weekDiff !== null && weekDiff >= 0
                  ? `Consistência ótima — +${thisWeekTotal.toLocaleString('pt-BR')} XP esta semana.`
                  : weekDiff !== null
                    ? `Semana mais fraca. Retome a consistência amanhã!`
                    : `Bom começo — continue acumulando XP todos os dias!`}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {sourceBreakdown.length > 0
                ? `Maior fonte: ${sourceBreakdown[0]!.meta.label} (${sourceBreakdown[0]!.pct}% do total)`
                : 'Complete ações para ganhar XP em todas as categorias.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
