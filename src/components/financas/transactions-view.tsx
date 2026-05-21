'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { formatBRL, formatRelativeDate } from '@/lib/utils'

interface Transaction {
  id: string
  description: string
  amount: number
  type: string
  transaction_date: string
  is_paid: boolean
  is_installment: boolean
  installment_current: number | null
  installment_total: number | null
}

interface Account {
  id: string
  name: string
  icon: string
  color: string
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: string
  is_global: boolean
}

export function TransactionsView({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
}) {
  const searchParams = useSearchParams()
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1')

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={18} className="inline mr-1" /> Nova transação
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">💸</div>
          <h3 className="text-xl font-bold mb-1">Nenhuma transação ainda</h3>
          <p className="text-text-secondary mb-4">Registre suas movimentações pra ganhar XP</p>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            Adicionar primeira transação
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="card p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">
                  {tx.description}
                  {tx.is_installment && (
                    <span className="text-xs text-text-muted ml-2">
                      ({tx.installment_current}/{tx.installment_total})
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-muted">
                  {formatRelativeDate(tx.transaction_date)}
                  {!tx.is_paid && <span className="text-brand-red ml-2">⚠ Pendente</span>}
                </div>
              </div>
              <div className={`font-bold ${tx.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatBRL(Number(tx.amount))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && accounts.length === 0 && (
        <NoAccountModal onClose={() => setShowNew(false)} />
      )}
      {showNew && accounts.length > 0 && (
        <NewTransactionModal
          accounts={accounts}
          categories={categories}
          onClose={() => setShowNew(false)}
        />
      )}
    </>
  )
}

function NoAccountModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="card-glow w-full max-w-md p-6 space-y-4 text-center">
        <h2 className="text-xl font-bold">Cadastre uma conta primeiro</h2>
        <p className="text-text-secondary">Você precisa ter pelo menos 1 conta cadastrada antes de registrar transações.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Voltar</button>
          <a href="/financas/contas" className="btn-primary flex-1">Cadastrar conta</a>
        </div>
      </div>
    </div>
  )
}

function NewTransactionModal({
  accounts,
  categories,
  onClose,
}: {
  accounts: Account[]
  categories: Category[]
  onClose: () => void
}) {
  const router = useRouter()
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [installments, setInstallments] = useState(1)
  const [loading, setLoading] = useState(false)

  const filteredCategories = categories.filter((c) => c.type === type)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        description,
        amount: parseFloat(amount),
        account_id: accountId,
        category_id: categoryId || null,
        transaction_date: date,
        installments,
        is_paid: true,
      }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
      <div className="card-glow w-full max-w-md p-6 space-y-4 my-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Nova transação</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`p-3 rounded-xl border font-medium ${
              type === 'expense' ? 'bg-brand-red/20 border-brand-red text-brand-red' : 'bg-bg-elevated border-border'
            }`}
          >
            💸 Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`p-3 rounded-xl border font-medium ${
              type === 'income' ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'bg-bg-elevated border-border'
            }`}
          >
            💰 Receita
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            required
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input w-full"
          />
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Valor (R$)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input w-full text-2xl heading-display"
          />
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
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-full"
          />
          {type === 'expense' && (
            <div>
              <label className="text-sm text-text-secondary block mb-1">
                Parcelas: {installments}x
              </label>
              <input
                type="range"
                min={1}
                max={24}
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full"
              />
              {installments > 1 && (
                <div className="text-xs text-text-muted mt-1">
                  {installments}x de {formatBRL(parseFloat(amount) / installments)}
                </div>
              )}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Registrando...' : '+ Registrar (+5 XP)'}
          </button>
        </form>
      </div>
    </div>
  )
}
