function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {widths.map((w, i) => (
        <div key={i} className="shimmer h-3 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}

function StatCard({ accent }: { accent: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${accent}10 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
        style={{ background: `${accent}28` }}
      />
      <div className="relative z-10 space-y-2">
        <ShimmerRow widths={['0.75rem', '3.5rem']} />
        <div className="shimmer h-9 w-20 rounded-xl" />
        <div className="shimmer h-2.5 w-20 rounded-full" />
      </div>
    </div>
  );
}

function WorkoutRow({ isFirst }: { isFirst: boolean }) {
  const widths = ['60%', '75%', '50%', '80%', '65%'];
  const w = widths[Math.floor(Math.random() * widths.length)];
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div
        className="h-11 w-11 shrink-0 rounded-xl"
        style={{ background: isFirst ? 'rgba(245,200,66,0.12)' : 'rgba(21,34,56,0.8)' }}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="shimmer h-3.5 rounded-full" style={{ width: w }} />
        <div className="flex gap-2">
          <div className="shimmer h-2.5 w-20 rounded-full" />
          <div className="shimmer h-2.5 w-14 rounded-full" />
          <div className="shimmer h-2.5 w-12 rounded-full" />
        </div>
      </div>
      <div
        className="h-5 w-14 shrink-0 rounded-full"
        style={{ background: 'rgba(245,200,66,0.1)' }}
      />
    </div>
  );
}

export default function TreinosLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
          border: '1px solid rgba(255,77,0,0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="shimmer h-10 w-36 rounded-xl" />
            <div className="shimmer h-3 w-52 rounded-full" />
          </div>
          <div
            className="shimmer h-10 w-36 rounded-xl"
            style={{ border: '1px solid rgba(255,77,0,0.3)' }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard accent="#FF4D00" />
        <StatCard accent="#F5C842" />
        <StatCard accent="#00FF88" />
        <StatCard accent="#F5C842" />
      </div>

      {/* Weekly activity bar */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <ShimmerRow widths={['1rem', '10rem']} />
          <div className="shimmer h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="h-12 w-full rounded-xl"
                style={{
                  background:
                    i === 2 || i === 4
                      ? 'linear-gradient(135deg, rgba(255,77,0,0.25) 0%, rgba(255,77,0,0.12) 100%)'
                      : 'rgba(21,34,56,0.6)',
                  border:
                    i === 2 || i === 4
                      ? '1px solid rgba(255,77,0,0.35)'
                      : '1px solid rgba(255,255,255,0.04)',
                }}
              />
              <div className="shimmer h-2 w-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Best PRs */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(245,200,66,0.18)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <ShimmerRow widths={['1.1rem', '9rem']} />
          <div className="shimmer h-2.5 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-xl p-3"
              style={{
                background: 'rgba(21,34,56,0.6)',
                border:
                  i === 0 ? '1px solid rgba(245,200,66,0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="shimmer h-3 flex-1 rounded-full" />
              <div className="shimmer h-3 w-12 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Workout list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="shimmer h-5 w-36 rounded-full" />
        </div>
        <div
          className="overflow-hidden rounded-2xl"
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
  );
}
