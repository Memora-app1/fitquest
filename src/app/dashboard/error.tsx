'use client';

import { useEffect } from 'react';
import { RefreshCw, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl p-8 text-center"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 60%, rgba(124,58,237,0.05) 100%)',
          border: '1px solid rgba(255,77,0,0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Glows */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-2xl"
          style={{ background: 'rgba(255,77,0,0.14)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full blur-xl"
          style={{ background: 'rgba(124,58,237,0.1)' }}
        />

        <div className="relative z-10 space-y-5">
          {/* Icon */}
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,0,0.15), rgba(124,58,237,0.1))',
              border: '1px solid rgba(255,77,0,0.3)',
              boxShadow: '0 8px 24px rgba(255,77,0,0.15)',
            }}
          >
            <AlertTriangle size={30} className="text-brand-orange" />
          </div>

          {/* Copy */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black">Dashboard indisponível</h1>
            <p className="text-sm leading-relaxed text-text-secondary">
              Um erro inesperado aconteceu ao carregar seu dashboard. Suas metas, hábitos e
              progresso estão seguros.
            </p>
            {error.digest && (
              <p className="mt-1 select-all font-mono text-xs text-text-muted">
                Código de erro: {error.digest}
              </p>
            )}
          </div>

          {/* Feature quick links */}
          <div className="grid grid-cols-2 gap-2 text-left">
            {[
              { label: '💪 Hábitos', href: '/habitos', accent: '#FF4D00' },
              { label: '✅ Tarefas', href: '/tarefas', accent: '#7C3AED' },
              { label: '💰 Finanças', href: '/financas', accent: '#3B82F6' },
              { label: '🤖 Coach', href: '/coach', accent: '#9F5AF7' },
            ].map(({ label, href, accent }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                style={{
                  background: `${accent}0D`,
                  border: `1px solid ${accent}20`,
                  color: accent,
                }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* XP reminder */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background: 'rgba(245,200,66,0.06)',
              border: '1px solid rgba(245,200,66,0.14)',
            }}
          >
            <Zap size={14} className="shrink-0 text-brand-gold" fill="currentColor" />
            <p className="text-left text-xs text-text-secondary">
              Seu XP total e streak continuam protegidos no servidor.
            </p>
            <TrendingUp size={12} className="ml-auto shrink-0 text-brand-gold/50" />
          </div>

          {/* Retry */}
          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #C03A00, #FF4D00)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(255,77,0,0.3)',
            }}
          >
            <RefreshCw size={16} />
            Recarregar dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
