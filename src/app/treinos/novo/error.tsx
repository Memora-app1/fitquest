'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, Dumbbell, AlertCircle, ChevronRight, Save } from 'lucide-react';

export default function NovoTreinoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[NovoTreinoError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.99) 60%, rgba(245,200,66,0.04) 100%)',
          border: '1px solid rgba(255,77,0,0.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Corner glow */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-2xl"
          style={{ background: 'rgba(255,77,0,0.14)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full blur-xl"
          style={{ background: 'rgba(245,200,66,0.08)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.24)' }}
            >
              <Dumbbell size={26} style={{ color: '#FF4D00' }} />
            </div>
            <div>
              <div
                className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(255,77,0,0.1)',
                  color: '#FF4D00',
                  border: '1px solid rgba(255,77,0,0.2)',
                }}
              >
                Treinos › Novo Treino
              </div>
              <h1 className="text-xl font-black">Erro ao carregar o formulário</h1>
            </div>
          </div>

          {/* Error message */}
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: 'rgba(255,77,0,0.05)', border: '1px solid rgba(255,77,0,0.12)' }}
          >
            <AlertCircle size={16} style={{ color: '#FF4D00' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar o formulário de novo treino. Nenhum dado foi perdido —
                você pode tentar novamente com segurança.
              </p>
              {error.digest && (
                <p className="mt-2 select-all font-mono text-xs text-text-muted">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Save tip */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background: 'rgba(245,200,66,0.05)',
              border: '1px solid rgba(245,200,66,0.1)',
            }}
          >
            <Save size={14} className="shrink-0 text-brand-gold" />
            <p className="text-xs text-text-secondary">
              Dica: anote os exercícios antes de recarregar para não perder nada.
            </p>
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              O que tentar:
            </p>
            {[
              'Recarregar o formulário de treino',
              'Voltar ao histórico e criar de lá',
              'Verificar sua conexão com a internet',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} style={{ color: '#FF4D00' }} className="shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #CC3D00, #FF4D00)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(255,77,0,0.25)',
              }}
            >
              <RefreshCw size={15} />
              Recarregar formulário
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
