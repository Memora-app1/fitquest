'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, Bot, AlertCircle, Wifi, ChevronRight } from 'lucide-react';

export default function CoachError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CoachError]', error);
  }, [error]);

  const isApiError =
    error.message.toLowerCase().includes('api') ||
    error.message.toLowerCase().includes('anthropic') ||
    error.message.toLowerCase().includes('timeout');

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(13,24,41,0.99) 60%, rgba(236,72,153,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.28)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.06)',
        }}
      >
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full blur-2xl"
          style={{ background: 'rgba(124,58,237,0.2)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-4 -left-4 h-28 w-28 rounded-full blur-xl"
          style={{ background: 'rgba(236,72,153,0.08)' }}
        />
        {/* Scanline effect */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 4px)',
          }}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon row */}
          <div className="flex items-center gap-4">
            <div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.35)',
              }}
            >
              <Bot size={28} className="text-brand-purple" />
              {/* Offline indicator */}
              <div
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                }}
              >
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </div>
            </div>
            <div>
              <div
                className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(124,58,237,0.14)',
                  color: '#9F5AF7',
                  border: '1px solid rgba(124,58,237,0.25)',
                }}
              >
                Coach IA — Offline
              </div>
              <h1 className="text-xl font-black">Coach indisponível</h1>
            </div>
          </div>

          {/* Description — context-aware */}
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              background: 'rgba(124,58,237,0.07)',
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-brand-purple" />
            <div>
              <p className="text-sm text-text-secondary">
                {isApiError
                  ? 'O serviço de IA (Anthropic) está temporariamente indisponível ou sobrecarregado. Isso acontece raramente — tente novamente em alguns minutos.'
                  : 'Não foi possível conectar ao Coach IA. Verifique sua internet e tente recarregar a seção.'}
              </p>
              {error.digest && (
                <p className="mt-2 select-all font-mono text-xs text-text-muted">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {isApiError ? 'Sobre o erro da IA:' : 'O que tentar:'}
            </p>
            {(isApiError
              ? [
                  'O serviço de IA pode estar com alto tráfego',
                  'Aguarde 1-2 minutos e tente recarregar',
                  'Seu histórico de chat está salvo e não foi perdido',
                ]
              : [
                  'Verifique sua conexão com a internet',
                  'Recarregue a página do Coach',
                  'Se o erro persistir, volte mais tarde',
                ]
            ).map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} className="mt-0.5 shrink-0 text-brand-purple" />
                {tip}
              </div>
            ))}
          </div>

          {/* Network status hint */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Wifi size={13} className="shrink-0 text-text-muted" />
            <p className="text-xs text-text-muted">
              Seu histórico de conversa com o Coach está salvo e será carregado quando a conexão for
              restaurada.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              }}
            >
              <RefreshCw size={15} />
              Tentar novamente
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
