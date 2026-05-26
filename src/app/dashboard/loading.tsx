function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className ?? ''}`}
      style={{ background: 'rgba(21,34,56,0.6)', ...style }}
    />
  )
}

function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex gap-2 items-center">
      {widths.map((w, i) => (
        <div
          key={i}
          className="animate-pulse rounded-full h-3"
          style={{ background: 'rgba(21,34,56,0.8)', width: w }}
        />
      ))}
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Hero header skeleton */}
      <div
        className="rounded-2xl p-6 animate-pulse"
        style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(124,58,237,0.1)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-14 rounded-xl animate-pulse" style={{ background: 'rgba(124,58,237,0.15)' }} />
            <div className="h-7 w-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        </div>
      </div>

      {/* XP + Streak widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 animate-pulse space-y-3"
            style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(255,255,255,0.05)', minHeight: 120 }}
          >
            <ShimmerRow widths={['1rem', '5rem']} />
            <div className="h-9 w-32 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-2 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full w-1/2 rounded-full" style={{ background: 'rgba(255,77,0,0.2)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Life Score skeleton */}
      <div
        className="rounded-2xl p-6 animate-pulse"
        style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(255,255,255,0.05)', minHeight: 160 }}
      >
        <div className="flex items-center gap-5">
          {/* Ring placeholder */}
          <div
            className="w-32 h-32 rounded-full shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '8px solid rgba(255,255,255,0.05)' }}
          >
            <div className="h-7 w-12 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          {/* Bars placeholder */}
          <div className="flex-1 space-y-3">
            <div className="h-3 w-48 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
            {[80, 65, 55, 90].map((w, i) => (
              <div key={i} className="space-y-1">
                <ShimmerRow widths={['0.7rem', '3rem']} />
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${w}%`, background: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights skeleton */}
      <div
        className="rounded-2xl p-5 animate-pulse space-y-3"
        style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(124,58,237,0.1)' }}
      >
        <ShimmerRow widths={['1rem', '6rem']} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-2.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-2.5 w-4/5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4 animate-pulse text-center"
            style={{ background: 'rgba(21,34,56,0.4)', border: '1px solid rgba(255,255,255,0.04)', minHeight: 80 }}
          >
            <div className="w-8 h-8 rounded-xl mx-auto mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-2.5 w-12 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Habits skeleton */}
          <div
            className="rounded-2xl p-5 animate-pulse space-y-3"
            style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(255,77,0,0.08)', minHeight: 180 }}
          >
            <ShimmerRow widths={['1rem', '7rem']} />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-2 w-1/2 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
                <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            ))}
          </div>

          {/* Tasks skeleton */}
          <div
            className="rounded-2xl p-5 animate-pulse space-y-3"
            style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(124,58,237,0.08)', minHeight: 160 }}
          >
            <ShimmerRow widths={['1rem', '5rem']} />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-4 h-4 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex-1 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="w-16 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Activity feed skeleton */}
          <div
            className="rounded-2xl p-5 animate-pulse space-y-3"
            style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(245,200,66,0.08)', minHeight: 200 }}
          >
            <ShimmerRow widths={['1rem', '6rem']} />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-3/4 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-2 w-1/2 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
                <div className="w-10 h-4 rounded-full" style={{ background: 'rgba(245,200,66,0.1)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
