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

function AccountCard({ accent }: { accent: string }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden animate-pulse"
      style={{
        background: `linear-gradient(135deg, ${accent}09 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}20`,
        minHeight: 160,
      }}
    >
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none blur-xl"
        style={{ background: `${accent}22` }}
      />
      <div className="relative z-10 space-y-4">
        {/* Account header */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl shrink-0"
            style={{ background: `${accent}15`, border: `1px solid ${accent}20` }}
          />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.09)' }} />
            <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="h-6 w-16 rounded-full" style={{ background: `${accent}12` }} />
        </div>

        {/* Balance */}
        <div className="space-y-1">
          <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-8 w-36 rounded-xl" style={{ background: `${accent}12` }} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: `1px solid ${accent}12` }}>
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="h-4 w-20 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)' }} />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="h-4 w-20 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContasLoading() {
  const accents = ['#7C3AED', '#3B82F6', '#00FF88', '#F5C842']

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-10 w-36 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-52 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="h-10 w-36 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }} />
        </div>
      </div>

      {/* Total balance summary */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1.5">
            <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="h-10 w-40 rounded-xl" style={{ background: 'rgba(0,255,136,0.12)' }} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div className="space-y-1">
              <div className="h-2.5 w-16 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-5 w-24 rounded-lg ml-auto" style={{ background: 'rgba(0,255,136,0.1)' }} />
            </div>
            <div className="space-y-1">
              <div className="h-2.5 w-16 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-5 w-24 rounded-lg ml-auto" style={{ background: 'rgba(239,68,68,0.1)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accents.map((accent, i) => (
          <AccountCard key={i} accent={accent} />
        ))}
      </div>

      {/* Add account placeholder */}
      <div
        className="rounded-2xl h-16 animate-pulse"
        style={{
          background: 'rgba(124,58,237,0.04)',
          border: '1px dashed rgba(124,58,237,0.2)',
        }}
      />
    </div>
  )
}
