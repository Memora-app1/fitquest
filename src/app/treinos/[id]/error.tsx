'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, Dumbbell, AlertCircle, ChevronRight } from 'lucide-react';

export default function WorkoutDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[WorkoutDetailError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.99) 60%, rgba(245,200,66,0.04) 100%)',
          border: '1px solid rgba(0,255,136,0.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-2xl"
          style={{ background: 'rgba(0,255,136,0.14)' }}
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.24)',
              }}
            >
              <Dumbbell size={26} style={{ color: '#00FF88' }} />
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
                Treinos › Detalhe
              </div>
              <h1 className="text-xl font-black">Erro ao carregar treino</h1>
            </div>
          </div>

          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <AlertCircle size={16} style={{ color: '#00FF88' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar os detalhes deste treino. Os dados de séries, exercícios e
                PRs estão seguros no servidor.
              </p>
              {error.digest && (
                <p className="mt-2 select-all font-mono text-xs text-text-muted">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              O que tentar:
            </p>
            {[
              'Recarregar os detalhes deste treino',
              'Voltar ao histórico e tentar abrir novamente',
              'Verificar sua conexão com a internet',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} style={{ color: '#00FF88' }} className="shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #00CC6A, #00FF88)',
                color: '#050914',
                boxShadow: '0 4px 16px rgba(0,255,136,0.22)',
              }}
            >
              <RefreshCw size={15} />
              Recarregar treino
            </button>
            <Link
              href="/treinos"
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-white/5 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={14} />
              Meus treinos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
