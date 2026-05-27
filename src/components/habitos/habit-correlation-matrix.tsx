import { createClient } from '@/lib/supabase/server'
import { Share2 } from 'lucide-react'

interface HabitRow {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface LogRow {
  habit_id: string
  logged_date: string
}

export async function HabitCorrelationMatrix({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000)
    .toISOString().split('T')[0]!
  const todayStr = now.toISOString().split('T')[0]!

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, icon, color')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', ninetyDaysAgo)
      .lte('logged_date', todayStr),
  ])

  const habits = (habitsRes.data ?? []) as HabitRow[]
  const logs = (logsRes.data ?? []) as LogRow[]

  // Need at least 2 habits to show correlation
  if (habits.length < 2) return null
  if (logs.length === 0) return null

  // Only show up to 8 habits (matrix gets too big)
  const displayHabits = habits.slice(0, 8)
  const n = displayHabits.length

  // Build day → Set<habit_id> map
  const dayMap = new Map<string, Set<string>>()
  for (const log of logs) {
    if (!dayMap.has(log.logged_date)) dayMap.set(log.logged_date, new Set())
    dayMap.get(log.logged_date)!.add(log.habit_id)
  }

  const allDays = Array.from(dayMap.keys())
  const totalDays = allDays.length
  if (totalDays === 0) return null

  // For each habit, count how many days it was done
  const habitDays = new Map<string, number>()
  for (const h of displayHabits) {
    let count = 0
    for (const daySet of dayMap.values()) {
      if (daySet.has(h.id)) count++
    }
    habitDays.set(h.id, count)
  }

  // Correlation matrix: correlation[i][j] = co-occurrence rate
  // = (days both done) / sqrt(days i done × days j done)  [Jaccard-like or phi]
  // Use simple conditional probability: P(j done | i done)
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        // Self-correlation = completion rate
        matrix[i]![j] = totalDays > 0
          ? Math.round(((habitDays.get(displayHabits[i]!.id) ?? 0) / totalDays) * 100) / 100
          : 0
        continue
      }

      const hI = displayHabits[i]!.id
      const hJ = displayHabits[j]!.id
      const iDays = habitDays.get(hI) ?? 0

      if (iDays === 0) {
        matrix[i]![j] = 0
        continue
      }

      let both = 0
      for (const daySet of dayMap.values()) {
        if (daySet.has(hI) && daySet.has(hJ)) both++
      }

      // P(j | i): probability of completing j given i was completed
      matrix[i]![j] = Math.round((both / iDays) * 100) / 100
    }
  }

  // Find strongest pairs (off-diagonal)
  interface Pair {
    i: number
    j: number
    value: number
    label: string
  }

  const strongPairs: Pair[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const val = ((matrix[i]![j] ?? 0) + (matrix[j]![i] ?? 0)) / 2
      if (val > 0.5) {
        strongPairs.push({
          i, j,
          value: Math.round(val * 100),
          label: `${displayHabits[i]!.icon ?? '•'} ${displayHabits[i]!.name.split(' ')[0]} + ${displayHabits[j]!.icon ?? '•'} ${displayHabits[j]!.name.split(' ')[0]}`,
        })
      }
    }
  }
  strongPairs.sort((a, b) => b.value - a.value)

  // Color cell based on value
  function cellBg(val: number, isdiag: boolean): string {
    if (isdiag) {
      if (val >= 0.8) return 'rgba(0,255,136,0.35)'
      if (val >= 0.6) return 'rgba(0,255,136,0.22)'
      if (val >= 0.4) return 'rgba(245,200,66,0.2)'
      return 'rgba(255,255,255,0.05)'
    }
    if (val >= 0.8) return 'rgba(0,255,136,0.35)'
    if (val >= 0.6) return 'rgba(0,255,136,0.22)'
    if (val >= 0.4) return 'rgba(124,58,237,0.22)'
    if (val >= 0.2) return 'rgba(124,58,237,0.1)'
    return 'rgba(255,255,255,0.03)'
  }

  function cellText(val: number): string {
    if (val >= 0.8) return '#00FF88'
    if (val >= 0.6) return 'rgba(0,255,136,0.8)'
    if (val >= 0.4) return '#7C3AED'
    if (val >= 0.2) return '#5A6B8A'
    return 'rgba(255,255,255,0.2)'
  }

  // Truncate habit name for matrix header
  function shortName(h: HabitRow): string {
    const words = h.name.split(' ')
    if (words[0] && words[0].length <= 6) return (h.icon ?? '') + ' ' + words[0]
    return (h.icon ?? '') + ' ' + h.name.slice(0, 5)
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
        border: '1px solid rgba(124,58,237,0.12)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(124,58,237,0.06)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.26)' }}
              >
                <Share2 size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Correlação de hábitos — 90 dias
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Hábitos Companheiros</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Quais hábitos você tende a fazer juntos no mesmo dia?
            </p>
          </div>

          {strongPairs.length > 0 && (
            <div
              className="text-right px-3 py-2 rounded-xl"
              style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.16)' }}
            >
              <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Par mais forte</div>
              <div className="text-xs font-bold" style={{ color: '#00FF88' }}>
                {strongPairs[0]!.label}
              </div>
              <div className="text-[10px] text-text-muted">{strongPairs[0]!.value}% co-ocorrência</div>
            </div>
          )}
        </div>

        {/* ── Matrix ───────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${n * 46 + 88}px` }}>
            {/* Column headers */}
            <div className="flex mb-1" style={{ paddingLeft: '88px' }}>
              {displayHabits.map((h, j) => (
                <div
                  key={j}
                  className="flex items-center justify-center"
                  style={{ width: '46px', flexShrink: 0 }}
                >
                  <div
                    className="text-[8px] text-center font-semibold"
                    style={{
                      color: h.color ?? '#8899BB',
                      writingMode: 'vertical-rl' as const,
                      transform: 'rotate(180deg)',
                      maxHeight: '56px',
                      overflow: 'hidden',
                    }}
                  >
                    {shortName(h)}
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {displayHabits.map((hRow, i) => (
              <div key={i} className="flex items-center mb-1 gap-0">
                {/* Row header */}
                <div
                  className="shrink-0 pr-2 flex items-center gap-1"
                  style={{ width: '88px' }}
                >
                  <span className="text-sm">{hRow.icon ?? '•'}</span>
                  <span
                    className="text-[9px] font-semibold truncate"
                    style={{ color: hRow.color ?? '#8899BB', maxWidth: '64px' }}
                  >
                    {hRow.name.length > 10 ? hRow.name.slice(0, 10) + '…' : hRow.name}
                  </span>
                </div>

                {/* Cells */}
                {displayHabits.map((_, j) => {
                  const val = matrix[i]![j] ?? 0
                  const isDiag = i === j
                  const pct = Math.round(val * 100)

                  return (
                    <div
                      key={j}
                      className="flex items-center justify-center rounded-sm cursor-default"
                      style={{
                        width: '44px',
                        height: '32px',
                        margin: '0 1px',
                        background: cellBg(val, isDiag),
                        border: isDiag ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                      }}
                      title={
                        isDiag
                          ? `${hRow.name}: ${pct}% de conclusão nos 90 dias`
                          : `P(${displayHabits[j]!.name.split(' ')[0]} | ${hRow.name.split(' ')[0]}): ${pct}%`
                      }
                    >
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: cellText(val) }}
                      >
                        {pct > 0 ? `${pct}%` : '–'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap text-[9px] text-text-muted">
          <span className="font-semibold">Legenda:</span>
          {[
            { bg: 'rgba(0,255,136,0.35)', label: '≥80% juntos' },
            { bg: 'rgba(0,255,136,0.22)', label: '60-79%' },
            { bg: 'rgba(124,58,237,0.22)', label: '40-59%' },
            { bg: 'rgba(124,58,237,0.10)', label: '20-39%' },
            { bg: 'rgba(255,255,255,0.03)', label: '<20%' },
          ].map((item, k) => (
            <div key={k} className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ background: item.bg, border: '1px solid rgba(255,255,255,0.08)' }} />
              <span>{item.label}</span>
            </div>
          ))}
          <span className="text-text-muted ml-1">· Diagonal = taxa individual de conclusão</span>
        </div>

        {/* ── Strong pairs ─────────────────────────────────────────────── */}
        {strongPairs.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Pares mais fortes (&gt;50% co-ocorrência)
            </div>
            <div className="flex gap-2 flex-wrap">
              {strongPairs.slice(0, 6).map((pair, k) => (
                <div
                  key={k}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: pair.value >= 80
                      ? 'rgba(0,255,136,0.1)'
                      : 'rgba(124,58,237,0.1)',
                    border: pair.value >= 80
                      ? '1px solid rgba(0,255,136,0.2)'
                      : '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  <span className="text-[10px]">{displayHabits[pair.i]!.icon ?? '•'}</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: displayHabits[pair.i]!.color ?? '#8899BB' }}
                  >
                    {displayHabits[pair.i]!.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-text-muted">+</span>
                  <span className="text-[10px]">{displayHabits[pair.j]!.icon ?? '•'}</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: displayHabits[pair.j]!.color ?? '#8899BB' }}
                  >
                    {displayHabits[pair.j]!.name.split(' ')[0]}
                  </span>
                  <span
                    className="text-[9px] font-black ml-1"
                    style={{ color: pair.value >= 80 ? '#00FF88' : '#7C3AED' }}
                  >
                    {pair.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(124,58,237,0.05)',
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <span className="text-lg shrink-0">
            {strongPairs.length >= 3 ? '🔗' : strongPairs.length >= 1 ? '💡' : '🌱'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {strongPairs.length >= 3
                ? `${strongPairs.length} pares fortes encontrados. Seus hábitos têm alta sinergia!`
                : strongPairs.length >= 1
                ? `${strongPairs[0]!.label} se completam juntos ${strongPairs[0]!.value}% dos dias.`
                : 'Seus hábitos são relativamente independentes entre si.'}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Valores mostram: probabilidade de completar o hábito da coluna dado que o da linha foi feito.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
