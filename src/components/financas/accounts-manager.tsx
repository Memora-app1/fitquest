'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'
import { formatBRL } from '@/lib/utils'

interface Account {
  id: string
  name: string
  type: string
  icon: string
  color: string
  current_balance: number
  credit_limit: number | null
}

const TYPES = [
  { value: 'checking', label: 'Conta Corrente', icon: '🏦' },
  { value: 'savings', label: 'Poupança', icon: '🐷' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'investment', label: 'Investimento', icon: '📈' },
]

const COLORS = ['#7C3AED', '#FF4D00', '#00FF88', '#F5C842', '#3B82F6', '#EC4899']

export function AccountsManager({ initialAccounts }: { initialAccounts: Account[] }) {
  const [showNew, setShowNew] = useState(false)

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={18} className="inline mr-1" /> Nova conta
        </button>
      </div>

      {initialAccounts.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🏦</div>
          <h3 className="text-xl font-bold mb-1">Nenhuma conta cadastrada</h3>
          <p className="text-text-secondary mb-4">Cadastre seus bancos e cartões pra começar</p>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            Cadastrar primeira conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {initialAccounts.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${a.color}20` }}
                >
                  {a.icon}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-text-muted uppercase">
                    {TYPES.find((t) => t.value === a.type)?.label}
                  </div>
                  <div className="font-bold">{a.name}</div>
                </div>
              </div>
              <div className="heading-display text-2xl">{formatBRL(Number(a.current_balance))}</div>
              {a.credit_limit && (
                <div className="text-xs text-text-muted">
                  Limite: {formatBRL(Number(a.credit_limit))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && <NewAccountModal onClose={() => setShowNew(false)} />}
    </>
  )
}

function NewAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('checking')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState('#7C3AED')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const icon = TYPES.find((t) => t.value === type)?.icon ?? '🏦'

    await supabase.from('finance_accounts').insert({
      user_id: user.id,
      name,
      type,
      icon,
      color,
      current_balance: parseFloat(balance) || 0,
    })

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <div className="card-glow w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Nova conta</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            required
            placeholder="Ex: Nubank, Itaú..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className="input w-full">
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Saldo inicial (R$)"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="input w-full"
          />
          <div>
            <label className="text-sm text-text-secondary block mb-2">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading || !name} className="btn-primary w-full">
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
