'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Pencil, Trash2, Wallet, CreditCard, TrendingUp } from 'lucide-react'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Account {
  id: string
  name: string
  type: string
  icon: string
  color: string
  current_balance: number
  credit_limit: number | null
  closing_day: number | null
  due_day: number | null
  is_active: boolean
}

const TYPES = [
  { value: 'checking', label: 'Conta Corrente', icon: '🏦' },
  { value: 'savings', label: 'Poupança', icon: '🐷' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'investment', label: 'Investimento', icon: '📈' },
]

const COLORS = ['#7C3AED', '#FF4D00', '#00FF88', '#F5C842', '#3B82F6', '#EC4899', '#14B8A6', '#F97316']

export function AccountsManager({ initialAccounts }: { initialAccounts: Account[] }) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [showNew, setShowNew] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const totalAssets = accounts
    .filter((a) => a.type !== 'credit_card' && Number(a.current_balance) > 0)
    .reduce((sum, a) => sum + Number(a.current_balance), 0)

  const totalDebt = accounts
    .filter((a) => Number(a.current_balance) < 0)
    .reduce((sum, a) => sum + Math.abs(Number(a.current_balance)), 0)

  const totalCredit = accounts
    .filter((a) => a.credit_limit)
    .reduce((sum, a) => sum + Number(a.credit_limit), 0)

  const netWorth = accounts
    .filter((a) => a.type !== 'credit_card')
    .reduce((sum, a) => sum + Number(a.current_balance), 0)

  async function handleDelete(id: string) {
    if (!confirm('Remover esta conta? As transações associadas serão mantidas.')) return
    setDeleting(id)
    const res = await fetch(`/api/finance-accounts?id=${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      router.refresh()
    }
  }

  return (
    <>
      {/* Summary cards */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-brand-green" />
              <span className="text-xs text-text-muted uppercase">Patrimônio</span>
            </div>
            <div className={cn('heading-display text-2xl', netWorth >= 0 ? 'text-brand-green' : 'text-brand-red')}>
              {formatBRL(netWorth)}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-brand-purple" />
              <span className="text-xs text-text-muted uppercase">Em contas</span>
            </div>
            <div className="heading-display text-2xl text-white">{formatBRL(totalAssets)}</div>
          </div>

          {totalDebt > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={14} className="text-brand-red" />
                <span className="text-xs text-text-muted uppercase">Dívidas</span>
              </div>
              <div className="heading-display text-2xl text-brand-red">−{formatBRL(totalDebt)}</div>
            </div>
          )}

          {totalCredit > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={14} className="text-brand-gold" />
                <span className="text-xs text-text-muted uppercase">Limite total</span>
              </div>
              <div className="heading-display text-2xl text-brand-gold">{formatBRL(totalCredit)}</div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={18} className="inline mr-1" /> Nova conta
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🏦</div>
          <h3 className="text-xl font-bold mb-1">Nenhuma conta cadastrada</h3>
          <p className="text-text-secondary mb-4">Cadastre seus bancos e cartões para controlar seu dinheiro</p>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            Cadastrar primeira conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((a) => {
            const isDeleting = deleting === a.id
            const typeLabel = TYPES.find((t) => t.value === a.type)?.label ?? a.type
            const balance = Number(a.current_balance)
            const isNegative = balance < 0
            const isCreditCard = a.type === 'credit_card'
            const creditUsed = isCreditCard && a.credit_limit
              ? Math.max(0, Number(a.credit_limit) - balance)
              : 0
            const creditUsedPct = isCreditCard && a.credit_limit
              ? Math.min(100, Math.round((creditUsed / Number(a.credit_limit)) * 100))
              : 0

            return (
              <div
                key={a.id}
                className={cn(
                  'card p-4 transition-opacity',
                  isDeleting && 'opacity-40 pointer-events-none'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${a.color}22` }}
                  >
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-muted uppercase tracking-wide">{typeLabel}</div>
                    <div className="font-bold truncate">{a.name}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditAccount(a)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-orange hover:bg-brand-orange/10 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={cn('heading-display text-3xl', isNegative ? 'text-brand-red' : 'text-white')}>
                  {formatBRL(balance)}
                </div>

                {isCreditCard && a.credit_limit && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Limite usado</span>
                      <span
                        className={cn(
                          'font-medium',
                          creditUsedPct > 80 ? 'text-brand-red' : creditUsedPct > 50 ? 'text-brand-gold' : 'text-brand-green'
                        )}
                      >
                        {creditUsedPct}% · {formatBRL(creditUsed)}
                      </span>
                    </div>
                    <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          creditUsedPct > 80 ? 'bg-brand-red' : creditUsedPct > 50 ? 'bg-brand-gold' : 'bg-brand-green'
                        )}
                        style={{ width: `${creditUsedPct}%` }}
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
            )
          })}
        </div>
      )}

      {showNew && (
        <AccountModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSave={(account) => {
            setAccounts((prev) => [...prev, account])
            setShowNew(false)
            router.refresh()
          }}
        />
      )}

      {editAccount && (
        <AccountModal
          mode="edit"
          account={editAccount}
          onClose={() => setEditAccount(null)}
          onSave={(updated) => {
            setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setEditAccount(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function AccountModal({
  mode,
  account,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit'
  account?: Account
  onClose: () => void
  onSave: (account: Account) => void
}) {
  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState(account?.type ?? 'checking')
  const [balance, setBalance] = useState(account ? String(Math.abs(account.current_balance)) : '')
  const [isNegative, setIsNegative] = useState(account ? account.current_balance < 0 : false)
  const [color, setColor] = useState(account?.color ?? '#7C3AED')
  const [creditLimit, setCreditLimit] = useState(account?.credit_limit ? String(account.credit_limit) : '')
  const [closingDay, setClosingDay] = useState(account?.closing_day ? String(account.closing_day) : '')
  const [dueDay, setDueDay] = useState(account?.due_day ? String(account.due_day) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCreditCard = type === 'credit_card'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const finalBalance = (parseFloat(balance) || 0) * (isNegative ? -1 : 1)
    const body = {
      ...(mode === 'edit' ? { id: account!.id } : {}),
      name: name.trim(),
      type,
      color,
      current_balance: finalBalance,
      credit_limit: creditLimit ? parseFloat(creditLimit) : null,
      closing_day: closingDay ? parseInt(closingDay) : null,
      due_day: dueDay ? parseInt(dueDay) : null,
    }

    const res = await fetch('/api/finance-accounts', {
      method: mode === 'edit' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json() as { account?: Account; error?: string }
    setLoading(false)

    if (!res.ok || !data.account) {
      setError(data.error ?? 'Erro ao salvar conta.')
      return
    }

    onSave(data.account)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
      <div className="card-glow w-full max-w-md p-6 space-y-4 my-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === 'create' ? 'Nova conta' : 'Editar conta'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Nome</label>
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
              <label className="text-sm text-text-secondary block mb-2">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border text-sm transition-all',
                      type === t.value
                        ? 'bg-brand-orange/10 border-brand-orange text-white'
                        : 'bg-bg-elevated border-border text-text-secondary hover:border-brand-orange/40'
                    )}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-text-secondary block mb-2">
              {isCreditCard ? 'Fatura atual (R$)' : 'Saldo atual (R$)'}
            </label>
            <div className="flex gap-2">
              {!isCreditCard && (
                <button
                  type="button"
                  onClick={() => setIsNegative(!isNegative)}
                  className={cn(
                    'px-3 rounded-xl border font-bold text-sm transition-all',
                    isNegative
                      ? 'bg-brand-red/20 border-brand-red text-brand-red'
                      : 'bg-brand-green/20 border-brand-green text-brand-green'
                  )}
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
              <p className="text-xs text-text-muted mt-1">
                {isNegative ? 'Valor negativo (cheque especial, empréstimo)' : 'Valor positivo'}
              </p>
            )}
          </div>

          {isCreditCard && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-text-secondary block mb-2">Limite (R$)</label>
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
                <label className="text-sm text-text-secondary block mb-2">Fecha dia</label>
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
                <label className="text-sm text-text-secondary block mb-2">Vence dia</label>
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
            <label className="text-sm text-text-secondary block mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-9 h-9 rounded-lg transition-all',
                    color === c && 'ring-2 ring-white scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-lg p-3">
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
  )
}
