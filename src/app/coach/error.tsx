'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, Bot, AlertCircle, Wifi, ChevronRight } from 'lucide-react'

export default function CoachError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CoachError]', error)
  }, [error])

  const isApiError = error.message.toLowerCase().includes('api') ||
    error.message.toLowerCase().includes('anthropic') ||
    error.message.toLowerCase().includes('timeout')

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(13,24,41,0.99) 60%, rgba(236,72,153,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.28)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.06)',
        }}
      >
        {/* Ambient glows */}
        <div
          className="absolute -top-6 -right-6 w-36 h-36 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(124,58,237,0.2)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(236,72,153,0.08)' }}
        />
        {/* Scanline effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 4px)',
          }}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon row */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.35)',
              }}
            >
              <Bot size={28} className="text-brand-purple" />
              {/* Offline indicator */}
              <div
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}
              >
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(124,58,237,0.14)', color: '#9F5AF7', border: '1px solid rgba(124,58,237,0.25)' }}
              >
                Coach IA — Offline
              </div>
              <h1 className="text-xl font-black">Coach indisponível</h1>
            </div>
          </div>

          {/* Description — context-aware */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <AlertCircle size={16} className="text-brand-purple mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                {isApiError
                  ? 'O serviço de IA (Anthropic) está temporariamente indisponível ou sobrecarregado. Isso acontece raramente — tente novamente em alguns minutos.'
                  : 'Não foi possível conectar ao Coach IA. Verifique sua internet e tente recarregar a seção.'}
              </p>
              {error.digest && (
                <p className="text-xs text-text-muted font-mono mt-2 select-all">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
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
                <ChevronRight size={12} className="text-brand-purple shrink-0 mt-0.5" />
                {tip}
              </div>
            ))}
          </div>

          {/* Network status hint */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Wifi size={13} className="text-text-muted shrink-0" />
            <p className="text-xs text-text-muted">
              Seu histórico de conversa com o Coach está salvo e será carregado quando a conexão for restaurada.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
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
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-text-secondary transition-all hover:text-white hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Home size={14} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
