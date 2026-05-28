export default function ConquistasLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-2xl p-6 h-40" style={{ background: 'rgba(245,200,66,0.05)', border: '1px solid rgba(245,200,66,0.1)' }}>
        <div className="h-4 w-24 rounded-full mb-3" style={{ background: 'rgba(245,200,66,0.15)' }} />
        <div className="h-8 w-48 rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 w-64 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* Rarity grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 h-24" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }} />
        ))}
      </div>

      {/* Achievement grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 h-28" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    </div>
  )
}
