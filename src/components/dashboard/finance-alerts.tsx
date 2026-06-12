import Link from 'next/link';
import { formatBRL } from '@/lib/utils';
import { AlertCircle, Calendar, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

export function FinanceAlerts({ transactions }: { transactions: Transaction[] }) {
  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const overdue = transactions.filter((t) => getDaysUntil(t.transaction_date) < 0);
  const dueToday = transactions.filter((t) => getDaysUntil(t.transaction_date) === 0);
  const upcoming = transactions.filter((t) => getDaysUntil(t.transaction_date) > 0);

  const hasUrgent = overdue.length > 0;
  const accentColor = hasUrgent ? '#EF4444' : dueToday.length > 0 ? '#F5C842' : '#FF4D00';

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: hasUrgent
          ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.98) 100%)'
          : 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: `1px solid ${accentColor}25`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl"
        style={{ backgroundColor: accentColor, opacity: 0.1 }}
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle size={18} style={{ color: accentColor }} />
            Contas a Pagar
          </h2>
          <Link
            href="/financas"
            className="text-sm text-text-secondary transition-colors hover:text-brand-orange"
          >
            Ver todas →
          </Link>
        </div>

        {/* Total summary */}
        <div
          className="mb-4 flex items-center justify-between rounded-xl p-4"
          style={{
            background: `${accentColor}0D`,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <div>
            <div className="mb-0.5 text-xs uppercase tracking-wide text-text-muted">
              Total nos próximos dias
            </div>
            <div
              className="heading-display flex items-center gap-1.5 text-2xl"
              style={{ color: accentColor }}
            >
              <TrendingDown size={18} />
              {formatBRL(total)}
            </div>
          </div>
          {overdue.length > 0 && (
            <div
              className="rounded-xl px-3 py-2 text-right"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <div className="text-xs font-bold text-brand-red">{overdue.length} em atraso</div>
              <div className="text-xs text-text-muted">ação necessária</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {overdue.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl p-3"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <div>
                <div className="text-sm font-medium">{tx.description}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-brand-red">
                  <AlertCircle size={10} />
                  {Math.abs(getDaysUntil(tx.transaction_date))}d em atraso
                </div>
              </div>
              <div className="text-sm font-bold text-brand-red">{formatBRL(Number(tx.amount))}</div>
            </div>
          ))}

          {dueToday.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl p-3"
              style={{
                background: 'rgba(245,200,66,0.08)',
                border: '1px solid rgba(245,200,66,0.25)',
              }}
            >
              <div>
                <div className="text-sm font-medium">{tx.description}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-brand-gold">
                  <Calendar size={10} /> Vence hoje
                </div>
              </div>
              <div className="text-sm font-bold text-brand-gold">
                {formatBRL(Number(tx.amount))}
              </div>
            </div>
          ))}

          {upcoming.map((tx) => {
            const days = getDaysUntil(tx.transaction_date);
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl p-3"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <div className="text-sm font-medium">{tx.description}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                    <Calendar size={10} /> {days === 1 ? 'Amanhã' : `Em ${days} dias`}
                  </div>
                </div>
                <div className="text-sm font-bold text-brand-red">
                  {formatBRL(Number(tx.amount))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
