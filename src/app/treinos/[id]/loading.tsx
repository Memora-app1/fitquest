function SetRow({ index }: { index: number }) {
  const widths = ['60%', '75%', '50%', '80%', '65%']
  const w = widths[index % widths.length]!
  return (
    <div className="flex items-center gap-3 py-2.5 animate-pulse" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.08)' }}>
        <div className="w-3 h-3 rounded" style={{ background: 'rgba(0,255,136,0.2)' }} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', width: w }} />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-5 w-14 rounded-full" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.14)' }} />
        <div className="h-5 w-14 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  )
}

function ExerciseGroup({ accentGreen }: { accentGreen?: boolean }) {
  const accent = accentGreen ? '#00FF88' : '#F5C842'
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        background: `linear-gradient(135deg, ${accent}06 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}18`,
      }}
    >
      {/* Exercise header */}
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: `1px solid ${accent}12` }}>
        <div
          className="w-10 h-10 rounded-xl shrink-0"
          style={{ background: `${accent}12`, border: `1px solid ${accent}18` }}
        />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-36 rounded-full" style={{ background: 'rgba(255,255,255,0.09)' }} />
          <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="text-right space-y-1 shrink-0">
          <div className="h-5 w-20 rounded-lg" style={{ background: `${accent}10` }} />
        </div>
      </div>

      {/* Sets */}
      <div className="px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SetRow key={i} index={i} />
        ))}
      </div>

      {/* Volume summary */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${accent}0A` }}>
        <div className="h-2.5 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-5 w-24 rounded-full" style={{ background: `${accent}0C` }} />
      </div>
    </div>
  )
}

function StatChip({ accent }: { accent: string }) {
  return (
    <div
      className="rounded-xl p-3 text-center space-y-1 animate-pulse"
      style={{
        background: `${accent}0A`,
        border: `1px solid ${accent}16`,
      }}
    >
      <div className="h-6 w-14 rounded-lg mx-auto" style={{ background: `${accent}18` }} />
      <div className="h-2.5 w-12 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

export default function WorkoutDetailLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Back nav */}
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-9 h-9 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div className="h-3 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)',
          border: '1px solid rgba(0,255,136,0.2)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="h-8 w-56 rounded-xl" style={{ background: 'rgba(255,255,255,0.09)' }} />
              <div className="flex items-center gap-2">
                <div className="h-3 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
                <div className="h-3 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
              <div className="h-9 w-9 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }} />
            </div>
          </div>

          {/* XP earned badge */}
          <div className="mt-4">
            <div className="h-7 w-32 rounded-xl inline-block" style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip accent="#00FF88" />
        <StatChip accent="#F5C842" />
        <StatChip accent="#FF4D00" />
        <StatChip accent="#7C3AED" />
      </div>

      {/* PR banner — shows sometimes */}
      <div
        className="rounded-2xl p-4 flex items-center gap-3 animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(245,200,66,0.25)',
        }}
      >
        <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgba(245,200,66,0.12)' }} />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-48 rounded-full" style={{ background: 'rgba(245,200,66,0.18)' }} />
          <div className="h-2.5 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-4 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-4 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* Exercise groups */}
      <div className="space-y-4">
        <ExerciseGroup accentGreen />
        <ExerciseGroup accentGreen={false} />
        <ExerciseGroup accentGreen />
      </div>

      {/* Comparison with previous workout */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{
          background: 'rgba(13,24,41,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg" style={{ background: 'rgba(59,130,246,0.12)' }} />
          <div className="h-3.5 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-6 w-20 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-6 w-20 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)' }} />
          </div>
        </div>
        {/* Delta bar */}
        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full w-3/5 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(0,255,136,0.3), rgba(0,255,136,0.6))' }} />
        </div>
      </div>
    </div>
  )
}
