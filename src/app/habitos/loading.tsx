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
        border: `1px solid ${accent}20`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
        style={{ background: `${accent}25` }}
      />
      <div className="relative z-10 space-y-2">
        <ShimmerRow widths={['0.75rem', '3.5rem']} />
        <div className="shimmer h-8 w-16 rounded-xl" />
        <div className="shimmer h-2.5 w-24 rounded-full" />
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div className="shimmer h-full w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function HabitRow({ index }: { index: number }) {
  const widths = ['85%', '70%', '90%', '65%', '80%'];
  const w = widths[index % widths.length]!;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(13,24,41,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Icon placeholder */}
        <div
          className="shimmer h-12 w-12 shrink-0 rounded-xl"
          style={{ border: '1px solid rgba(255,77,0,0.15)' }}
        />
        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="shimmer h-3.5 rounded-full" style={{ width: w }} />
            <div className="flex shrink-0 gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <div
                  key={d}
                  className={`h-5 w-5 rounded ${d < 3 ? 'shimmer' : ''}`}
                  style={d >= 3 ? { background: 'rgba(255,255,255,0.04)' } : undefined}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="shimmer h-2 w-24 rounded-full" />
            <div className="shimmer h-2 w-16 rounded-full" />
          </div>
        </div>
        {/* Check button */}
        <div
          className="shimmer h-9 w-9 shrink-0 rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        />
      </div>
    </div>
  );
}

export default function HabitosLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(255,77,0,0.15)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="shimmer h-10 w-32 rounded-xl" />
            <div className="shimmer h-3.5 w-64 rounded-full" />
          </div>
          <div
            className="shimmer h-9 w-32 rounded-xl"
            style={{ border: '1px solid rgba(255,77,0,0.2)' }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard accent="#FF4D00" />
        <StatCard accent="#7C3AED" />
        <StatCard accent="#FF4D00" />
        <StatCard accent="#F5C842" />
      </div>

      {/* Habit list header */}
      <div className="flex items-center justify-between px-1">
        <div className="shimmer h-3.5 w-40 rounded-full" />
        <div
          className="shimmer h-8 w-32 rounded-xl"
          style={{ border: '1px solid rgba(255,77,0,0.2)' }}
        />
      </div>

      {/* Habits */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <HabitRow key={i} index={i} />
        ))}
      </div>

      {/* "Add habit" dashed button placeholder */}
      <div
        className="shimmer h-12 rounded-2xl"
        style={{ border: '1px dashed rgba(255,77,0,0.2)' }}
      />
    </div>
  );
}
