import Link from 'next/link'
import { formatBRL, formatRelativeDate } from '@/lib/utils'
import { Wallet } from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  transaction_date: string
}

export function FinanceAlerts({ transactions }: { transactions: Transaction[] }) {
  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Wallet size={18} className="text-brand-purple" />
          Contas a Pagar
        </h2>
        <Link
          href="/financas"
          className="text-sm text-text-secondary hover:text-brand-orange"
        >
          Ver todas →
        </Link>
      </div>

      <div className="mb-4 p-3 bg-bg-elevated rounded-xl">
        <div className="text-sm text-text-secondary">Total nos próximos dias</div>
        <div className="heading-display text-3xl text-brand-red">{formatBRL(total)}</div>
      </div>

      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-border"
          >
            <div>
              <div className="font-medium">{tx.description}</div>
              <div className="text-xs text-text-muted">
                Vence {formatRelativeDate(tx.transaction_date)}
              </div>
            </div>
            <div className="text-brand-red font-bold">{formatBRL(Number(tx.amount))}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
