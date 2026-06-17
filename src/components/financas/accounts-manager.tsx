'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Pencil, Trash2, Wallet, CreditCard, TrendingUp, Building2 } from 'lucide-react';
import { formatBRL } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface Account {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  current_balance: number;
  credit_limit: number | null;
  closing_day: number | null;
  due_day: number | null;
  is_active: boolean;
}

const TYPES = [
  { value: 'checking', label: 'Conta Corrente', icon: '🏦' },
  { value: 'savings', label: 'Poupança', icon: '🐷' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'investment', label: 'Investimento', icon: '📈' },
];

const COLORS = [
  '#7C3AED',
  '#FF4D00',
  '#00FF88',
  '#F5C842',
  '#3B82F6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return '124,58,237';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

export function AccountsManager({ initialAccounts }: { initialAccounts: Account[] }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [showNew, setShowNew] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalAssets = accounts
    .filter((a) => a.type !== 'credit_card' && Number(a.current_balance) > 0)
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

  const totalDebt = accounts
    .filter((a) => Number(a.current_balance) < 0)
    .reduce((sum, a) => sum + Math.abs(Number(a.current_balance)), 0);

  const totalCredit = accounts
    .filter((a) => a.credit_limit)
    .reduce((sum, a) => sum + Number(a.credit_limit), 0);

  const netWorth = accounts
    .filter((a) => a.type !== 'credit_card')
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

  async function handleDelete(id: string) {
    if (!confirm('Remover esta conta? As transações associadas serão mantidas.')) return;
    setDeleting(id);
    const res = await fetch(`/api/finance-accounts?id=${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    }
  }

  return (
    <>
      {/* Summary cards */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background:
                netWorth >= 0
                  ? 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.98) 100%)',
              border:
                netWorth >= 0 ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full blur-xl"
              style={{ background: netWorth >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)' }}
            />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-1.5">
                <Wallet size={12} style={{ color: netWorth >= 0 ? '#00FF88' : '#EF4444' }} />
                <span className="text-xs uppercase tracking-wider text-text-muted">Patrimônio</span>
              </div>
              <div
                className="heading-display text-2xl"
                style={{ color: netWorth >= 0 ? '#00FF88' : '#EF4444' }}
              >
                {formatBRL(netWorth)}
              </div>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full blur-xl"
              style={{ background: 'rgba(124,58,237,0.2)' }}
            />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-brand-purple" />
                <span className="text-xs uppercase tracking-wider text-text-muted">Em contas</span>
              </div>
              <div className="heading-display text-2xl text-brand-purple">
                {formatBRL(totalAssets)}
              </div>
            </div>
          </div>

          {totalDebt > 0 && (
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full blur-xl"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-1.5">
                  <CreditCard size={12} className="text-brand-red" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">Dívidas</span>
                </div>
                <div className="heading-display text-2xl text-brand-red">
                  −{formatBRL(totalDebt)}
                </div>
              </div>
            </div>
          )}

          {totalCredit > 0 && (
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full blur-xl"
                style={{ background: 'rgba(245,200,66,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-1.5">
                  <CreditCard size={12} className="text-brand-gold" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">
                    Limite total
                  </span>
                </div>
                <div className="heading-display text-2xl text-brand-gold">
                  {formatBRL(totalCredit)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova conta
        </button>
      </div>

      {accounts.length === 0 ? (
        <div
          className="relative overflow-hidden rounded-2xl p-10 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <Building2 size={28} style={{ color: '#7C3AED' }} />
            </div>
            <h3 className="mb-2 text-xl font-bold">Nenhuma conta cadastrada</h3>
            <p className="mx-auto mb-5 max-w-xs text-text-secondary">
              Cadastre seus bancos e cartões para controlar seu dinheiro em um só lugar
            </p>
            <button type="button" onClick={() => setShowNew(true)} className="btn-primary">
              <Plus size={16} className="mr-1.5 inline" /> Cadastrar primeira conta
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {accounts.map((a) => {
            const isDeleting = deleting === a.id;
            const typeLabel = TYPES.find((t) => t.value === a.type)?.label ?? a.type;
            const balance = Number(a.current_balance);
            const isNegative = balance < 0;
            const isCreditCard = a.type === 'credit_card';
            const creditUsed =
              isCreditCard && a.credit_limit ? Math.max(0, Number(a.credit_limit) - balance) : 0;
            const creditUsedPct =
              isCreditCard && a.credit_limit
                ? Math.min(100, Math.round((creditUsed / Number(a.credit_limit)) * 100))
                : 0;
            const rgb = hexToRgb(a.color);
            const balanceColor = isNegative ? '#EF4444' : a.color;

            const progressBarColor =
              creditUsedPct > 80 ? '#EF4444' : creditUsedPct > 50 ? '#F5C842' : '#00FF88';

            return (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, rgba(${rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${rgb},0.2)`,
                  opacity: isDeleting ? 0.4 : 1,
                  pointerEvents: isDeleting ? 'none' : 'auto',
                }}
              >
                {/* Corner glow */}
                <div
                  className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                  style={{ background: `rgba(${rgb},0.15)` }}
                />

                <div className="relative z-10">
                  {/* Header row */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{
                        background: `rgba(${rgb},0.15)`,
                        border: `1px solid rgba(${rgb},0.3)`,
                      }}
                    >
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 text-xs uppercase tracking-wider text-text-muted">
                        {typeLabel}
                      </div>
                      <div className="truncate font-bold text-white">{a.name}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditAccount(a)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all"
                        style={{}}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = a.color;
                          e.currentTarget.style.background = `rgba(${rgb},0.12)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '';
                          e.currentTarget.style.background = '';
                        }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-brand-red/10 hover:text-brand-red"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="heading-display mb-1 text-3xl" style={{ color: balanceColor }}>
                    {formatBRL(balance)}
                  </div>

                  {!isCreditCard && (
                    <div className="text-xs text-text-muted">
                      {isNegative ? 'Saldo negativo' : 'Saldo disponível'}
                    </div>
                  )}

                  {/* Credit card usage bar */}
                  {isCreditCard && a.credit_limit && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">Limite usado</span>
                        <span className="font-semibold" style={{ color: progressBarColor }}>
                          {creditUsedPct}% · {formatBRL(creditUsed)}
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${creditUsedPct}%`,
                            background:
                              creditUsedPct > 80
                                ? 'linear-gradient(90deg, #EF4444, #FF6B6B)'
                                : creditUsedPct > 50
                                  ? 'linear-gradient(90deg, #F5C842, #FF9500)'
                                  : 'linear-gradient(90deg, #00FF88, #00CC6A)',
                            boxShadow: `0 0 6px ${progressBarColor}60`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-text-muted">
                        Limite total: {formatBRL(Number(a.credit_limit))}
                        {a.closing_day && ` · Fecha dia ${a.closing_day}`}
                        {a.due_day && ` · Vence dia ${a.due_day}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <AccountModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSave={(account) => {
            setAccounts((prev) => [...prev, account]);
            setShowNew(false);
            router.refresh();
          }}
        />
      )}

      {editAccount && (
        <AccountModal
          mode="edit"
          account={editAccount}
          onClose={() => setEditAccount(null)}
          onSave={(updated) => {
            setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setEditAccount(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function AccountModal({
  mode,
  account,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  account?: Account;
  onClose: () => void;
  onSave: (account: Account) => void;
}) {
  useScrollLock(true);
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState(account?.type ?? 'checking');
  const [balance, setBalance] = useState(account ? String(Math.abs(account.current_balance)) : '');
  const [isNegative, setIsNegative] = useState(account ? account.current_balance < 0 : false);
  const [color, setColor] = useState(account?.color ?? '#7C3AED');
  const [creditLimit, setCreditLimit] = useState(
    account?.credit_limit ? String(account.credit_limit) : ''
  );
  const [closingDay, setClosingDay] = useState(
    account?.closing_day ? String(account.closing_day) : ''
  );
  const [dueDay, setDueDay] = useState(account?.due_day ? String(account.due_day) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreditCard = type === 'credit_card';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const finalBalance = (parseFloat(balance) || 0) * (isNegative ? -1 : 1);
    const body = {
      ...(mode === 'edit' ? { id: account!.id } : {}),
      name: name.trim(),
      type,
      color,
      current_balance: finalBalance,
      credit_limit: creditLimit ? parseFloat(creditLimit) : null,
      closing_day: closingDay ? parseInt(closingDay) : null,
      due_day: dueDay ? parseInt(dueDay) : null,
    };

    const res = await fetch('/api/finance-accounts', {
      method: mode === 'edit' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { account?: Account; error?: string };
    setLoading(false);

    if (!res.ok || !data.account) {
      setError(data.error ?? 'Erro ao salvar conta.');
      return;
    }

    onSave(data.account);
  }

  const colorRgb = hexToRgb(color);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 md:items-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative my-4 w-full max-w-md animate-slide-up space-y-5 overflow-hidden rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, rgba(${colorRgb},0.06) 0%, rgba(13,24,41,0.99) 100%)`,
          border: `1px solid rgba(${colorRgb},0.25)`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${colorRgb},0.08)`,
        }}
      >
        {/* Corner glow */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${colorRgb},0.12) 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {mode === 'create' ? 'Nova conta' : 'Editar conta'}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-text-secondary">Nome</label>
              <input
                required
                placeholder="Ex: Nubank, Itaú, Carteira..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                maxLength={100}
              />
            </div>

            {mode === 'create' && (
              <div>
                <label className="mb-2 block text-sm text-text-secondary">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className="flex items-center gap-2 rounded-xl border p-3 text-sm transition-all"
                      style={
                        type === t.value
                          ? {
                              background: `rgba(${colorRgb},0.12)`,
                              borderColor: color,
                              color: '#fff',
                            }
                          : {
                              background: 'rgba(255,255,255,0.04)',
                              borderColor: 'rgba(255,255,255,0.1)',
                              color: '#8899BB',
                            }
                      }
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-text-secondary">
                {isCreditCard ? 'Fatura atual (R$)' : 'Saldo atual (R$)'}
              </label>
              <div className="flex gap-2">
                {!isCreditCard && (
                  <button
                    type="button"
                    onClick={() => setIsNegative(!isNegative)}
                    className="rounded-xl border px-3 text-sm font-bold transition-all"
                    style={
                      isNegative
                        ? {
                            background: 'rgba(239,68,68,0.15)',
                            borderColor: '#EF4444',
                            color: '#EF4444',
                          }
                        : {
                            background: 'rgba(0,255,136,0.15)',
                            borderColor: '#00FF88',
                            color: '#00FF88',
                          }
                    }
                  >
                    {isNegative ? '−' : '+'}
                  </button>
                )}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="input flex-1"
                />
              </div>
              {!isCreditCard && (
                <p className="mt-1 text-xs text-text-muted">
                  {isNegative ? 'Valor negativo (cheque especial, empréstimo)' : 'Valor positivo'}
                </p>
              )}
            </div>

            {isCreditCard && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-text-secondary">Limite (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-text-secondary">Fecha dia</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="10"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-text-secondary">Vence dia</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="17"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-text-secondary">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-9 w-9 rounded-lg transition-all"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? `2px solid #fff` : 'none',
                      outlineOffset: '2px',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl p-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#EF4444',
                }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
                {loading ? 'Salvando...' : mode === 'create' ? 'Criar conta' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
