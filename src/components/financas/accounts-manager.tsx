'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Pencil, Trash2, Wallet, CreditCard, TrendingUp, Building2 } from 'lucide-react'
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

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) return '124,58,237'
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
}

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
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: netWorth >= 0
                ? 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.98) 100%)',
              border: netWorth >= 0 ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full blur-xl pointer-events-none"
              style={{ background: netWorth >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)' }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <Wallet size={12} style={{ color: netWorth >= 0 ? '#00FF88' : '#EF4444' }} />
                <span className="text-xs text-text-muted uppercase tracking-wider">Patrimônio</span>
              </div>
              <div className="heading-display text-2xl" style={{ color: netWorth >= 0 ? '#00FF88' : '#EF4444' }}>
                {formatBRL(netWorth)}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <div
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full blur-xl pointer-events-none"
              style={{ background: 'rgba(124,58,237,0.2)' }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={12} className="text-brand-purple" />
                <span className="text-xs text-text-muted uppercase tracking-wider">Em contas</span>
              </div>
              <div className="heading-display text-2xl text-brand-purple">{formatBRL(totalAssets)}</div>
            </div>
          </div>

          {totalDebt > 0 && (
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full blur-xl pointer-events-none"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <CreditCard size={12} className="text-brand-red" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Dívidas</span>
                </div>
                <div className="heading-display text-2xl text-brand-red">−{formatBRL(totalDebt)}</div>
              </div>
            </div>
          )}

          {totalCredit > 0 && (
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            >
              <div
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full blur-xl pointer-events-none"
                style={{ background: 'rgba(245,200,66,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <CreditCard size={12} className="text-brand-gold" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Limite total</span>
                </div>
                <div className="heading-display text-2xl text-brand-gold">{formatBRL(totalCredit)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova conta
        </button>
      </div>

      {accounts.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <Building2 size={28} style={{ color: '#7C3AED' }} />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-text-secondary mb-5 max-w-xs mx-auto">
              Cadastre seus bancos e cartões para controlar seu dinheiro em um só lugar
            </p>
            <button onClick={() => setShowNew(true)} className="btn-primary">
              <Plus size={16} className="inline mr-1.5" /> Cadastrar primeira conta
            </button>
          </div>
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
            const rgb = hexToRgb(a.color)
            const balanceColor = isNegative ? '#EF4444' : a.color

            const progressBarColor = creditUsedPct > 80
              ? '#EF4444'
              : creditUsedPct > 50
              ? '#F5C842'
              : '#00FF88'

            return (
              <div
                key={a.id}
                className="rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, rgba(${rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${rgb},0.2)`,
                  opacity: isDeleting ? 0.4 : 1,
                  pointerEvents: isDeleting ? 'none' : 'auto',
                }}
              >
                {/* Corner glow */}
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                  style={{ background: `rgba(${rgb},0.15)` }}
                />

                <div className="relative z-10">
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{
                        background: `rgba(${rgb},0.15)`,
                        border: `1px solid rgba(${rgb},0.3)`,
                      }}
                    >
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5">{typeLabel}</div>
                      <div className="font-bold truncate text-white">{a.name}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditAccount(a)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted transition-all"
                        style={{}}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = a.color
                          e.currentTarget.style.background = `rgba(${rgb},0.12)`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = ''
                          e.currentTarget.style.background = ''
                        }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-red hover:bg-brand-red/10 transition-all"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  <div
                    className="heading-display text-3xl mb-1"
                    style={{ color: balanceColor }}
                  >
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
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${creditUsedPct}%`,
                            background: creditUsedPct > 80
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

  const colorRgb = hexToRgb(color)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md p-6 space-y-5 my-4 animate-slide-up relative overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, rgba(${colorRgb},0.06) 0%, rgba(13,24,41,0.99) 100%)`,
          border: `1px solid rgba(${colorRgb},0.25)`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${colorRgb},0.08)`,
        }}
      >
        {/* Corner glow */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, rgba(${colorRgb},0.12) 0%, transparent 70%)` }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold">
              {mode === 'create' ? 'Nova conta' : 'Editar conta'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4 mt-4">
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
                      className="flex items-center gap-2 p-3 rounded-xl border text-sm transition-all"
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
              <label className="text-sm text-text-secondary block mb-2">
                {isCreditCard ? 'Fatura atual (R$)' : 'Saldo atual (R$)'}
              </label>
              <div className="flex gap-2">
                {!isCreditCard && (
                  <button
                    type="button"
                    onClick={() => setIsNegative(!isNegative)}
                    className="px-3 rounded-xl border font-bold text-sm transition-all"
                    style={
                      isNegative
                        ? { background: 'rgba(239,68,68,0.15)', borderColor: '#EF4444', color: '#EF4444' }
                        : { background: 'rgba(0,255,136,0.15)', borderColor: '#00FF88', color: '#00FF88' }
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
                    className="w-9 h-9 rounded-lg transition-all"
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
                className="text-sm rounded-xl p-3"
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
  )
}
