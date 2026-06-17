import { createClient } from '@/lib/supabase/server';
import { Zap, TrendingUp, Star } from 'lucide-react';
import { LEVELS, calculateLevel, getLevelInfo } from '@/lib/xp';

interface XpRow {
  amount: number;
  source_type: string | null;
  created_at: string;
}

function formatXp(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

const SOURCE_META: Record<string, { label: string; color: string; rgb: string; emoji: string }> = {
  habit: { label: 'Hábitos', color: '#00FF88', rgb: '0,255,136', emoji: '🔥' },
  task: { label: 'Tarefas', color: '#7C3AED', rgb: '124,58,237', emoji: '✅' },
  workout: { label: 'Treinos', color: '#FF4D00', rgb: '255,77,0', emoji: '💪' },
  other: { label: 'Outros', color: '#F5C842', rgb: '245,200,66', emoji: '⭐' },
};

export async function XpLevelJourney({
  userId,
  xpTotal,
  currentLevel,
}: {
  userId: string;
  xpTotal: number;
  currentLevel: number;
}) {
  const supabase = await createClient();

  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [recentRes, monthlyRes] = await Promise.all([
    // Last 30 days breakdown by source
    supabase
      .from('xp_transactions')
      .select('amount, source_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1000),
    // Last 6 months for monthly chart
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', sixMonthsAgo)
      .order('created_at', { ascending: true })
      .limit(5000),
  ]);

  const recent = (recentRes.data ?? []) as XpRow[];
  const monthly = (monthlyRes.data ?? []) as XpRow[];

  if (recent.length === 0 && monthly.length === 0) return null;

  // ── Level roadmap ──────────────────────────────────────────────────
  const levelInfo = getLevelInfo(currentLevel);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel + 1);
  const levelXpMin = levelInfo.minXp;
  const levelXpMax = nextLevel ? nextLevel.minXp : xpTotal;
  const levelRange = levelXpMax - levelXpMin;
  const levelProgress =
    levelRange > 0 ? Math.min(100, Math.round(((xpTotal - levelXpMin) / levelRange) * 100)) : 100;
  const xpToNext = nextLevel ? Math.max(0, nextLevel.minXp - xpTotal) : 0;

  // ── Last 30d source breakdown ──────────────────────────────────────
  const sourceTotals: Record<string, number> = { habit: 0, task: 0, workout: 0, other: 0 };
  for (const r of recent) {
    const src = r.source_type ?? 'other';
    const key = ['habit', 'task', 'workout'].includes(src) ? src : 'other';
    sourceTotals[key] = (sourceTotals[key] ?? 0) + r.amount;
  }
  const total30d = Object.values(sourceTotals).reduce((s, v) => s + v, 0);

  // ── Monthly XP (last 6 months) ─────────────────────────────────────
  const monthTotals = new Map<string, number>();
  for (const r of monthly) {
    const m = r.created_at.slice(0, 7); // YYYY-MM
    monthTotals.set(m, (monthTotals.get(m) ?? 0) + r.amount);
  }
  // Build ordered 6-month array (even if no data)
  const now = new Date();
  const sixMonths: Array<{ key: string; label: string; total: number }> = [];
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = d.toISOString().slice(0, 7)!;
    sixMonths.push({
      key,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
      total: monthTotals.get(key) ?? 0,
    });
  }
  const maxMonthXp = Math.max(...sixMonths.map((m) => m.total), 1);

  // Current month vs previous month trend
  const currMonth = sixMonths[5]?.total ?? 0;
  const prevMonth = sixMonths[4]?.total ?? 0;
  const monthTrend = prevMonth > 0 ? Math.round(((currMonth - prevMonth) / prevMonth) * 100) : null;

  return (
    <div className="space-y-4">
      {/* ── Level Progress ───────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 md:p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(245,200,66,0.16)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: 'rgba(245,200,66,0.06)' }}
        />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(245,200,66,0.12)',
                border: '1px solid rgba(245,200,66,0.22)',
              }}
            >
              <Star size={12} style={{ color: '#F5C842' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Jornada de Level
            </span>
          </div>

          {/* Current level hero */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{
                background: 'rgba(245,200,66,0.12)',
                border: '1px solid rgba(245,200,66,0.25)',
              }}
            >
              {levelInfo.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black" style={{ color: '#F5C842' }}>
                  Nível {currentLevel}
                </span>
                <span className="text-base font-bold text-text-secondary">{levelInfo.title}</span>
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                {xpTotal.toLocaleString('pt-BR')} XP total
                {nextLevel &&
                  ` · faltam ${xpToNext.toLocaleString('pt-BR')} XP para nível ${currentLevel + 1}`}
              </div>
            </div>
          </div>

          {/* Level progress bar */}
          {nextLevel && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>
                  Nível {currentLevel} — {levelInfo.title}
                </span>
                <span>{levelProgress}%</span>
                <span>
                  Nível {currentLevel + 1} — {nextLevel.title}
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${levelProgress}%`,
                    background: 'linear-gradient(90deg, #F5C842, #FF9500)',
                  }}
                />
              </div>
              <div className="text-right text-[10px] text-text-muted">
                {(xpTotal - levelXpMin).toLocaleString('pt-BR')} /{' '}
                {levelRange.toLocaleString('pt-BR')} XP neste nível
              </div>
            </div>
          )}

          {/* Full level roadmap */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              Roadmap completo
            </div>
            <div className="flex gap-1">
              {LEVELS.filter((l) => l.level <= 8).map((l) => {
                const isDone = currentLevel > l.level;
                const isCurrent = currentLevel === l.level;
                const isNext = currentLevel + 1 === l.level;
                return (
                  <div
                    key={l.level}
                    className="flex flex-1 flex-col items-center gap-1"
                    title={`Nível ${l.level}: ${l.title} (${l.minXp.toLocaleString('pt-BR')} XP)`}
                  >
                    <div
                      className="flex h-6 w-full items-center justify-center rounded-lg text-sm"
                      style={{
                        background: isDone
                          ? 'rgba(245,200,66,0.25)'
                          : isCurrent
                            ? 'rgba(245,200,66,0.15)'
                            : 'rgba(255,255,255,0.04)',
                        border: isCurrent
                          ? '2px solid rgba(245,200,66,0.7)'
                          : isNext
                            ? '1px dashed rgba(245,200,66,0.3)'
                            : isDone
                              ? '1px solid rgba(245,200,66,0.3)'
                              : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span
                        className={
                          isDone ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-30'
                        }
                      >
                        {l.emoji}
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold"
                      style={{
                        color: isCurrent
                          ? '#F5C842'
                          : isDone
                            ? 'rgba(245,200,66,0.6)'
                            : 'rgba(136,153,187,0.4)',
                      }}
                    >
                      {l.level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── XP Source Breakdown (30d) ────────────────────────────────── */}
      {total30d > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(0,255,136,0.1)',
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(0,255,136,0.12)',
                border: '1px solid rgba(0,255,136,0.22)',
              }}
            >
              <Zap size={12} style={{ color: '#00FF88' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              XP por Fonte — 30 dias
            </span>
            <span className="ml-auto text-sm font-black" style={{ color: '#00FF88' }}>
              +{formatXp(total30d)} XP
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(sourceTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([src, amount]) => {
                if (amount === 0) return null;
                const meta = SOURCE_META[src] ?? SOURCE_META.other!;
                const barPct = Math.round((amount / Math.max(total30d, 1)) * 100);
                const pct = Math.round((amount / total30d) * 100);
                return (
                  <div key={src} className="flex items-center gap-2.5">
                    <span className="shrink-0 text-base">{meta.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="text-xs font-medium">{meta.label}</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="text-[10px] text-text-muted">{pct}%</span>
                          <span className="text-xs font-bold" style={{ color: meta.color }}>
                            +{formatXp(amount)}
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${barPct}%`, background: meta.color, opacity: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Stacked distribution strip */}
          <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
            {Object.entries(sourceTotals)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([src, amount]) => {
                const meta = SOURCE_META[src] ?? SOURCE_META.other!;
                const pct = Math.round((amount / total30d) * 100);
                return (
                  <div
                    key={src}
                    style={{ width: `${pct}%`, background: meta.color, opacity: 0.75 }}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* ── Monthly XP chart (6 months) ─────────────────────────────── */}
      {sixMonths.some((m) => m.total > 0) && (
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.1)',
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
              <TrendingUp size={12} style={{ color: '#7C3AED' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              XP mensal — 6 meses
            </span>
            {monthTrend !== null && (
              <span
                className="ml-auto text-xs font-bold"
                style={{ color: monthTrend >= 0 ? '#00FF88' : '#EF4444' }}
              >
                {monthTrend >= 0 ? '+' : ''}
                {monthTrend}% este mês
              </span>
            )}
          </div>

          {/* Bar chart */}
          <div className="flex h-20 items-end gap-2">
            {sixMonths.map((m, i) => {
              const barH = Math.round((m.total / maxMonthXp) * 100);
              const isCurr = i === 5;
              return (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className="text-[9px] font-bold"
                    style={{
                      color: isCurr ? '#7C3AED' : m.total > 0 ? '#5A6B8A' : 'rgba(90,107,138,0.3)',
                    }}
                  >
                    {m.total > 0 ? formatXp(m.total) : ''}
                  </span>
                  <div
                    className="w-full overflow-hidden rounded-t-lg"
                    style={{ height: '52px', display: 'flex', alignItems: 'flex-end' }}
                  >
                    <div
                      className="w-full rounded-t-lg"
                      style={{
                        height: `${Math.max(4, barH)}%`,
                        background: isCurr
                          ? 'linear-gradient(180deg, #7C3AED, rgba(124,58,237,0.5))'
                          : m.total > 0
                            ? 'rgba(124,58,237,0.35)'
                            : 'rgba(255,255,255,0.04)',
                        border: isCurr ? '1px solid rgba(124,58,237,0.6)' : 'none',
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] capitalize text-text-muted"
                    style={{ color: isCurr ? '#7C3AED' : undefined }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
