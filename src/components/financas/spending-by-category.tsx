import { createClient } from '@/lib/supabase/server';
import { PieChart, TrendingDown, TrendingUp, Calendar } from 'lucide-react';

interface TxRow {
  amount: number;
  type: string;
  transaction_date: string;
  category_id: string | null;
  finance_categories: { name: string; icon: string | null; color: string | null } | null;
}

interface CategoryStat {
  id: string;
  name: string;
  icon: string;
  color: string;
  rgb: string;
  total: number;
  count: number;
  prevTotal: number;
  pct: number;
  barPct: number;
}

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOW_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function hexToRgb(hex: string | null): string {
  if (!hex) return '255,77,0';
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '255,77,0';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function formatBRL(v: number): string {
  const abs = Math.abs(v);
  const prefix = v < 0 ? '-' : '';
  if (abs >= 1000000) return `${prefix}R$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${prefix}R$${(abs / 1000).toFixed(1)}k`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`;
}

export async function SpendingByCategory({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]!;
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split('T')[0]!;
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]!;

  // Fetch this month + previous month side by side
  const { data: raw } = await supabase
    .from('transactions')
    .select('amount, type, transaction_date, category_id, finance_categories(name, icon, color)')
    .eq('user_id', userId)
    .gte('transaction_date', prevMonthStart)
    .lte('transaction_date', now.toISOString().split('T')[0]!)
    .order('transaction_date', { ascending: false })
    .limit(2000);

  const rows = (raw ?? []) as unknown as TxRow[];
  if (rows.length === 0) return null;

  const thisMonth = rows.filter((r) => r.transaction_date >= thisMonthStart!);
  const prevMonth = rows.filter(
    (r) => r.transaction_date >= prevMonthStart && r.transaction_date <= prevMonthEnd
  );

  const expenses = thisMonth.filter((r) => r.type === 'expense');
  const incomes = thisMonth.filter((r) => r.type === 'income');
  const prevExpenses = prevMonth.filter((r) => r.type === 'expense');

  const totalExpense = expenses.reduce((s, r) => s + Number(r.amount), 0);
  const totalIncome = incomes.reduce((s, r) => s + Number(r.amount), 0);
  const prevTotalExpense = prevExpenses.reduce((s, r) => s + Number(r.amount), 0);

  if (totalExpense === 0 && totalIncome === 0) return null;

  const daysInMonth = now.getDate();
  const avgPerDay = daysInMonth > 0 ? totalExpense / daysInMonth : 0;
  const expenseChg =
    prevTotalExpense > 0 ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100 : null;
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : null;

  // ── Build expense category map ────────────────────────────────────
  const expCatMap = new Map<
    string,
    { name: string; icon: string; color: string; total: number; count: number }
  >();
  for (const r of expenses) {
    const key = r.category_id ?? '__none__';
    const cat = r.finance_categories;
    const name = cat?.name ?? 'Sem categoria';
    const icon = cat?.icon ?? '📦';
    const color = cat?.color ?? '#FF4D00';
    const existing = expCatMap.get(key);
    if (!existing) {
      expCatMap.set(key, { name, icon, color, total: Number(r.amount), count: 1 });
    } else {
      existing.total += Number(r.amount);
      existing.count++;
    }
  }

  // Previous month category totals
  const prevExpCatMap = new Map<string, number>();
  for (const r of prevExpenses) {
    const key = r.category_id ?? '__none__';
    prevExpCatMap.set(key, (prevExpCatMap.get(key) ?? 0) + Number(r.amount));
  }

  // Build income category map
  const incCatMap = new Map<
    string,
    { name: string; icon: string; color: string; total: number; count: number }
  >();
  for (const r of incomes) {
    const key = r.category_id ?? '__none__';
    const cat = r.finance_categories;
    const name = cat?.name ?? 'Sem categoria';
    const icon = cat?.icon ?? '💰';
    const color = cat?.color ?? '#00FF88';
    const existing = incCatMap.get(key);
    if (!existing) {
      incCatMap.set(key, { name, icon, color, total: Number(r.amount), count: 1 });
    } else {
      existing.total += Number(r.amount);
      existing.count++;
    }
  }

  // Sort expense categories descending, take top 8
  const sortedExpCats: CategoryStat[] = Array.from(expCatMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([id, cat]) => ({
      id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      rgb: hexToRgb(cat.color),
      total: cat.total,
      count: cat.count,
      prevTotal: prevExpCatMap.get(id) ?? 0,
      pct: totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
      barPct: 0, // set below
    }));

  const maxExpCat = sortedExpCats[0]?.total ?? 1;
  for (const c of sortedExpCats) c.barPct = Math.round((c.total / maxExpCat) * 100);

  // Sort income categories descending, take top 5
  const sortedIncCats: CategoryStat[] = Array.from(incCatMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([id, cat]) => ({
      id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      rgb: hexToRgb(cat.color),
      total: cat.total,
      count: cat.count,
      prevTotal: 0,
      pct: totalIncome > 0 ? Math.round((cat.total / totalIncome) * 100) : 0,
      barPct: 0,
    }));
  const maxIncCat = sortedIncCats[0]?.total ?? 1;
  for (const c of sortedIncCats) c.barPct = Math.round((c.total / maxIncCat) * 100);

  // ── Day-of-week spending (this month expenses) ─────────────────────
  const dowTotals = [0, 0, 0, 0, 0, 0, 0];
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const r of expenses) {
    const dow = new Date(r.transaction_date + 'T12:00:00').getDay();
    dowTotals[dow] = (dowTotals[dow] ?? 0) + Number(r.amount);
    dowCounts[dow] = (dowCounts[dow] ?? 0) + 1;
  }
  const dowAvgs = dowTotals.map((t, i) => (dowCounts[i]! > 0 ? t / dowCounts[i]! : 0));
  const maxDowAvg = Math.max(...dowAvgs, 1);
  const heaviestDow = dowAvgs.indexOf(Math.max(...dowAvgs));

  return (
    <div className="space-y-4">
      {/* ── Monthly overview strip ────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 md:p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(239,68,68,0.14)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        />

        <div className="relative z-10 space-y-4">
          <div className="mb-1 flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.22)',
              }}
            >
              <PieChart size={12} style={{ color: '#EF4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Gastos por Categoria
            </span>
            <span className="ml-auto text-xs text-text-muted">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {[
              {
                label: 'Total gastos',
                value: formatBRL(totalExpense),
                sub:
                  expenseChg !== null
                    ? `${formatPct(expenseChg)} vs mês passado`
                    : `${daysInMonth} dias registrados`,
                color: '#EF4444',
                rgb: '239,68,68',
              },
              {
                label: 'Média/dia',
                value: formatBRL(avgPerDay),
                sub: `${expenses.length} transações`,
                color: '#FF4D00',
                rgb: '255,77,0',
              },
              {
                label: 'Receitas',
                value: formatBRL(totalIncome),
                sub: `${incomes.length} entradas`,
                color: '#00FF88',
                rgb: '0,255,136',
              },
              {
                label: 'Taxa poupança',
                value: savingsRate !== null ? `${Math.max(0, savingsRate)}%` : '–',
                sub: savingsRate !== null && savingsRate > 0 ? 'do que entrou' : 'sem dados',
                color: '#F5C842',
                rgb: '245,200,66',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${s.rgb},0.15)`,
                }}
              >
                <div className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">
                  {s.label}
                </div>
                <div className="text-sm font-black leading-none" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="mt-1 text-[10px] leading-tight text-text-muted">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Expense categories ───────────────────────────────────────── */}
      {sortedExpCats.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(239,68,68,0.12)',
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <TrendingDown size={12} style={{ color: '#EF4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Onde saiu o dinheiro
            </span>
            <span className="ml-auto text-xs text-text-muted">
              {sortedExpCats.length} categorias
            </span>
          </div>

          <div className="space-y-3">
            {sortedExpCats.map((cat, i) => {
              const catChg =
                cat.prevTotal > 0 ? ((cat.total - cat.prevTotal) / cat.prevTotal) * 100 : null;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    {/* Rank + icon */}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                      style={{
                        background: `rgba(${cat.rgb},0.12)`,
                        border: `1px solid rgba(${cat.rgb},0.2)`,
                      }}
                    >
                      {cat.icon}
                    </div>

                    {/* Name + bar */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold">{cat.name}</span>
                          {i === 0 && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                            >
                              MAIOR
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {catChg !== null && (
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: catChg > 0 ? '#EF4444' : '#00FF88' }}
                            >
                              {formatPct(catChg)}
                            </span>
                          )}
                          <span className="text-xs font-bold" style={{ color: cat.color }}>
                            {formatBRL(cat.total)}
                          </span>
                          <span className="w-6 text-right text-[10px] text-text-muted">
                            {cat.pct}%
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${cat.barPct}%`,
                            background: `rgba(${cat.rgb},0.8)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expense category mini breakdown pct bars */}
          <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
            {sortedExpCats.map((cat) => (
              <div
                key={cat.id}
                title={`${cat.name}: ${cat.pct}%`}
                style={{ width: `${cat.pct}%`, background: cat.color, opacity: 0.8 }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sortedExpCats.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                <span className="text-[9px] text-text-muted">
                  {cat.name} {cat.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Income categories ────────────────────────────────────────── */}
      {sortedIncCats.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(0,255,136,0.12)',
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(0,255,136,0.12)',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <TrendingUp size={12} style={{ color: '#00FF88' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              De onde veio o dinheiro
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedIncCats.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{
                    background: `rgba(${cat.rgb},0.1)`,
                    border: `1px solid rgba(${cat.rgb},0.2)`,
                  }}
                >
                  {cat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="truncate text-xs font-medium">{cat.name}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-[10px] text-text-muted">{cat.pct}%</span>
                      <span className="text-xs font-bold" style={{ color: '#00FF88' }}>
                        {formatBRL(cat.total)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.barPct}%`,
                        background: i === 0 ? '#00FF88' : 'rgba(0,255,136,0.5)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Day-of-week spending pattern ─────────────────────────────── */}
      {expenses.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-5"
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
              <Calendar size={12} style={{ color: '#7C3AED' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Padrão de gastos por dia
            </span>
            {heaviestDow >= 0 && dowAvgs[heaviestDow]! > 0 && (
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
              >
                mais gasta: {DOW_LABELS[heaviestDow]}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {DOW_LONG.map((dayLong, dow) => {
              const avg = dowAvgs[dow] ?? 0;
              const barPct = Math.round((avg / maxDowAvg) * 100);
              const isHeaviest = dow === heaviestDow && avg > 0;
              return (
                <div key={dayLong} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[10px] text-text-muted">{dayLong}</span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barPct}%`,
                        background: isHeaviest ? '#EF4444' : 'rgba(239,68,68,0.4)',
                      }}
                    />
                  </div>
                  <span
                    className="w-14 shrink-0 text-right text-[10px] font-bold"
                    style={{ color: isHeaviest ? '#EF4444' : '#5A6B8A' }}
                  >
                    {avg > 0 ? formatBRL(avg) : '–'}
                  </span>
                </div>
              );
            })}
          </div>

          {heaviestDow >= 0 && dowAvgs[heaviestDow]! > 0 && (
            <div
              className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.1)',
              }}
            >
              <span className="shrink-0 text-lg">💸</span>
              <p className="text-xs text-text-muted">
                Você gasta mais às{' '}
                <span className="font-bold text-white">{DOW_LONG[heaviestDow]}s</span> — média de{' '}
                <span className="font-bold" style={{ color: '#EF4444' }}>
                  {formatBRL(dowAvgs[heaviestDow]!)}
                </span>{' '}
                por transação.{' '}
                {dowAvgs[heaviestDow]! > avgPerDay * 1.5
                  ? 'Bem acima da sua média diária.'
                  : 'Dentro do esperado.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
