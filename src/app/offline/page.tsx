'use client';

export default function OfflinePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-8 text-center"
      style={{ background: '#050914' }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(124,58,237,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Icon */}
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-5xl"
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
            className="mb-2 text-4xl font-black uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-bebas)',
              background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Sem conexão
          </h1>
          <p className="text-base leading-relaxed text-[#8899BB]">
            Parece que você está offline. Verifique sua conexão e tente novamente.
          </p>
        </div>

        {/* Stats que ainda funcionam offline */}
        <div
          className="rounded-2xl p-4 text-left"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="mb-2 text-xs uppercase tracking-wider text-[#5A6B85]">
            O que você ainda pode fazer
          </p>
          {[
            'Ver páginas já visitadas',
            'Consultar seu progresso em cache',
            'Planejar suas ações para quando voltar',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 py-1">
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]" />
              <span className="text-sm text-[#8899BB]">{item}</span>
            </div>
          ))}
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
            boxShadow: '0 8px 32px rgba(255,77,0,0.25)',
          }}
        >
          Tentar novamente
        </button>

        <p className="text-xs text-[#5A6B85]">⚡ Ascendia — seu progresso está salvo</p>
      </div>
    </div>
  );
}
