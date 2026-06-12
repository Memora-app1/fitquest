export default function ConquistasLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 p-4 md:p-8">
      {/* Hero skeleton */}
      <div
        className="h-40 rounded-2xl p-6"
        style={{ background: 'rgba(245,200,66,0.05)', border: '1px solid rgba(245,200,66,0.1)' }}
      >
        <div
          className="mb-3 h-4 w-24 rounded-full"
          style={{ background: 'rgba(245,200,66,0.15)' }}
        />
        <div
          className="mb-2 h-8 w-48 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div className="h-4 w-64 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* Rarity grid skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </div>

      {/* Achievement grid skeleton */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
