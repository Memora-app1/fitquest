import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, ShieldCheck } from 'lucide-react'

interface TxRow {
  amount: number
  description: string
  transaction_date: string
  category_id: string | null
  is_recurring: boolean
}

interface CatRow {
  id: string
  name: string
  icon: string | null
  color: string | null
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .slice(0, 40)
}

export async function FinanceIncomeAnalysis({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    .toISOString().split('T')[0]!
  const todayStr = now.toISOString().split('T')[0]!

  const [txRes, catRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, description, transaction_date, category_id, is_recurring')
      .eq('user_id', userId)
      .eq('type', 'income')
      .eq('is_paid', true)
      .gte('transaction_date', sixMonthsAgo)
      .lte('transaction_date', todayStr)
      .order('transaction_date', { ascending: true }),
    supabase
      .from('finance_categories')
      .select('id, name, icon, color')
      .or(`user_id.eq.${userId},is_global.eq.true`),
  ])

  const rows = (txRes.data ?? []) as TxRow[]
  const cats = new Map((catRes.data ?? [] as CatRow[]).map((c: CatRow) => [c.id, c]))

  if (rows.length === 0) return null

  // Build monthly income for last 6 months
  const monthlyIncome = new Map<string, number>()  // 'YYYY-MM' → total
  for (const r of rows) {
    const monthKey = r.transaction_date.slice(0, 7) // 'YYYY-MM'
    monthlyIncome.set(monthKey, (monthlyIncome.get(monthKey) ?? 0) + Number(r.amount))
  }

  // Build ordered months array (last 6)
  const months: { key: string; label: string; total: number }[] = []
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')
    months.push({ key, label, total: monthlyIncome.get(key) ?? 0 })
  }

  const maxMonthlyIncome = Math.max(...months.map(m => m.total), 1)

  // This month vs last month
  const thisMonth = months[months.length - 1]!
  const lastMonth = months[months.length - 2]!
  const monthDiff = lastMonth.total > 0
    ? Math.round(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100)
    : null

  // Average monthly income (excluding current month if partial)
  const completedMonths = months.slice(0, 5).filter(m => m.total > 0)
  const avgMonthlyIncome = completedMonths.length > 0
    ? Math.round(completedMonths.reduce((s, m) => s + m.total, 0) / completedMonths.length)
    : 0

  // Income stability score: coefficient of variation (lower = more stable)
  const vals = completedMonths.map(m => m.total)
  const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length)
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, vals.length)
  const stdDev = Math.sqrt(variance)
  const cv = mean > 0 ? stdDev / mean : 1
  const stabilityScore = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)))

  // Identify recurring income sources (description appears ≥2 months)
  const byNormalDesc = new Map<string, { months: Set<string>; total: number; catId: string | null; rawName: string }>()
  for (const r of rows) {
    const norm = normalize(r.description)
    if (!byNormalDesc.has(norm)) {
      byNormalDesc.set(norm, { months: new Set(), total: 0, catId: r.category_id, rawName: r.description })
    }
    const entry = byNormalDesc.get(norm)!
    entry.months.add(r.transaction_date.slice(0, 7))
    entry.total += Number(r.amount)
  }

  const recurringIncome = Array.from(byNormalDesc.entries())
    .filter(([, v]) => v.months.size >= 2)
    .map(([, v]) => ({
      name: v.rawName.length > 30 ? v.rawName.slice(0, 30) + '…' : v.rawName,
      monthlyAvg: Math.round(v.total / v.months.size),
      monthCount: v.months.size,
      catId: v.catId,
    }))
    .sort((a, b) => b.monthlyAvg - a.monthlyAvg)
    .slice(0, 5)

  const recurringTotal = recurringIncome.reduce((s, r) => s + r.monthlyAvg, 0)
  const totalLastMonth = lastMonth.total > 0 ? lastMonth.total : avgMonthlyIncome
  const recurringPct = totalLastMonth > 0 ? Math.round((recurringTotal / totalLastMonth) * 100) : 0

  // Income by category (this month + last month combined)
  const recentRows = rows.filter(r => r.transaction_date >= lastMonth.key + '-01')
  const byCat = new Map<string, number>()
  let uncategorized = 0
  for (const r of recentRows) {
    if (r.category_id) {
      byCat.set(r.category_id, (byCat.get(r.category_id) ?? 0) + Number(r.amount))
    } else {
      uncategorized += Number(r.amount)
    }
  }
  const recentTotal = recentRows.reduce((s, r) => s + Number(r.amount), 0)

  const catBreakdown = Array.from(byCat.entries())
    .map(([id, total]) => {
      const cat = cats.get(id)
      return {
        name: cat?.name ?? 'Outro',
        icon: cat?.icon ?? '💰',
        color: cat?.color ?? '#00FF88',
        total,
        pct: recentTotal > 0 ? Math.round((total / recentTotal) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  if (uncategorized > 0) {
    catBreakdown.push({
      name: 'Sem categoria',
      icon: '💰',
      color: '#5A6B8A',
      total: uncategorized,
      pct: recentTotal > 0 ? Math.round((uncategorized / recentTotal) * 100) : 0,
    })
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
        border: '1px solid rgba(0,255,136,0.14)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(0,255,136,0.07)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.14)', border: '1px solid rgba(0,255,136,0.26)' }}
              >
                <DollarSign size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Análise de receitas — 6 meses
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Inteligência de Renda</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Média {formatBRL(avgMonthlyIncome)}/mês · estabilidade {stabilityScore}%
            </p>
          </div>

          {monthDiff !== null && (
            <div className="text-right">
              <div
                className="text-2xl font-black flex items-center gap-1 justify-end"
                style={{ color: monthDiff >= 0 ? '#00FF88' : '#EF4444' }}
              >
                {monthDiff >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {monthDiff >= 0 ? '+' : ''}{monthDiff}%
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">vs mês passado</div>
            </div>
          )}
        </div>

        {/* ── Monthly Bar Chart ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-end gap-2 h-24">
            {months.map((month, i) => {
              const heightPct = maxMonthlyIncome > 0 ? (month.total / maxMonthlyIncome) * 100 : 0
              const isCurrent = i === months.length - 1
              const isAboveAvg = month.total >= avgMonthlyIncome

              return (
                <div
                  key={month.key}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                  title={`${month.label}: ${formatBRL(month.total)}`}
                >
                  {/* Average line indicator */}
                  {isCurrent && avgMonthlyIncome > 0 && (
                    <div className="text-[8px] text-text-muted text-center">
                      {month.total >= avgMonthlyIncome ? '↑' : '↓'}
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${Math.max(heightPct, month.total > 0 ? 2 : 0)}%`,
                      minHeight: month.total > 0 ? '3px' : '0px',
                      background: isCurrent
                        ? 'linear-gradient(180deg, #F5C842 0%, rgba(245,200,66,0.5) 100%)'
                        : isAboveAvg
                        ? 'linear-gradient(180deg, #00FF88 0%, rgba(0,255,136,0.4) 100%)'
                        : 'linear-gradient(180deg, rgba(0,255,136,0.55) 0%, rgba(0,255,136,0.2) 100%)',
                    }}
                  />
                  <div
                    className="text-[9px] font-medium"
                    style={{ color: isCurrent ? '#F5C842' : '#4A5568' }}
                  >
                    {month.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Avg line caption */}
          <div className="text-[9px] text-text-muted mt-1 text-center">
            Linha de referência: {formatBRL(avgMonthlyIncome)}/mês (média dos 5 meses completos)
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.14)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Receita fixa</div>
            <div className="text-xl font-black text-brand-green">{formatBRL(recurringTotal)}</div>
            <div className="text-[10px] text-text-muted mt-0.5">{recurringPct}% da renda total</div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.12)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Média mensal</div>
            <div className="text-xl font-black text-brand-gold">{formatBRL(avgMonthlyIncome)}</div>
            <div className="text-[10px] text-text-muted mt-0.5">últimos 5 meses</div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{
              background: stabilityScore >= 80 ? 'rgba(0,255,136,0.07)' : 'rgba(245,200,66,0.06)',
              border: stabilityScore >= 80 ? '1px solid rgba(0,255,136,0.14)' : '1px solid rgba(245,200,66,0.12)',
            }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck size={9} />
              Estabilidade
            </div>
            <div
              className="text-xl font-black"
              style={{ color: stabilityScore >= 80 ? '#00FF88' : '#F5C842' }}
            >
              {stabilityScore}%
            </div>
            <div className="text-[10px] text-text-muted mt-0.5">
              {stabilityScore >= 80 ? 'Renda muito estável' : stabilityScore >= 60 ? 'Moderada' : 'Volátil'}
            </div>
          </div>
        </div>

        {/* ── Recurring income sources ──────────────────────────────────── */}
        {recurringIncome.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Fontes de renda recorrentes ({recurringIncome.length} identificadas)
            </div>
            {recurringIncome.map((src, i) => {
              const cat = src.catId ? cats.get(src.catId) : null
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl p-2.5"
                  style={{
                    background: 'rgba(0,255,136,0.04)',
                    border: '1px solid rgba(0,255,136,0.08)',
                  }}
                >
                  <span className="text-base shrink-0">{cat?.icon ?? '💰'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{src.name}</span>
                      <span className="text-xs font-black shrink-0" style={{ color: '#00FF88' }}>
                        {formatBRL(src.monthlyAvg)}/mês
                      </span>
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      {src.monthCount} meses registrados
                      {cat ? ` · ${cat.name}` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Category breakdown (recent 2 months) ─────────────────────── */}
        {catBreakdown.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Receitas por categoria (2 meses recentes)
            </div>
            {catBreakdown.map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-5 text-center shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{cat.name}</span>
                    <span className="text-xs font-bold shrink-0 ml-2" style={{ color: cat.color }}>
                      {formatBRL(cat.total)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.pct}%`, backgroundColor: cat.color, opacity: 0.8 }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-text-muted shrink-0" style={{ width: '26px' }}>
                  {cat.pct}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(0,255,136,0.04)',
            border: '1px solid rgba(0,255,136,0.1)',
          }}
        >
          <span className="text-lg shrink-0">
            {recurringPct >= 80 ? '🏆' : recurringPct >= 50 ? '✅' : '⚠️'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {recurringPct >= 80
                ? `${recurringPct}% da renda é fixa e recorrente — excelente previsibilidade financeira.`
                : recurringPct >= 50
                ? `${recurringPct}% da renda recorrente. Considere aumentar fontes fixas para mais estabilidade.`
                : `Renda predominantemente variável (${100 - recurringPct}% variável). Mantenha uma reserva de emergência robusta.`}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Score de estabilidade: {stabilityScore}/100 baseado na variação dos últimos 5 meses.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
