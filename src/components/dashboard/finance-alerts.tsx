import Link from 'next/link'
import { formatBRL } from '@/lib/utils'
import { AlertCircle, Calendar } from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  transaction_date: string
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / 86400000)
}

export function FinanceAlerts({ transactions }: { transactions: Transaction[] }) {
  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  const overdue = transactions.filter((t) => getDaysUntil(t.transaction_date) < 0)
  const dueToday = transactions.filter((t) => getDaysUntil(t.transaction_date) === 0)
  const upcoming = transactions.filter((t) => getDaysUntil(t.transaction_date) > 0)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <AlertCircle size={18} className={overdue.length > 0 ? 'text-brand-red' : 'text-brand-gold'} />
          Contas a Pagar
        </h2>
        <Link href="/financas" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">
          Ver todas →
        </Link>
      </div>

      {/* Total */}
      <div className="mb-4 p-3 bg-bg-elevated rounded-xl flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wide">Total nos próximos dias</div>
          <div className="heading-display text-2xl text-brand-red mt-0.5">{formatBRL(total)}</div>
        </div>
        {overdue.length > 0 && (
          <div className="text-right">
            <div className="text-xs text-brand-red font-bold">{overdue.length} em atraso</div>
            <div className="text-xs text-text-muted">ação necessária</div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {overdue.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 bg-brand-red/8 border border-brand-red/25 rounded-xl"
          >
            <div>
              <div className="font-medium text-sm">{tx.description}</div>
              <div className="text-xs text-brand-red flex items-center gap-1 mt-0.5">
                <AlertCircle size={10} />
                {Math.abs(getDaysUntil(tx.transaction_date))}d em atraso
              </div>
            </div>
            <div className="text-brand-red font-bold text-sm">{formatBRL(Number(tx.amount))}</div>
          </div>
        ))}

        {dueToday.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 bg-brand-gold/8 border border-brand-gold/25 rounded-xl"
          >
            <div>
              <div className="font-medium text-sm">{tx.description}</div>
              <div className="text-xs text-brand-gold flex items-center gap-1 mt-0.5">
                <Calendar size={10} /> Vence hoje
              </div>
            </div>
            <div className="text-brand-gold font-bold text-sm">{formatBRL(Number(tx.amount))}</div>
          </div>
        ))}

        {upcoming.map((tx) => {
          const days = getDaysUntil(tx.transaction_date)
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-bg-elevated border border-border rounded-xl"
            >
              <div>
                <div className="font-medium text-sm">{tx.description}</div>
                <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <Calendar size={10} /> {days === 1 ? 'Amanhã' : `Em ${days} dias`}
                </div>
              </div>
              <div className="text-brand-red font-bold text-sm">{formatBRL(Number(tx.amount))}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
