import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { TransactionsView } from '@/components/financas/transactions-view';
import { SpendingByCategory } from '@/components/financas/spending-by-category';
import { FinanceMonthCalendar } from '@/components/financas/finance-month-calendar';
import { FinanceRecurringAnalysis } from '@/components/financas/finance-recurring-analysis';
import { SpendingDowHeatmap } from '@/components/financas/spending-dow-heatmap';
import { formatBRL } from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Transações',
  description: 'Histórico completo de receitas e despesas.',
};

export const dynamic = 'force-dynamic';

export default async function TransacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [txRes, accRes, catRes] = await Promise.all([
    supabase
      .from('transactions')
      .select(
        'id, user_id, account_id, category_id, amount, type, description, notes, transaction_date, is_installment, installment_current, installment_total, installment_group_id, is_recurring, recurrence_rule, parent_transaction_id, is_paid, paid_at, transfer_to_account_id, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(100),
    supabase
      .from('finance_accounts')
      .select('id, name, icon, color')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(50),
    supabase
      .from('finance_categories')
      .select('id, name, icon, color, type, is_global')
      .or(`user_id.eq.${user.id},is_global.eq.true`)
      .limit(500),
  ]);

  const transactions = txRes.data ?? [];
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const isPositive = balance >= 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: isPositive
              ? 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
            border: isPositive
              ? '1px solid rgba(0,255,136,0.18)'
              : '1px solid rgba(239,68,68,0.18)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: isPositive
                ? 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <h1 className="heading-display text-4xl md:text-5xl">Transações</h1>
            <p className="mt-1 text-text-secondary">
              {transactions.length > 0
                ? `${transactions.length} movimentações`
                : 'Todas as suas movimentações em um só lugar.'}
            </p>
          </div>
        </div>

        {/* ── Quick Stats ─────────────────────────────────────────────── */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full blur-xl"
                style={{ background: 'rgba(0,255,136,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-brand-green" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">Receitas</span>
                </div>
                <div className="heading-display text-xl text-brand-green">
                  {formatBRL(totalIncome)}
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full blur-xl"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <TrendingDown size={12} className="text-brand-red" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">Despesas</span>
                </div>
                <div className="heading-display text-xl text-brand-red">
                  {formatBRL(totalExpense)}
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background: isPositive
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)',
                border: isPositive
                  ? '1px solid rgba(124,58,237,0.2)'
                  : '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full blur-xl"
                style={{ background: isPositive ? 'rgba(124,58,237,0.2)' : 'rgba(239,68,68,0.15)' }}
              />
              <div className="relative z-10">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <ArrowLeftRight
                    size={12}
                    className={isPositive ? 'text-brand-purple' : 'text-brand-red'}
                  />
                  <span className="text-xs uppercase tracking-wider text-text-muted">Saldo</span>
                </div>
                <div
                  className="heading-display text-xl"
                  style={{ color: isPositive ? '#7C3AED' : '#EF4444' }}
                >
                  {isPositive ? '+' : ''}
                  {formatBRL(balance)}
                </div>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
          <FinanceMonthCalendar userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-56 rounded-2xl" />}>
          <SpendingByCategory userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
          <FinanceRecurringAnalysis userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
          <SpendingDowHeatmap userId={user.id} />
        </Suspense>

        <Suspense fallback={<div className="text-text-secondary">Carregando...</div>}>
          <TransactionsView
            transactions={transactions}
            accounts={accRes.data ?? []}
            categories={catRes.data ?? []}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
