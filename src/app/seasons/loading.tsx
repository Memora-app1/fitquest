export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      {/* Header do Battle Pass */}
      <div className="shimmer h-10 w-48 rounded-xl" style={{ background: 'rgba(21,34,56,0.7)' }} />
      <div className="shimmer h-28 rounded-2xl" style={{ background: 'rgba(21,34,56,0.6)' }} />

      {/* Barra de progresso de temporada */}
      <div className="shimmer h-6 rounded-full" style={{ background: 'rgba(21,34,56,0.6)' }} />

      {/* Tiers de recompensa */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-24 rounded-2xl"
          style={{ background: 'rgba(21,34,56,0.55)' }}
        />
      ))}
    </div>
  );
}
