'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, Dumbbell, AlertCircle, ChevronRight } from 'lucide-react';

export default function TreinosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TreinosError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.99) 60%, rgba(59,130,246,0.04) 100%)',
          border: '1px solid rgba(0,255,136,0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,255,136,0.04)',
        }}
      >
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-2xl"
          style={{ background: 'rgba(0,255,136,0.15)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(59,130,246,0.1)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon row */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.25)',
              }}
            >
              <Dumbbell size={28} style={{ color: '#00FF88' }} />
            </div>
            <div>
              <div
                className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(0,255,136,0.1)',
                  color: '#00FF88',
                  border: '1px solid rgba(0,255,136,0.2)',
                }}
              >
                Seção: Treinos
              </div>
              <h1 className="text-xl font-black">Erro ao carregar treinos</h1>
            </div>
          </div>

          {/* Description */}
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <AlertCircle size={16} style={{ color: '#00FF88' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar seu histórico de treinos. Seus dados estão seguros no
                servidor — o problema é apenas temporário.
              </p>
              {error.digest && (
                <p className="mt-2 select-all font-mono text-xs text-text-muted">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Quick recovery tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Sugestões:
            </p>
            {[
              'Tente recarregar a seção de treinos',
              'Verifique sua conexão com a internet',
              'Se o problema persistir, volte ao dashboard',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} style={{ color: '#00FF88' }} className="shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #00CC6A, #00FF88)',
                color: '#050914',
                boxShadow: '0 4px 16px rgba(0,255,136,0.25)',
              }}
            >
              <RefreshCw size={15} />
              Recarregar treinos
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-white/5 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Home size={14} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
