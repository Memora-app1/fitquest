import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@/lib/utils';
import { TrendingDown } from 'lucide-react';

interface TxRow {
  amount: number;
  transaction_date: string;
  type: string;
}

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_WEEK_LABELS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];

export async function SpendingDowHeatmap({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  // Last 3 months of paid expenses
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    .toISOString()
    .split('T')[0]!;

  const { data: raw } = await supabase
    .from('transactions')
    .select('amount, transaction_date, type')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .eq('is_paid', true)
    .gte('transaction_date', threeMonthsAgo)
    .lte('transaction_date', now.toISOString().split('T')[0]!)
    .order('transaction_date', { ascending: true })
    .limit(1500);

  const rows = (raw ?? []) as TxRow[];
  if (rows.length === 0) return null;

  // ── Day-of-week stats (0=Sun…6=Sat) ─────────────────────────────
  const dowTotal = new Array(7).fill(0) as number[];
  const dowCount = new Array(7).fill(0) as number[];

  // ── Week-of-month × day-of-week heatmap (5 × 7) ─────────────────
  // Week of month: 0 = days 1-7, 1 = days 8-14, 2 = 15-21, 3 = 22-28, 4 = 29+
  const womDow = Array.from({ length: 5 }, () => new Array(7).fill(0)) as number[][];
  const womDowCount = Array.from({ length: 5 }, () => new Array(7).fill(0)) as number[][];

  for (const r of rows) {
    const d = new Date(r.transaction_date + 'T12:00:00');
    const dow = d.getDay();
    const dom = d.getDate(); // 1-31
    const wom = Math.min(4, Math.floor((dom - 1) / 7)); // 0-4
    const amt = Number(r.amount);

    dowTotal[dow] = (dowTotal[dow] ?? 0) + amt;
    dowCount[dow] = (dowCount[dow] ?? 0) + 1;
    womDow[wom]![dow] = (womDow[wom]![dow] ?? 0) + amt;
    womDowCount[wom]![dow] = (womDowCount[wom]![dow] ?? 0) + 1;
  }

  // Average per day-of-week (total / occurrences of that DOW in the 3-month window)
  // Count how many of each DOW occurred in the window
  const dowOccurrences = new Array(7).fill(0) as number[];
  const d = new Date(threeMonthsAgo + 'T12:00:00');
  const endD = new Date(now);
  while (d <= endD) {
    dowOccurrences[d.getDay()] = (dowOccurrences[d.getDay()] ?? 0) + 1;
    d.setDate(d.getDate() + 1);
  }

  const dowAvg = dowTotal.map((total, i) =>
    (dowOccurrences[i] ?? 1) > 0 ? total / (dowOccurrences[i] ?? 1) : 0
  );
  const maxDowAvg = Math.max(...dowAvg, 1);

  // Highest and lowest spending DOW
  const highestDow = dowAvg.indexOf(Math.max(...dowAvg));
  const lowestDow = dowAvg.reduce(
    (minIdx, val, i) =>
      dowAvg[i]! > 0 && (dowAvg[minIdx] ?? 0) === 0
        ? i
        : val > 0 && val < (dowAvg[minIdx] ?? Infinity)
          ? i
          : minIdx,
    highestDow
  );

  // WOM×DOW heatmap max (for normalization)
  const maxWomDow = Math.max(...womDow.flat(), 1);

  // Total and per-week stats
  const totalExpense = rows.reduce((s, r) => s + Number(r.amount), 0);
  const avgPerDay =
    rows.length > 0
      ? Math.round(
          totalExpense /
            Math.max(1, Math.ceil((now.getTime() - new Date(threeMonthsAgo).getTime()) / 86400000))
        )
      : 0;

  // Color for heatmap cell
  function heatColor(val: number, maxVal: number): string {
    if (val === 0) return 'rgba(255,255,255,0.04)';
    const intensity = val / maxVal;
    if (intensity <= 0.2) return 'rgba(245,200,66,0.12)';
    if (intensity <= 0.4) return 'rgba(245,200,66,0.28)';
    if (intensity <= 0.6) return 'rgba(255,100,0,0.42)';
    if (intensity <= 0.8) return 'rgba(255,77,0,0.6)';
    return 'rgba(255,77,0,0.88)';
  }

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
        style={{ background: 'rgba(255,77,0,0.06)' }}
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
                <TrendingDown size={12} style={{ color: '#FF4D00' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Padrão de gastos — 3 meses
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Quando você mais gasta?</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {rows.length} transações · média {formatBRL(avgPerDay)}/dia
            </p>
          </div>

          <div className="text-right">
            <div className="mb-1 text-xs uppercase tracking-wider text-text-muted">
              Dia mais caro
            </div>
            <div className="text-xl font-black" style={{ color: '#FF4D00' }}>
              {DOW_LABELS[highestDow]}
            </div>
            <div className="text-xs text-text-muted">
              {formatBRL(dowAvg[highestDow] ?? 0)}/semana
            </div>
          </div>
        </div>

        {/* ── DOW Bar Chart ─────────────────────────────────────────────── */}
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
            Gasto médio por dia da semana
          </div>
          <div className="flex h-24 items-end gap-2">
            {DOW_LABELS.map((label, dow) => {
              const avg = dowAvg[dow] ?? 0;
              const heightPct = maxDowAvg > 0 ? (avg / maxDowAvg) * 100 : 0;
              const isHighest = dow === highestDow;
              const isLowest = dow === lowestDow && avg > 0;
              const isWeekend = dow === 0 || dow === 6;

              return (
                <div
                  key={dow}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                  title={`${label}: ${formatBRL(avg)} média`}
                >
                  <div
                    className="text-center text-[9px] font-bold"
                    style={{ color: isHighest ? '#FF4D00' : isLowest ? '#00FF88' : 'transparent' }}
                  >
                    {isHighest ? '▲' : isLowest ? '▼' : ''}
                  </div>
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${Math.max(heightPct, avg > 0 ? 3 : 0)}%`,
                      minHeight: avg > 0 ? '3px' : '0px',
                      background: isHighest
                        ? 'linear-gradient(180deg, #FF4D00 0%, rgba(255,77,0,0.5) 100%)'
                        : isLowest && avg > 0
                          ? 'linear-gradient(180deg, #00FF88 0%, rgba(0,255,136,0.4) 100%)'
                          : isWeekend
                            ? 'linear-gradient(180deg, rgba(245,200,66,0.7) 0%, rgba(245,200,66,0.25) 100%)'
                            : 'linear-gradient(180deg, rgba(255,77,0,0.55) 0%, rgba(255,77,0,0.2) 100%)',
                    }}
                  />
                  <div
                    className="text-[9px] font-medium"
                    style={{
                      color: isHighest ? '#FF4D00' : isWeekend ? 'rgba(245,200,66,0.7)' : '#4A5568',
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Avg labels below bars */}
          <div className="mt-1 flex gap-2">
            {dowAvg.map((avg, dow) => (
              <div
                key={dow}
                className="flex-1 text-center text-[8px]"
                style={{ color: avg > 0 ? 'rgba(255,255,255,0.35)' : 'transparent' }}
              >
                {avg >= 1000 ? `${(avg / 1000).toFixed(1)}k` : Math.round(avg)}
              </div>
            ))}
          </div>
        </div>

        {/* ── Week-of-Month × DOW Heatmap ──────────────────────────────── */}
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
            Mapa de calor — semana do mês × dia da semana
          </div>
          <div className="overflow-x-auto">
            <div style={{ minWidth: '320px' }}>
              {/* DOW header */}
              <div className="mb-1 flex" style={{ paddingLeft: '64px' }}>
                {DOW_LABELS.map((label, dow) => (
                  <div
                    key={dow}
                    className="flex-1 text-center text-[9px] font-medium text-text-muted"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Rows: weeks of month */}
              {MONTH_WEEK_LABELS.map((weekLabel, wom) => {
                const rowHasData = womDow[wom]!.some((v) => v > 0);
                if (!rowHasData) return null;

                return (
                  <div key={wom} className="mb-1 flex items-center gap-0">
                    {/* Week label */}
                    <div
                      className="shrink-0 pr-2 text-right text-[9px] text-text-muted"
                      style={{ width: '64px' }}
                    >
                      {weekLabel}
                    </div>

                    {/* Cells */}
                    {DOW_LABELS.map((_, dow) => {
                      const val = womDow[wom]![dow] ?? 0;
                      const count = womDowCount[wom]![dow] ?? 0;
                      const avg = count > 0 ? val / count : 0;

                      return (
                        <div
                          key={dow}
                          className="mx-0.5 flex-1 cursor-default rounded-sm"
                          style={{
                            height: '28px',
                            background: heatColor(val, maxWomDow),
                            border:
                              val > 0 ? '1px solid rgba(255,77,0,0.15)' : '1px solid transparent',
                          }}
                          title={`${weekLabel} · ${DOW_LABELS[dow]}: ${formatBRL(avg)} média (${count} ocorrências)`}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {/* Heat legend */}
              <div className="mt-2 flex items-center gap-2 pl-16">
                <span className="text-[9px] text-text-muted">Menos</span>
                {[0.04, 0.12, 0.28, 0.42, 0.6, 0.88].map((alpha, i) => (
                  <div
                    key={i}
                    className="rounded-sm"
                    style={{
                      width: '16px',
                      height: '12px',
                      background: i === 0 ? 'rgba(255,255,255,0.04)' : `rgba(255,77,0,${alpha})`,
                    }}
                  />
                ))}
                <span className="text-[9px] text-text-muted">Mais</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Insight Footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,77,0,0.04)',
            border: '1px solid rgba(255,77,0,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">💡</span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {DOW_LABELS[highestDow]} é seu dia de mais gastos —{' '}
              {formatBRL(dowAvg[highestDow] ?? 0)} em média.
              {lowestDow !== highestDow &&
              dowAvg[lowestDow] !== undefined &&
              (dowAvg[lowestDow] ?? 0) > 0
                ? ` ${DOW_LABELS[lowestDow]} é o mais econômico (${formatBRL(dowAvg[lowestDow] ?? 0)}).`
                : ''}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              Baseado em {rows.length} transações nos últimos 3 meses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
