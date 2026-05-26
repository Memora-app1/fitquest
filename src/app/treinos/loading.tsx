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

function StatCard({ accent }: { accent: string }) {
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden animate-pulse"
      style={{
        background: `linear-gradient(135deg, ${accent}10 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
        style={{ background: `${accent}28` }}
      />
      <div className="relative z-10 space-y-2">
        <ShimmerRow widths={['0.75rem', '3.5rem']} />
        <div className="h-9 w-20 rounded-xl" style={{ background: `${accent}15` }} />
        <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

function WorkoutRow({ isFirst }: { isFirst: boolean }) {
  const widths = ['60%', '75%', '50%', '80%', '65%']
  const w = widths[Math.floor(Math.random() * widths.length)]
  return (
    <div
      className="flex items-center gap-3 px-4 py-4 animate-pulse"
      style={{ background: isFirst ? 'rgba(13,24,41,0.8)' : undefined }}
    >
      <div
        className="w-11 h-11 rounded-xl shrink-0"
        style={{ background: isFirst ? 'rgba(245,200,66,0.12)' : 'rgba(21,34,56,0.8)' }}
      />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', width: w }} />
        <div className="flex gap-2">
          <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-2.5 w-14 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-2.5 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      <div className="h-5 w-14 rounded-full shrink-0" style={{ background: 'rgba(245,200,66,0.1)' }} />
    </div>
  )
}

export default function TreinosLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
          border: '1px solid rgba(255,77,0,0.18)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-10 w-36 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-52 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div
            className="h-10 w-36 rounded-xl"
            style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.3)' }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard accent="#FF4D00" />
        <StatCard accent="#F5C842" />
        <StatCard accent="#00FF88" />
        <StatCard accent="#F5C842" />
      </div>

      {/* Weekly activity bar */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <ShimmerRow widths={['1rem', '10rem']} />
          <div className="h-6 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full h-12 rounded-xl"
                style={{
                  background: i === 2 || i === 4
                    ? 'linear-gradient(135deg, rgba(255,77,0,0.25) 0%, rgba(255,77,0,0.12) 100%)'
                    : 'rgba(21,34,56,0.6)',
                  border: i === 2 || i === 4
                    ? '1px solid rgba(255,77,0,0.35)'
                    : '1px solid rgba(255,255,255,0.04)',
                }}
              />
              <div className="h-2 w-5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Best PRs */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(245,200,66,0.18)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <ShimmerRow widths={['1.1rem', '9rem']} />
          <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl p-3 flex items-center justify-between gap-2"
              style={{
                background: 'rgba(21,34,56,0.6)',
                border: i === 0 ? '1px solid rgba(245,200,66,0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="h-3 rounded-full flex-1"
                style={{ background: i === 0 ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.06)' }}
              />
              <div
                className="h-3 w-12 rounded-full shrink-0"
                style={{ background: i === 0 ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Workout list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-5 w-36 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>
        <div
          className="rounded-2xl overflow-hidden animate-pulse"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[true, false, false, false, false].map((isFirst, i) => (
            <div
              key={i}
              style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <WorkoutRow isFirst={isFirst} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
