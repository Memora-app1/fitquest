'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  X,
  Search,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';
import { formatBRL, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  transaction_date: string;
  is_paid: boolean;
  is_installment: boolean;
  installment_current: number | null;
  installment_total: number | null;
  is_recurring: boolean;
  category_id: string | null;
  account_id: string | null;
}

interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
  is_global: boolean;
}

type FilterType = 'all' | 'income' | 'expense' | 'pending' | 'subscription';

function groupByDate(txs: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = tx.transaction_date.split('T')[0]!;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

function formatGroupDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Hoje';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';

  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function TransactionsView({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [search, setSearch] = useState('');
  const { toasts, showXp } = useXpToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [localTxs, setLocalTxs] = useState<Transaction[]>(transactions);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filtered = useMemo(() => {
    let result = localTxs;
    if (filter === 'income') result = result.filter((t) => t.type === 'income');
    else if (filter === 'expense') result = result.filter((t) => t.type === 'expense');
    else if (filter === 'pending') result = result.filter((t) => !t.is_paid);
    else if (filter === 'subscription')
      result = result.filter((t) => t.is_recurring && t.type === 'expense');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.description.toLowerCase().includes(q));
    }
    return result;
  }, [localTxs, filter, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const { totalIncome, totalExpense, net, pendingCount } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let pending = 0;
    for (const t of localTxs) {
      if (t.is_paid) {
        if (t.type === 'income') income += Number(t.amount);
        else if (t.type === 'expense') expense += Number(t.amount);
      } else {
        pending++;
      }
    }
    return { totalIncome: income, totalExpense: expense, net: income - expense, pendingCount: pending };
  }, [localTxs]);

  async function deleteTransaction(id: string) {
    setDeletingId(id);
    setLocalTxs((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    setDeletingId(null);
    router.refresh();
  }

  async function togglePaid(tx: Transaction) {
    setTogglingId(tx.id);
    const newPaid = !tx.is_paid;
    setLocalTxs((prev) => prev.map((t) => (t.id === tx.id ? { ...t, is_paid: newPaid } : t)));
    const res = await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tx.id, is_paid: newPaid }),
    });
    if (res.ok && newPaid) {
      const data = (await res.json()) as { xpEarned?: number };
      if (data.xpEarned) showXp(data.xpEarned);
    }
    setTogglingId(null);
    router.refresh();
  }

  const subscriptionTotal = useMemo(
    () =>
      localTxs
        .filter((t) => t.is_recurring && t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0),
    [localTxs]
  );

  const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tudo' },
    { key: 'income', label: 'Receitas' },
    { key: 'expense', label: 'Despesas' },
    { key: 'pending', label: `Pendentes${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'subscription', label: '🔄 Assinaturas' },
  ];

  return (
    <>
      <XpToastContainer toasts={toasts} />
      {/* Stats bar */}
      {localTxs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(0,255,136,0.18)',
            }}
          >
            <div className="mb-1 flex items-center justify-center gap-1.5 text-brand-green">
              <TrendingUp size={14} />
              <span className="text-xs uppercase tracking-wide">Receitas</span>
            </div>
            <div className="heading-display text-xl text-brand-green">{formatBRL(totalIncome)}</div>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(239,68,68,0.18)',
            }}
          >
            <div className="mb-1 flex items-center justify-center gap-1.5 text-brand-red">
              <TrendingDown size={14} />
              <span className="text-xs uppercase tracking-wide">Despesas</span>
            </div>
            <div className="heading-display text-xl text-brand-red">{formatBRL(totalExpense)}</div>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background:
                net >= 0
                  ? 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.98) 100%)',
              border:
                net >= 0 ? '1px solid rgba(0,255,136,0.18)' : '1px solid rgba(239,68,68,0.18)',
            }}
          >
            <div className="mb-1 flex items-center justify-center gap-1.5 text-text-secondary">
              <Minus size={14} />
              <span className="text-xs uppercase tracking-wide">Saldo</span>
            </div>
            <div
              className={`heading-display text-xl ${net >= 0 ? 'text-brand-green' : 'text-brand-red'}`}
            >
              {net >= 0 ? '' : '-'}
              {formatBRL(Math.abs(net))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar transações…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn-primary flex shrink-0 items-center gap-2"
        >
          <Plus size={16} />
          Nova transação
        </button>
      </div>

      {/* Subscription summary panel */}
      {filter === 'subscription' && (
        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.3)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
            style={{ background: 'rgba(124,58,237,0.18)' }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <RefreshCw size={14} style={{ color: '#7C3AED' }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#7C3AED' }}
                >
                  Assinaturas recorrentes
                </span>
              </div>
              <div className="text-xs text-text-muted">
                {filtered.length} assinatura{filtered.length !== 1 ? 's' : ''} ativa
                {filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="heading-display text-2xl text-brand-red">
                {formatBRL(subscriptionTotal)}
              </div>
              <div className="text-[10px] text-text-muted">total registrado</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === tab.key
                ? 'bg-brand-orange text-white'
                : 'bg-bg-elevated text-text-secondary hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-12 text-center"
          style={{
            background:
              localTxs.length === 0
                ? 'linear-gradient(135deg, rgba(255,77,0,0.06) 0%, rgba(13,24,41,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border:
              localTxs.length === 0
                ? '1px solid rgba(255,77,0,0.18)'
                : '1px solid rgba(124,58,237,0.18)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
            style={{
              background: localTxs.length === 0 ? 'rgba(255,77,0,0.12)' : 'rgba(124,58,237,0.12)',
            }}
          />
          <div className="relative z-10">
            {localTxs.length === 0 ? (
              <>
                <div className="mb-3 text-4xl">💸</div>
                <h3 className="mb-1 text-xl font-bold">Nenhuma transação ainda</h3>
                <p className="mb-4 text-text-secondary">
                  Registre suas movimentações pra ganhar XP
                </p>
                <button type="button" onClick={() => setShowNew(true)} className="btn-primary">
                  Adicionar primeira transação
                </button>
              </>
            ) : (
              <>
                <div className="mb-3 text-4xl">🔍</div>
                <h3 className="mb-1 text-xl font-bold">Nada encontrado</h3>
                <p className="text-text-secondary">Tente outro filtro ou termo de busca</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Grouped transaction list */}
      {grouped.length > 0 && (
        <div className="space-y-5">
          {grouped.map(([dateKey, txs]) => {
            const dayIncome = txs
              .filter((t) => t.type === 'income' && t.is_paid)
              .reduce((s, t) => s + Number(t.amount), 0);
            const dayExpense = txs
              .filter((t) => t.type === 'expense' && t.is_paid)
              .reduce((s, t) => s + Number(t.amount), 0);

            return (
              <div key={dateKey}>
                {/* Group header */}
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold capitalize text-text-secondary">
                    {formatGroupDate(dateKey)}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    {dayIncome > 0 && (
                      <span className="text-brand-green">+{formatBRL(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-brand-red">-{formatBRL(dayExpense)}</span>
                    )}
                  </div>
                </div>

                {/* Day transactions */}
                <div className="space-y-1.5">
                  {txs.map((tx) => {
                    const cat = tx.category_id ? catMap.get(tx.category_id) : null;
                    const acc = tx.account_id ? accMap.get(tx.account_id) : null;
                    const isDeleting = deletingId === tx.id;
                    const isToggling = togglingId === tx.id;

                    return (
                      <div
                        key={tx.id}
                        className="group flex items-center gap-3 rounded-xl p-3.5 transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: tx.is_paid
                            ? '1px solid rgba(255,255,255,0.07)'
                            : '1px solid rgba(255,255,255,0.04)',
                          opacity: isDeleting ? 0.3 : tx.is_paid ? 1 : 0.75,
                        }}
                      >
                        {/* Category icon */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                          style={{
                            backgroundColor: cat?.color
                              ? `${cat.color}22`
                              : tx.type === 'income'
                                ? '#00FF8822'
                                : '#FF4D0022',
                          }}
                        >
                          {cat?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{tx.description}</span>
                            {tx.is_installment &&
                              tx.installment_current &&
                              tx.installment_total && (
                                <span className="shrink-0 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                                  {tx.installment_current}/{tx.installment_total}x
                                </span>
                              )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                            {cat && <span>{cat.name}</span>}
                            {cat && acc && <span>·</span>}
                            {acc && (
                              <span>
                                {acc.icon} {acc.name}
                              </span>
                            )}
                            {!tx.is_paid && (
                              <span className="font-medium text-brand-gold">· Pendente</span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div
                          className={cn(
                            'shrink-0 text-sm font-bold tabular-nums',
                            tx.type === 'income' ? 'text-brand-green' : 'text-brand-red'
                          )}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatBRL(Number(tx.amount))}
                        </div>

                        {/* Actions — visible on hover */}
                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {/* Toggle paid */}
                          <button
                            onClick={() => togglePaid(tx)}
                            disabled={isToggling}
                            className={cn(
                              'rounded-lg p-1.5 transition-colors',
                              tx.is_paid
                                ? 'text-brand-green hover:bg-brand-green/10'
                                : 'text-text-muted hover:bg-brand-green/10 hover:text-brand-green'
                            )}
                            title={tx.is_paid ? 'Marcar como pendente' : 'Marcar como pago'}
                          >
                            {tx.is_paid ? <CheckCircle size={14} /> : <Clock size={14} />}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            disabled={isDeleting}
                            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-brand-red/10 hover:text-brand-red"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {localTxs.length >= 100 && (
            <p className="py-2 text-center text-sm text-text-muted">
              Mostrando as 100 transações mais recentes
            </p>
          )}
        </div>
      )}

      {/* Modais */}
      {showNew && accounts.length === 0 && <NoAccountModal onClose={() => setShowNew(false)} />}
      {showNew && accounts.length > 0 && (
        <NewTransactionModal
          accounts={accounts}
          categories={categories}
          onClose={() => setShowNew(false)}
          onCreated={(tx) => {
            setLocalTxs((prev) => [tx, ...prev]);
            setShowNew(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ─── NoAccount ────────────────────────────────────────────────────────────────
function NoAccountModal({ onClose }: { onClose: () => void }) {
  useScrollLock(true);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md space-y-4 overflow-hidden rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(124,58,237,0.2)' }}
        />
        <div className="relative z-10">
          <h2 className="text-xl font-bold">Cadastre uma conta primeiro</h2>
          <p className="text-text-secondary">
            Você precisa ter pelo menos 1 conta cadastrada antes de registrar transações.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Voltar
            </button>
            <a href="/financas/contas" className="btn-primary flex-1">
              Cadastrar conta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Transaction Modal ─────────────────────────────────────────────────────
function NewTransactionModal({
  accounts,
  categories,
  onClose,
  onCreated,
}: {
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onCreated: (tx: Transaction) => void;
}) {
  useScrollLock(true);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!);
  const [installments, setInstallments] = useState(1);
  const [isPaid, setIsPaid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');
  const parsedAmount = parseFloat(amount) || 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || parsedAmount <= 0) return;
    setError(null);
    setLoading(true);

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        description: description.trim(),
        amount: parsedAmount,
        account_id: accountId,
        category_id: categoryId || null,
        transaction_date: date,
        installments,
        is_paid: isPaid,
      }),
    });

    setLoading(false);

    if (res.ok) {
      const data = (await res.json()) as {
        transaction?: Transaction;
        transactions?: Transaction[];
        achievementsUnlocked?: string[];
      };
      for (const slug of data.achievementsUnlocked ?? []) {
        window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }));
      }
      const created = data.transaction ?? data.transactions?.[0];
      if (created) onCreated(created);
      else onClose();
    } else {
      setError('Erro ao registrar. Tente novamente.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-4 md:items-center"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative my-4 w-full max-w-md animate-slide-up space-y-4 overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(255,77,0,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(255,77,0,0.12)' }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nova transação</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-muted hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className={cn(
              'rounded-xl border p-3 font-medium transition-all',
              type === 'expense'
                ? 'border-brand-red bg-brand-red/20 text-brand-red'
                : 'border-border bg-bg-elevated text-text-secondary hover:border-brand-red/40'
            )}
          >
            💸 Despesa
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className={cn(
              'rounded-xl border p-3 font-medium transition-all',
              type === 'income'
                ? 'border-brand-green bg-brand-green/20 text-brand-green'
                : 'border-border bg-bg-elevated text-text-secondary hover:border-brand-green/40'
            )}
          >
            💰 Receita
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Amount — destaque */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">
              R$
            </span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input heading-display w-full pl-12 text-2xl font-bold"
              autoFocus
            />
          </div>

          <input
            required
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input w-full"
            maxLength={200}
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input w-full"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input w-full"
            >
              <option value="">Sem categoria</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-full"
          />

          {/* Paid toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-bg-elevated p-3">
            <div
              className={cn(
                'relative h-6 w-10 rounded-full transition-all',
                isPaid ? 'bg-brand-green' : 'bg-border'
              )}
              onClick={() => setIsPaid(!isPaid)}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                  isPaid ? 'left-4.5' : 'left-0.5'
                )}
                style={{ left: isPaid ? '18px' : '2px' }}
              />
            </div>
            <span className="text-sm">{isPaid ? 'Já pago / recebido' : 'Pendente'}</span>
          </label>

          {/* Installments */}
          {type === 'expense' && (
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-text-secondary">Parcelas</span>
                <span className="font-bold">
                  {installments}x
                  {installments > 1 && parsedAmount > 0 && (
                    <span className="ml-1 font-normal text-text-muted">
                      ({formatBRL(parsedAmount / installments)} cada)
                    </span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full accent-brand-orange"
              />
              <div className="mt-0.5 flex justify-between text-xs text-text-muted">
                <span>1x</span>
                <span>12x</span>
                <span>24x</span>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-brand-red/20 bg-brand-red/10 p-2 text-sm text-brand-red">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !description.trim() || parsedAmount <= 0}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading
              ? 'Registrando…'
              : `+ Registrar ${type === 'income' ? 'receita' : 'despesa'} (+5 XP)`}
          </button>
        </form>
      </div>
    </div>
  );
}
