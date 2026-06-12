'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, Zap, AlertCircle, Trophy } from 'lucide-react';

export default function ScoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ScoreError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(245,200,66,0.09) 0%, rgba(13,24,41,0.99) 60%, rgba(255,77,0,0.04) 100%)',
          border: '1px solid rgba(245,200,66,0.28)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,200,66,0.05)',
        }}
      >
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full blur-2xl"
          style={{ background: 'rgba(245,200,66,0.16)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(255,77,0,0.08)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon row */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(245,200,66,0.12)',
                border: '1px solid rgba(245,200,66,0.3)',
              }}
            >
              <Zap size={28} className="text-brand-gold" fill="currentColor" />
            </div>
            <div>
              <div
                className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(245,200,66,0.12)',
                  color: '#F5C842',
                  border: '1px solid rgba(245,200,66,0.25)',
                }}
              >
                Seção: Seu Score
              </div>
              <h1 className="text-xl font-black">Erro ao carregar o Score</h1>
            </div>
          </div>

          {/* Description */}
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              background: 'rgba(245,200,66,0.06)',
              border: '1px solid rgba(245,200,66,0.14)',
            }}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-brand-gold" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar seu nível, XP e conquistas neste momento. Todo o seu
                progresso acumulado está seguro e não foi perdido.
              </p>
              {error.digest && (
                <p className="mt-2 select-all font-mono text-xs text-text-muted">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* XP safety note */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background: 'rgba(245,200,66,0.05)',
              border: '1px solid rgba(245,200,66,0.12)',
            }}
          >
            <Trophy size={14} className="shrink-0 text-brand-gold" />
            <p className="text-xs text-text-secondary">
              Seu XP total e conquistas continuam salvos. O erro é apenas na exibição.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #D4A017, #F5C842)',
                color: '#050914',
                boxShadow: '0 4px 16px rgba(245,200,66,0.3)',
              }}
            >
              <RefreshCw size={15} />
              Recarregar score
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
