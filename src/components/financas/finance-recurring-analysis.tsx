import { createClient } from '@/lib/supabase/server';
import { RefreshCw, AlertTriangle, TrendingDown } from 'lucide-react';

interface TxRow {
  id: string;
  description: string;
  amount: number;
  type: string;
  transaction_date: string;
  category_id: string | null;
  is_paid: boolean;
}

interface RecurringPattern {
  normalizedName: string;
  displayName: string;
  amount: number;
  avgAmount: number;
  type: string;
  occurrences: number;
  dates: string[];
  categoryId: string | null;
  isSubscription: boolean;
  daysBetween: number | null;
  monthlyEquivalent: number;
  consistency: number; // 0-100
  lastSeen: string;
  nextExpected: string | null;
  amountVariance: number; // std dev as % of avg
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 áàâãéèêíïóôõöúü]/g, '')
    .trim()
    .slice(0, 40);
}

function formatBRL(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `R$${(abs / 1000).toFixed(1)}k`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export async function FinanceRecurringAnalysis({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    .toISOString()
    .split('T')[0]!;

  const { data: raw } = await supabase
    .from('transactions')
    .select('id, description, amount, type, transaction_date, category_id, is_paid')
    .eq('user_id', userId)
    .gte('transaction_date', sixMonthsAgo)
    .order('transaction_date', { ascending: true })
    .limit(3000);

  const txns = (raw ?? []) as TxRow[];
  if (txns.length < 4) return null;

  // Group transactions by normalized description + type
  const groups = new Map<string, TxRow[]>();
  for (const t of txns) {
    const key = `${t.type}::${normalize(t.description)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  // Identify recurring patterns (at least 2 occurrences, amount within 20% variance)
  const patterns: RecurringPattern[] = [];

  for (const [key, txList] of groups.entries()) {
    if (txList.length < 2) continue;

    const amounts = txList.map((t) => Number(t.amount));
    const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const sd = stdDev(amounts);
    const variance = avgAmount > 0 ? (sd / avgAmount) * 100 : 0;

    // Only include if amount variance is under 30%
    if (variance > 30) continue;

    const dates = txList.map((t) => t.transaction_date).sort();
    const lastSeen = dates[dates.length - 1]!;

    // Compute average days between occurrences
    let avgDaysBetween: number | null = null;
    if (dates.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const d = (new Date(dates[i]!).getTime() - new Date(dates[i - 1]!).getTime()) / 86400000;
        diffs.push(d);
      }
      avgDaysBetween = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
    }

    // Monthly equivalent cost
    const monthlyEquivalent =
      avgDaysBetween && avgDaysBetween > 0 ? (avgAmount / avgDaysBetween) * 30 : avgAmount;

    // Is subscription: approximately monthly (25-35 days) or weekly (5-9 days) or annual (~330-380)
    const isSubscription =
      avgDaysBetween !== null &&
      ((avgDaysBetween >= 25 && avgDaysBetween <= 35) ||
        (avgDaysBetween >= 5 && avgDaysBetween <= 9) ||
        (avgDaysBetween >= 330 && avgDaysBetween <= 380));

    // Consistency: how regular the interval is (lower std dev in intervals = higher consistency)
    let consistency = 100;
    if (avgDaysBetween !== null && dates.length >= 3) {
      const diffs: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const d = (new Date(dates[i]!).getTime() - new Date(dates[i - 1]!).getTime()) / 86400000;
        diffs.push(d);
      }
      const intervalSd = stdDev(diffs);
      const intervalVariance = avgDaysBetween > 0 ? (intervalSd / avgDaysBetween) * 100 : 0;
      consistency = Math.max(0, Math.round(100 - intervalVariance));
    }

    // Next expected date
    let nextExpected: string | null = null;
    if (avgDaysBetween !== null && lastSeen) {
      const nextDate = new Date(lastSeen);
      nextDate.setDate(nextDate.getDate() + avgDaysBetween);
      nextExpected = nextDate.toISOString().split('T')[0]!;
    }

    const displayName = txList[0]!.description.slice(0, 35);
    const [type] = key.split('::');

    patterns.push({
      normalizedName: key,
      displayName,
      amount: avgAmount,
      avgAmount,
      type: type!,
      occurrences: txList.length,
      dates,
      categoryId: txList[0]!.category_id,
      isSubscription,
      daysBetween: avgDaysBetween,
      monthlyEquivalent,
      consistency,
      lastSeen,
      nextExpected,
      amountVariance: variance,
    });
  }

  if (patterns.length === 0) return null;

  // Sort: subscriptions first, then by monthly equivalent descending
  patterns.sort((a, b) => {
    if (a.isSubscription && !b.isSubscription) return -1;
    if (!a.isSubscription && b.isSubscription) return 1;
    return b.monthlyEquivalent - a.monthlyEquivalent;
  });

  const topPatterns = patterns.slice(0, 10);

  // Totals
  const subscriptions = patterns.filter((p) => p.isSubscription && p.type === 'expense');
  const subscriptionCost = subscriptions.reduce((s, p) => s + p.monthlyEquivalent, 0);
  const recurringExpense = patterns
    .filter((p) => p.type === 'expense')
    .reduce((s, p) => s + p.monthlyEquivalent, 0);

  const todayStr = now.toISOString().split('T')[0]!;
  const upcomingThisWeek = topPatterns.filter((p) => {
    if (!p.nextExpected) return false;
    const daysAway = Math.ceil(
      (new Date(p.nextExpected).getTime() - new Date(todayStr).getTime()) / 86400000
    );
    return daysAway >= 0 && daysAway <= 7;
  });

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,217,255,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(0,217,255,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(0,217,255,0.05)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
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
                <RefreshCw size={12} style={{ color: '#00D9FF' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Transações Recorrentes
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Padrões Detectados</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {patterns.length} padrão{patterns.length !== 1 ? 'ões' : ''} identificado
              {patterns.length !== 1 ? 's' : ''} · últimos 6 meses
            </p>
          </div>

          {/* Subscription total */}
          {subscriptionCost > 0 && (
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: '#FF4D00' }}>
                {formatBRL(subscriptionCost)}/mês
              </div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">
                em assinaturas
              </div>
            </div>
          )}
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[
            {
              label: 'Recorrentes',
              value: String(patterns.filter((p) => p.type === 'expense').length),
              color: '#FF4D00',
              rgb: '255,77,0',
            },
            {
              label: 'Assinaturas',
              value: String(subscriptions.length),
              color: '#00D9FF',
              rgb: '0,217,255',
            },
            {
              label: 'Custo mensal',
              value: formatBRL(recurringExpense),
              color: '#EF4444',
              rgb: '239,68,68',
            },
            {
              label: 'Esta semana',
              value: String(upcomingThisWeek.length),
              color: '#F5C842',
              rgb: '245,200,66',
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

        {/* ── Recurring list ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Top Padrões Identificados
          </div>
          <div className="space-y-1.5">
            {topPatterns.map((p, i) => {
              const isExpense = p.type === 'expense';
              const daysTilNext = p.nextExpected
                ? Math.ceil(
                    (new Date(p.nextExpected).getTime() - new Date(todayStr).getTime()) / 86400000
                  )
                : null;
              const isComingUp = daysTilNext !== null && daysTilNext >= 0 && daysTilNext <= 7;

              const freqLabel = p.daysBetween
                ? p.daysBetween <= 9
                  ? 'Semanal'
                  : p.daysBetween <= 35
                    ? 'Mensal'
                    : p.daysBetween <= 100
                      ? 'Bimestral'
                      : p.daysBetween <= 200
                        ? 'Semestral'
                        : 'Anual'
                : 'Variável';

              return (
                <div
                  key={p.normalizedName}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{
                    background: isComingUp
                      ? 'rgba(245,200,66,0.06)'
                      : i === 0 && p.isSubscription
                        ? 'rgba(0,217,255,0.05)'
                        : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isComingUp ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                    style={{
                      background: p.isSubscription
                        ? 'rgba(0,217,255,0.12)'
                        : isExpense
                          ? 'rgba(255,77,0,0.1)'
                          : 'rgba(0,255,136,0.1)',
                      color: p.isSubscription ? '#00D9FF' : isExpense ? '#FF4D00' : '#00FF88',
                    }}
                  >
                    {p.isSubscription ? '🔄' : isExpense ? '↓' : '↑'}
                  </div>

                  {/* Name + details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{p.displayName}</span>
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px]"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: '#8899BB',
                        }}
                      >
                        {freqLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[9px] text-text-muted">
                      <span>
                        {p.occurrences}× detectado{p.occurrences !== 1 ? 's' : ''}
                      </span>
                      <span>· consis. {p.consistency}%</span>
                      {daysTilNext !== null && daysTilNext >= 0 && (
                        <span style={{ color: isComingUp ? '#F5C842' : '#8899BB' }}>
                          · {daysTilNext === 0 ? 'hoje' : `em ${daysTilNext}d`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <div
                      className="text-sm font-bold"
                      style={{ color: isExpense ? '#FF4D00' : '#00FF88' }}
                    >
                      {isExpense ? '-' : '+'}
                      {formatBRL(p.avgAmount)}
                    </div>
                    {p.daysBetween && p.daysBetween > 31 && (
                      <div className="text-[9px] text-text-muted">
                        {formatBRL(p.monthlyEquivalent)}/mês
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: subscriptionCost > 500 ? 'rgba(239,68,68,0.05)' : 'rgba(0,217,255,0.04)',
            border:
              subscriptionCost > 500
                ? '1px solid rgba(239,68,68,0.1)'
                : '1px solid rgba(0,217,255,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {subscriptionCost > 500 ? '⚠️' : upcomingThisWeek.length > 0 ? '📅' : '🔍'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {subscriptions.length > 0
                ? `${subscriptions.length} assinatura${subscriptions.length !== 1 ? 's' : ''} detectada${subscriptions.length !== 1 ? 's' : ''} — ${formatBRL(subscriptionCost)}/mês`
                : `${patterns.length} padrão${patterns.length !== 1 ? 'ões' : ''} recorrente${patterns.length !== 1 ? 's' : ''} identificado${patterns.length !== 1 ? 's' : ''}`}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {upcomingThisWeek.length > 0
                ? `${upcomingThisWeek.length} transação${upcomingThisWeek.length !== 1 ? 'ões' : ''} recorrente${upcomingThisWeek.length !== 1 ? 's' : ''} esperada${upcomingThisWeek.length !== 1 ? 's' : ''} esta semana.`
                : `Custo recorrente total: ${formatBRL(recurringExpense)}/mês (${formatBRL(recurringExpense * 12)}/ano).`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
