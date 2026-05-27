import { createClient } from '@/lib/supabase/server'
import { Wallet, CreditCard, TrendingUp, Building2, PiggyBank, Banknote } from 'lucide-react'

interface AccountRow {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
  current_balance: number
  credit_limit: number | null
  is_active: boolean
}

function formatBRL(v: number): string {
  const abs = Math.abs(v)
  const prefix = v < 0 ? '-' : ''
  if (abs >= 1000000) return `${prefix}R$${(abs / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${prefix}R$${(abs / 1000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const ACCOUNT_TYPE_META: Record<string, { label: string; color: string; rgb: string; icon: string }> = {
  checking:    { label: 'Conta Corrente', color: '#7C3AED', rgb: '124,58,237',  icon: '🏦' },
  savings:     { label: 'Poupança',       color: '#00FF88', rgb: '0,255,136',   icon: '🐷' },
  credit_card: { label: 'Cartão Crédito', color: '#EF4444', rgb: '239,68,68',   icon: '💳' },
  investment:  { label: 'Investimento',   color: '#F5C842', rgb: '245,200,66',  icon: '📈' },
  wallet:      { label: 'Carteira',       color: '#FF4D00', rgb: '255,77,0',    icon: '👛' },
}

export async function NetWorthSummary({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('finance_accounts')
    .select('id, name, type, icon, color, current_balance, credit_limit, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('current_balance', { ascending: false })

  const accounts = (raw ?? []) as AccountRow[]

  if (accounts.length === 0) return null

  // Separate assets (non-credit-card) from debt (credit cards with negative balance)
  const creditCards = accounts.filter(a => a.type === 'credit_card')
  const otherAccounts = accounts.filter(a => a.type !== 'credit_card')

  const totalAssets = otherAccounts.reduce((s, a) => s + Math.max(0, Number(a.current_balance)), 0)
  const creditCardDebt = creditCards.reduce((s, a) => s + Math.abs(Math.min(0, Number(a.current_balance))), 0)
  const creditCardBalance = creditCards.reduce((s, a) => s + Number(a.current_balance), 0)
  const netWorth = totalAssets + creditCardBalance // creditCardBalance is often negative
  const isPositive = netWorth >= 0

  // Group by type for breakdown
  const typeGroups = new Map<string, { total: number; count: number; accounts: AccountRow[] }>()
  for (const a of accounts) {
    const existing = typeGroups.get(a.type)
    if (!existing) {
      typeGroups.set(a.type, { total: Number(a.current_balance), count: 1, accounts: [a] })
    } else {
      existing.total += Number(a.current_balance)
      existing.count++
      existing.accounts.push(a)
    }
  }

  // Compute max absolute balance for bar scaling
  const maxBalance = Math.max(...accounts.map(a => Math.abs(Number(a.current_balance))), 1)

  // Credit utilization
  const totalCreditLimit = creditCards.reduce((s, a) => s + Number(a.credit_limit ?? 0), 0)
  const totalCreditUsed = creditCards.reduce((s, a) => {
    const balance = Number(a.current_balance)
    return s + (balance < 0 ? Math.abs(balance) : 0)
  }, 0)
  const creditUtilization = totalCreditLimit > 0 ? Math.round((totalCreditUsed / totalCreditLimit) * 100) : null

  return (
    <div className="space-y-4">

      {/* ── Net Worth Hero ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
        style={{
          background: isPositive
            ? 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
          border: isPositive ? '1px solid rgba(0,255,136,0.16)' : '1px solid rgba(239,68,68,0.16)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
          style={{ background: isPositive ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)' }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: isPositive ? 'rgba(0,255,136,0.12)' : 'rgba(239,68,68,0.12)',
                    border: isPositive ? '1px solid rgba(0,255,136,0.22)' : '1px solid rgba(239,68,68,0.22)',
                  }}
                >
                  <TrendingUp size={12} style={{ color: isPositive ? '#00FF88' : '#EF4444' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Patrimônio Líquido
                </span>
              </div>
              <div
                className="text-4xl font-black leading-tight"
                style={{ color: isPositive ? '#00FF88' : '#EF4444' }}
              >
                {formatBRL(netWorth)}
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                {accounts.length} conta{accounts.length !== 1 ? 's' : ''} ativa{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Quick breakdown */}
            <div className="space-y-2 text-right">
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Ativos</div>
                <div className="font-black text-lg" style={{ color: '#00FF88' }}>
                  {formatBRL(totalAssets)}
                </div>
              </div>
              {creditCardDebt > 0 && (
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Dívida crédito</div>
                  <div className="font-bold text-base" style={{ color: '#EF4444' }}>
                    -{formatBRL(creditCardDebt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account bars */}
          <div className="space-y-2">
            {accounts.slice(0, 6).map(a => {
              const meta = ACCOUNT_TYPE_META[a.type] ?? ACCOUNT_TYPE_META.checking!
              const balance = Number(a.current_balance)
              const isNegative = balance < 0
              const barPct = Math.round((Math.abs(balance) / maxBalance) * 100)
              return (
                <div key={a.id} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: `rgba(${meta.rgb},0.12)`, border: `1px solid rgba(${meta.rgb},0.2)` }}
                  >
                    {a.icon ?? meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-medium truncate">{a.name}</span>
                      <span
                        className="text-xs font-bold shrink-0 ml-2"
                        style={{ color: isNegative ? '#EF4444' : meta.color }}
                      >
                        {formatBRL(balance)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${barPct}%`,
                          background: isNegative ? '#EF4444' : meta.color,
                          opacity: 0.75,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Type breakdown ───────────────────────────────────────────────── */}
      {typeGroups.size > 1 && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}
            >
              <Wallet size={12} style={{ color: '#7C3AED' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Por Tipo</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {Array.from(typeGroups.entries()).map(([type, { total, count }]) => {
              const meta = ACCOUNT_TYPE_META[type] ?? ACCOUNT_TYPE_META.checking!
              const isNeg = total < 0
              return (
                <div
                  key={type}
                  className="rounded-xl p-3 relative overflow-hidden"
                  style={{
                    background: `rgba(${meta.rgb},0.05)`,
                    border: `1px solid rgba(${meta.rgb},0.15)`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">{meta.icon}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider leading-tight">{meta.label}</span>
                  </div>
                  <div className="font-black text-base leading-none" style={{ color: isNeg ? '#EF4444' : meta.color }}>
                    {formatBRL(total)}
                  </div>
                  <div className="text-[9px] text-text-muted mt-1">
                    {count} conta{count !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Credit utilization ───────────────────────────────────────────── */}
      {creditCards.length > 0 && creditUtilization !== null && totalCreditLimit > 0 && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: creditUtilization >= 70
              ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)'
              : creditUtilization >= 30
              ? 'linear-gradient(135deg, rgba(255,77,0,0.05) 0%, rgba(13,24,41,0.98) 100%)'
              : 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: creditUtilization >= 70
              ? '1px solid rgba(239,68,68,0.2)'
              : creditUtilization >= 30
              ? '1px solid rgba(255,77,0,0.15)'
              : '1px solid rgba(0,255,136,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <CreditCard size={12} style={{ color: '#EF4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Uso do Crédito
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black" style={{
                  color: creditUtilization >= 70 ? '#EF4444' : creditUtilization >= 30 ? '#FF4D00' : '#00FF88',
                }}>
                  {creditUtilization}%
                </div>
                <div className="text-xs text-text-muted">de {formatBRL(totalCreditLimit)} disponível</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: '#EF4444' }}>
                  {formatBRL(totalCreditUsed)} usado
                </div>
                <div className="text-xs text-text-muted">
                  {formatBRL(totalCreditLimit - totalCreditUsed)} livre
                </div>
              </div>
            </div>

            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, creditUtilization)}%`,
                  background: creditUtilization >= 70
                    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                    : creditUtilization >= 30
                    ? 'linear-gradient(90deg, #FF4D00, #EF4444)'
                    : 'linear-gradient(90deg, #00FF88, #00CC6A)',
                }}
              />
            </div>

            <div className="text-[11px]" style={{
              color: creditUtilization >= 70 ? '#EF4444' : creditUtilization >= 30 ? '#FF4D00' : '#00FF88',
            }}>
              {creditUtilization >= 70
                ? '⚠ Uso alto de crédito — pode impactar seu score financeiro'
                : creditUtilization >= 30
                ? 'Uso moderado — ideal manter abaixo de 30%'
                : '✓ Ótimo uso de crédito — abaixo de 30%'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
