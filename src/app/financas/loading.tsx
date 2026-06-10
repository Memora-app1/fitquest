function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex gap-2 items-center">
      {widths.map((w, i) => (
        <div key={i} className="shimmer rounded-full h-3" style={{ width: w }} />
      ))}
    </div>
  )
}

function SummaryCard({ accent, wide }: { accent: string; wide?: boolean }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent}0D 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none blur-xl"
        style={{ background: `${accent}22` }}
      />
      <div className="relative z-10 space-y-2">
        <ShimmerRow widths={['1rem', wide ? '5rem' : '4rem']} />
        <div className="shimmer h-8 rounded-xl" style={{ width: wide ? '8rem' : '6rem' }} />
        <div className="shimmer h-2.5 rounded-full w-24" />
      </div>
    </div>
  )
}

function AccountCard() {
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.15)' }}
        />
        <div className="flex-1 space-y-1.5">
          <div className="shimmer h-3 w-24 rounded-full" />
          <div className="shimmer h-2.5 w-16 rounded-full" />
        </div>
      </div>
      <div className="shimmer h-7 w-28 rounded-lg" />
    </div>
  )
}

function TransactionRow() {
  const widths = ['55%', '70%', '45%', '80%', '60%']
  const w = widths[Math.floor(Math.random() * widths.length)]
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 rounded-xl shrink-0 shimmer" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="shimmer h-3 rounded-full" style={{ width: w }} />
        <div className="shimmer h-2.5 w-20 rounded-full" />
      </div>
      <div className="shimmer h-4 w-20 rounded-full shrink-0" />
    </div>
  )
}

export default function FinancasLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(0,255,136,0.15)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="shimmer h-10 w-28 rounded-xl" />
            <div className="shimmer h-3 w-56 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div
              className="shimmer h-10 w-28 rounded-xl"
              style={{ border: '1px solid rgba(0,255,136,0.2)' }}
            />
            <div
              className="shimmer h-10 w-28 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>

      {/* Month progress bar */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(13,24,41,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <ShimmerRow widths={['6rem', '4rem']} />
          <div className="shimmer h-2.5 w-14 rounded-full" />
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full w-3/5 rounded-full" style={{ background: 'rgba(0,255,136,0.2)' }} />
        </div>
      </div>

      {/* Summary 4-col grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard accent="#00FF88" wide />
        <SummaryCard accent="#3B82F6" />
        <SummaryCard accent="#EF4444" />
        <SummaryCard accent="#F5C842" />
      </div>

      {/* Main grid: chart + accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending chart placeholder */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 280 }}
        >
          <div className="flex items-center justify-between mb-5">
            <ShimmerRow widths={['1rem', '8rem']} />
            <div className="shimmer h-7 w-24 rounded-xl" />
          </div>
          {/* Bar chart skeleton */}
          <div className="flex items-end gap-2 h-40">
            {[55, 80, 40, 90, 65, 50, 75, 35, 60, 85, 45, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                <div
                  className="w-full rounded-t-md"
                  style={{ height: `${h}%`, background: i % 3 === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(0,255,136,0.15)' }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 gap-1">
            {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m) => (
              <div key={m} className="shimmer flex-1 h-2.5 rounded-full" />
            ))}
          </div>
        </div>

        {/* Accounts */}
        <div className="space-y-3">
          <ShimmerRow widths={['1rem', '4rem']} />
          <AccountCard />
          <AccountCard />
          <AccountCard />
          <div
            className="shimmer rounded-2xl h-12"
            style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
          />
        </div>
      </div>

      {/* Categories breakdown */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <ShimmerRow widths={['1rem', '6rem']} />
          <div className="shimmer h-2.5 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          {[75, 55, 40, 65, 30].map((pct, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <ShimmerRow widths={['1rem', `${4 + i}rem`]} />
                <div className="shimmer h-2.5 w-16 rounded-full" />
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: 'rgba(239,68,68,0.2)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="space-y-3">
        <ShimmerRow widths={['9rem']} />
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <TransactionRow />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
