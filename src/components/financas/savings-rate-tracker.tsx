import { createClient } from '@/lib/supabase/server';
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';

interface TxRow {
  amount: number;
  type: string;
  transaction_date: string;
}

interface MonthData {
  key: string;
  label: string;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number | null;
  isCurrent: boolean;
}

function formatBRL(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000000) return `${v < 0 ? '-' : ''}R$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${v < 0 ? '-' : ''}R$${(abs / 1000).toFixed(1)}k`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function rateColor(rate: number | null): string {
  if (rate === null) return '#5A6B8A';
  if (rate >= 30) return '#00FF88';
  if (rate >= 15) return '#F5C842';
  if (rate >= 0) return '#FF4D00';
  return '#EF4444';
}

function rateLabel(rate: number | null): string {
  if (rate === null) return '–';
  if (rate >= 50) return 'Excelente! 🏆';
  if (rate >= 30) return 'Muito bom 💚';
  if (rate >= 20) return 'Bom 👍';
  if (rate >= 10) return 'Razoável ⚡';
  if (rate >= 0) return 'Baixo — atenção! ⚠️';
  return 'Gastando mais que ganha! 🚨';
}

export async function SavingsRateTracker({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .split('T')[0]!;

  const { data: raw } = await supabase
    .from('transactions')
    .select('amount, type, transaction_date')
    .eq('user_id', userId)
    .gte('transaction_date', sixMonthsAgo)
    .order('transaction_date', { ascending: true });

  const rows = (raw ?? []) as TxRow[];
  if (rows.length === 0) return null;

  // Build monthly buckets for last 6 months
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const r of rows) {
    const key = r.transaction_date.slice(0, 7); // YYYY-MM
    if (!monthMap.has(key)) monthMap.set(key, { income: 0, expense: 0 });
    const m = monthMap.get(key)!;
    if (r.type === 'income') m.income += Number(r.amount);
    else m.expense += Number(r.amount);
  }

  const months: MonthData[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const data = monthMap.get(key) ?? { income: 0, expense: 0 };
    const savings = data.income - data.expense;
    const savingsRate = data.income > 0 ? Math.round((savings / data.income) * 100) : null;
    months.push({
      key,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
      income: data.income,
      expense: data.expense,
      savings,
      savingsRate,
      isCurrent: offset === 0,
    });
  }

  const activeMonths = months.filter((m) => m.income > 0 || m.expense > 0);
  if (activeMonths.length === 0) return null;

  const currentMonth = months[5]!;
  const prevMonth = months[4]!;
  const avgRate =
    activeMonths
      .filter((m) => m.savingsRate !== null && m.income > 0)
      .reduce((s, m) => s + (m.savingsRate ?? 0), 0) /
    Math.max(activeMonths.filter((m) => m.income > 0).length, 1);

  const annualProjection =
    currentMonth.income > 0 ? (currentMonth.income - currentMonth.expense) * 12 : null;

  const trend =
    prevMonth.savingsRate !== null && currentMonth.savingsRate !== null
      ? currentMonth.savingsRate - prevMonth.savingsRate
      : null;

  const maxBarHeight = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 1);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(0,255,136,0.14)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(0,255,136,0.06)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(0,255,136,0.12)',
                  border: '1px solid rgba(0,255,136,0.22)',
                }}
              >
                <PiggyBank size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Taxa de Poupança — 6 meses
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Evolução de Poupança</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Média de {Math.round(avgRate)}% de poupança · {rateLabel(Math.round(avgRate))}
            </p>
          </div>

          {/* Current month rate */}
          <div className="text-right">
            <div
              className="text-3xl font-black"
              style={{ color: rateColor(currentMonth.savingsRate) }}
            >
              {currentMonth.savingsRate !== null ? `${currentMonth.savingsRate}%` : '–'}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">este mês</div>
            {trend !== null && (
              <div
                className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-bold"
                style={{ color: trend >= 0 ? '#00FF88' : '#EF4444' }}
              >
                {trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {trend >= 0 ? '+' : ''}
                {trend}pp vs mês passado
              </div>
            )}
          </div>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[
            {
              label: 'Poupança este mês',
              value: formatBRL(currentMonth.savings),
              color: currentMonth.savings >= 0 ? '#00FF88' : '#EF4444',
              rgb: currentMonth.savings >= 0 ? '0,255,136' : '239,68,68',
            },
            {
              label: 'Taxa média 6M',
              value: `${Math.round(avgRate)}%`,
              color: rateColor(Math.round(avgRate)),
              rgb: '0,255,136',
            },
            {
              label: 'Projeção anual',
              value: annualProjection !== null ? formatBRL(annualProjection) : '–',
              color: annualProjection && annualProjection > 0 ? '#F5C842' : '#5A6B8A',
              rgb: '245,200,66',
            },
            {
              label: 'Receitas (mês)',
              value: formatBRL(currentMonth.income),
              color: '#7C3AED',
              rgb: '124,58,237',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3"
              style={{
                background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid rgba(${s.rgb},0.14)`,
              }}
            >
              <div className="mb-1 text-[9px] uppercase tracking-wider text-text-muted">
                {s.label}
              </div>
              <div className="text-sm font-black leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Grouped bar chart: income vs expense per month ───────────── */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Receita vs Despesa
          </div>
          <div className="flex h-24 items-end gap-2">
            {months.map((m) => {
              const incomeH = Math.round((m.income / maxBarHeight) * 72);
              const expenseH = Math.round((m.expense / maxBarHeight) * 72);
              return (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                  {/* Value label */}
                  {m.savingsRate !== null && m.isCurrent && (
                    <span
                      className="text-[8px] font-bold"
                      style={{ color: rateColor(m.savingsRate) }}
                    >
                      {m.savingsRate}%
                    </span>
                  )}

                  {/* Bars side-by-side */}
                  <div className="flex w-full items-end gap-0.5" style={{ height: '64px' }}>
                    {/* Income bar */}
                    <div
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${Math.max(2, incomeH)}px`,
                        background: m.isCurrent ? '#00FF88' : 'rgba(0,255,136,0.35)',
                      }}
                    />
                    {/* Expense bar */}
                    <div
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${Math.max(2, expenseH)}px`,
                        background: m.isCurrent ? '#EF4444' : 'rgba(239,68,68,0.35)',
                      }}
                    />
                  </div>

                  {/* Month label */}
                  <span
                    className="text-[9px] capitalize"
                    style={{ color: m.isCurrent ? '#00FF88' : '#5A6B8A' }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[9px] text-text-muted">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm" style={{ background: 'rgba(0,255,136,0.6)' }} />
              <span>Receita</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm" style={{ background: 'rgba(239,68,68,0.5)' }} />
              <span>Despesa</span>
            </div>
          </div>
        </div>

        {/* ── Monthly savings rate trend ───────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Taxa de poupança por mês
          </div>
          <div className="space-y-1.5">
            {months
              .filter((m) => m.income > 0)
              .map((m) => {
                const rate = m.savingsRate ?? 0;
                const barPct = Math.min(100, Math.max(0, rate));
                const isNeg = rate < 0;
                return (
                  <div key={m.key} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-[9px] capitalize text-text-muted">
                      {m.label}
                    </span>
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${isNeg ? 0 : barPct}%`,
                          background: rateColor(rate),
                          opacity: m.isCurrent ? 0.9 : 0.55,
                        }}
                      />
                    </div>
                    <span
                      className="w-8 shrink-0 text-right text-[9px] font-bold"
                      style={{ color: rateColor(rate) }}
                    >
                      {m.savingsRate !== null ? `${rate}%` : '–'}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(0,255,136,0.04)',
            border: '1px solid rgba(0,255,136,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {avgRate >= 30 ? '🏆' : avgRate >= 15 ? '💚' : avgRate >= 5 ? '⚡' : '⚠️'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">{rateLabel(Math.round(avgRate))}</p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {avgRate >= 20
                ? 'Meta recomendada: poupar 20%+ da renda. Você está no caminho certo!'
                : 'Meta recomendada: poupar 20%+ da renda. Tente reduzir despesas variáveis.'}
              {annualProjection !== null &&
                annualProjection > 0 &&
                ` Projeção: ${formatBRL(annualProjection)} poupados em 12 meses.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
