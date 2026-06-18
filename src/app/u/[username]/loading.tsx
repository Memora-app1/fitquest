export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#050914' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="shimmer h-7 w-28 rounded-lg" style={{ background: 'rgba(21,34,56,0.7)' }} />
        <div className="shimmer h-9 w-28 rounded-xl" style={{ background: 'rgba(21,34,56,0.7)' }} />
      </div>

      <div className="mx-auto max-w-xl space-y-6 px-4 pb-12 pt-12">
        {/* Card principal do perfil */}
        <div
          className="space-y-4 rounded-3xl p-6"
          style={{ background: 'rgba(13,24,41,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Avatar */}
          <div className="flex justify-center">
            <div
              className="shimmer h-24 w-24 rounded-full"
              style={{ background: 'rgba(21,34,56,0.8)' }}
            />
          </div>
          {/* Nome + nível */}
          <div className="flex flex-col items-center gap-2">
            <div className="shimmer h-6 w-40 rounded-lg" style={{ background: 'rgba(21,34,56,0.8)' }} />
            <div className="shimmer h-4 w-28 rounded-lg" style={{ background: 'rgba(21,34,56,0.6)' }} />
          </div>
          {/* Barra de progresso */}
          <div className="shimmer h-3 rounded-full" style={{ background: 'rgba(21,34,56,0.6)' }} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="shimmer h-20 rounded-2xl"
              style={{ background: 'rgba(21,34,56,0.55)' }}
            />
          ))}
        </div>

        {/* Conquistas */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shimmer h-16 rounded-2xl"
              style={{ background: 'rgba(21,34,56,0.5)' }}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="shimmer h-12 rounded-2xl" style={{ background: 'rgba(21,34,56,0.6)' }} />
      </div>
    </div>
  );
}
