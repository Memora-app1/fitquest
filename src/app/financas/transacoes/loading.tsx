function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex gap-2 items-center">
      {widths.map((w, i) => (
        <div
          key={i}
          className="animate-pulse rounded-full h-3"
          style={{ background: 'rgba(21,34,56,0.9)', width: w }}
        />
      ))}
    </div>
  )
}

function TransactionRow({ isExpense }: { isExpense: boolean }) {
  const accent = isExpense ? '#EF4444' : '#00FF88'
  const widths = ['55%', '70%', '50%', '80%', '60%', '45%', '75%', '65%']
  const w = widths[Math.floor(Math.random() * widths.length)]

  return (
    <div
      className="flex items-center gap-3 px-4 py-4 animate-pulse"
    >
      <div
        className="w-10 h-10 rounded-xl shrink-0"
        style={{
          background: `rgba(${isExpense ? '239,68,68' : '0,255,136'},0.1)`,
          border: `1px solid rgba(${isExpense ? '239,68,68' : '0,255,136'},0.15)`,
        }}
      />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', width: w }} />
        <div className="flex gap-2">
          <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-2.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      <div
        className="h-5 w-20 rounded-full shrink-0"
        style={{ background: `rgba(${isExpense ? '239,68,68' : '0,255,136'},0.1)` }}
      />
    </div>
  )
}

export default function TransacoesLoading() {
  const isExpenseArr = [true, false, true, true, false, true, false, true, true, false]

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(239,68,68,0.04) 100%)',
          border: '1px solid rgba(0,255,136,0.15)',
        }}
      >
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-10 w-44 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-52 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="h-10 w-36 rounded-xl" style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.2)' }} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 animate-pulse">
        <div className="h-9 w-28 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div className="h-9 w-24 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }} />
        <div className="h-9 w-24 rounded-xl" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)' }} />
        <div className="ml-auto h-9 w-36 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { accent: '#EF4444', label: 'Despesas' },
          { accent: '#00FF88', label: 'Receitas' },
          { accent: '#3B82F6', label: 'Saldo' },
        ].map(({ accent }, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 relative overflow-hidden animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${accent}0D 0%, rgba(13,24,41,0.98) 100%)`,
              border: `1px solid ${accent}20`,
            }}
          >
            <ShimmerRow widths={['0.75rem', '3.5rem']} />
            <div className="h-7 w-24 rounded-xl mt-2" style={{ background: `${accent}12` }} />
            <div className="h-2.5 w-20 rounded-full mt-1.5" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        ))}
      </div>

      {/* Transactions list */}
      <div className="space-y-2">
        {/* Group header */}
        <div className="flex items-center gap-3 px-1 animate-pulse">
          <div className="h-3 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-3 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div
          className="rounded-2xl overflow-hidden animate-pulse"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {isExpenseArr.slice(0, 4).map((isExp, i) => (
            <div key={i} style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <TransactionRow isExpense={isExp} />
            </div>
          ))}
        </div>

        {/* Group header 2 */}
        <div className="flex items-center gap-3 px-1 pt-2 animate-pulse">
          <div className="h-3 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-3 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div
          className="rounded-2xl overflow-hidden animate-pulse"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {isExpenseArr.slice(4, 10).map((isExp, i) => (
            <div key={i} style={{ borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <TransactionRow isExpense={isExp} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
