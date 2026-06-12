// Bloco de conteúdo com shimmer deslizante (mais premium que animate-pulse)
function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`shimmer rounded-2xl ${className ?? ''}`}
      style={{ background: 'rgba(21,34,56,0.6)', ...style }}
    />
  );
}

function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {widths.map((w, i) => (
        <div
          key={i}
          className="shimmer h-3 rounded-full"
          style={{ background: 'rgba(21,34,56,0.8)', width: w }}
        />
      ))}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Hero header skeleton */}
      <div
        className="shimmer rounded-2xl p-6"
        style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(124,58,237,0.1)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div
              className="shimmer h-3 w-24 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <div
              className="shimmer h-8 w-48 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
          </div>
          <div className="flex gap-2">
            <div
              className="shimmer h-7 w-14 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.15)' }}
            />
            <div
              className="shimmer h-7 w-16 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>
        </div>
      </div>

      {/* XP + Streak widgets */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="shimmer space-y-3 rounded-2xl p-5"
            style={{
              background: 'rgba(21,34,56,0.5)',
              border: '1px solid rgba(255,255,255,0.05)',
              minHeight: 120,
            }}
          >
            <ShimmerRow widths={['1rem', '5rem']} />
            <div className="h-9 w-32 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div
              className="h-2 w-full rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="h-full w-1/2 rounded-full"
                style={{ background: 'rgba(255,77,0,0.2)' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Life Score skeleton */}
      <div
        className="shimmer rounded-2xl p-6"
        style={{
          background: 'rgba(21,34,56,0.5)',
          border: '1px solid rgba(255,255,255,0.05)',
          minHeight: 160,
        }}
      >
        <div className="flex items-center gap-5">
          {/* Ring placeholder */}
          <div
            className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '8px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="h-7 w-12 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          {/* Bars placeholder */}
          <div className="flex-1 space-y-3">
            <div
              className="h-3 w-48 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
            {[80, 65, 55, 90].map((w, i) => (
              <div key={i} className="space-y-1">
                <ShimmerRow widths={['0.7rem', '3rem']} />
                <div
                  className="h-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
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
        className="shimmer space-y-3 rounded-2xl p-5"
        style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(124,58,237,0.1)' }}
      >
        <ShimmerRow widths={['1rem', '6rem']} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div
              className="h-8 w-8 shrink-0 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-3 w-2/3 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
              <div
                className="h-2.5 w-full rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
              <div
                className="h-2.5 w-4/5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions skeleton — 5 items matching QuickActions component */}
      <div>
        <div
          className="shimmer mb-3 h-2.5 w-20 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {[
            'rgba(255,77,0,0.08)',
            'rgba(124,58,237,0.08)',
            'rgba(0,255,136,0.08)',
            'rgba(245,200,66,0.08)',
            'rgba(59,130,246,0.08)',
          ].map((bg, i) => (
            <div
              key={i}
              className="shimmer flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center"
              style={{ background: bg, border: '1px solid rgba(255,255,255,0.05)', minHeight: 96 }}
            >
              <div
                className="h-12 w-12 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
              <div className="w-full space-y-1">
                <div
                  className="mx-auto h-2.5 w-3/4 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
                <div
                  className="mx-auto h-2 w-2/3 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-6 lg:col-span-2">
          {/* Habits skeleton */}
          <div
            className="shimmer space-y-3 rounded-2xl p-5"
            style={{
              background: 'rgba(21,34,56,0.5)',
              border: '1px solid rgba(255,77,0,0.08)',
              minHeight: 180,
            }}
          >
            <ShimmerRow widths={['1rem', '7rem']} />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div
                  className="h-10 w-10 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="h-3 w-2/3 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                  <div
                    className="h-2 w-1/2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                </div>
                <div
                  className="h-8 w-8 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            ))}
          </div>

          {/* Tasks skeleton */}
          <div
            className="shimmer space-y-3 rounded-2xl p-5"
            style={{
              background: 'rgba(21,34,56,0.5)',
              border: '1px solid rgba(124,58,237,0.08)',
              minHeight: 160,
            }}
          >
            <ShimmerRow widths={['1rem', '5rem']} />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-4 w-4 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div
                  className="h-3 flex-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <div
                  className="h-5 w-16 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Activity feed skeleton — timeline layout with dot + stem */}
          <div
            className="shimmer rounded-2xl p-5"
            style={{
              background:
                'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(245,200,66,0.1)',
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <ShimmerRow widths={['1rem', '7rem']} />
              <div
                className="h-4 w-12 rounded-full"
                style={{ background: 'rgba(245,200,66,0.1)' }}
              />
            </div>
            {/* Group header */}
            <div
              className="mb-3 h-2.5 w-10 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
            {/* Timeline entries */}
            <div className="space-y-0">
              {[
                { color: 'rgba(255,77,0,0.8)', w: '70%', xp: 48 },
                { color: 'rgba(124,58,237,0.8)', w: '55%', xp: 36 },
                { color: 'rgba(0,255,136,0.8)', w: '80%', xp: 48 },
                { color: 'rgba(245,200,66,0.7)', w: '60%', xp: 36 },
              ].map(({ color, w, xp }, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  {/* Dot + stem */}
                  <div className="mt-1 flex shrink-0 flex-col items-center">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                    {i < 3 && (
                      <div
                        className="min-h-[20px] w-px flex-1"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2 pb-1">
                    <div className="flex-1 space-y-1">
                      <div
                        className="h-2.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.07)', width: w }}
                      />
                      <div
                        className="h-2 w-16 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      />
                    </div>
                    <div
                      className="h-4 w-10 shrink-0 rounded-lg"
                      style={{
                        background: 'rgba(245,200,66,0.1)',
                        border: '1px solid rgba(245,200,66,0.14)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
