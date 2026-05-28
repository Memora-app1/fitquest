'use client'

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{ background: '#050914' }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(124,58,237,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-sm w-full space-y-6">
        {/* Icon */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto"
          style={{
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.25)',
            boxShadow: '0 0 40px rgba(124,58,237,0.15)',
          }}
        >
          📡
        </div>

        {/* Text */}
        <div>
          <h1
            className="text-4xl font-black mb-2 uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-bebas)',
              background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Sem conexão
          </h1>
          <p className="text-[#8899BB] text-base leading-relaxed">
            Parece que você está offline. Verifique sua conexão e tente novamente.
          </p>
        </div>

        {/* Stats que ainda funcionam offline */}
        <div
          className="rounded-2xl p-4 text-left"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs text-[#5A6B85] uppercase tracking-wider mb-2">O que você ainda pode fazer</p>
          {['Ver páginas já visitadas', 'Consultar seu progresso em cache', 'Planejar suas ações para quando voltar'].map((item) => (
            <div key={item} className="flex items-center gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] shrink-0" />
              <span className="text-sm text-[#8899BB]">{item}</span>
            </div>
          ))}
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
            boxShadow: '0 8px 32px rgba(255,77,0,0.25)',
          }}
        >
          Tentar novamente
        </button>

        <p className="text-xs text-[#5A6B85]">
          ⚡ Ascendia — seu progresso está salvo
        </p>
      </div>
    </div>
  )
}
