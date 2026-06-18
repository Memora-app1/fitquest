export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      {/* Header */}
      <div className="shimmer h-10 w-40 rounded-xl" style={{ background: 'rgba(21,34,56,0.7)' }} />
      <div className="shimmer h-24 rounded-2xl" style={{ background: 'rgba(21,34,56,0.6)' }} />

      {/* Search / actions */}
      <div className="shimmer h-12 rounded-2xl" style={{ background: 'rgba(21,34,56,0.6)' }} />

      {/* Guild cards */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-20 rounded-2xl"
          style={{ background: 'rgba(21,34,56,0.55)' }}
        />
      ))}
    </div>
  );
}
