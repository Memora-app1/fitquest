'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, Target, AlertCircle, ChevronRight } from 'lucide-react'

export default function MetasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[MetasError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.99) 60%, rgba(245,200,66,0.04) 100%)',
          border: '1px solid rgba(0,255,136,0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(0,255,136,0.14)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(245,200,66,0.07)' }}
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.25)',
              }}
            >
              <Target size={28} style={{ color: '#00FF88' }} />
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}
              >
                Seção: Metas
              </div>
              <h1 className="text-xl font-black">Erro ao carregar metas</h1>
            </div>
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <AlertCircle size={16} style={{ color: '#00FF88' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar suas metas pessoais. Seu progresso e todas as metas
                cadastradas estão seguros e não foram alterados.
              </p>
              {error.digest && (
                <p className="text-xs text-text-muted font-mono mt-2 select-all">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sugestões:</p>
            {[
              'Tente recarregar a seção de metas',
              'Verifique sua conexão com a internet',
              'Se persistir, volte ao dashboard e tente de novo',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} style={{ color: '#00FF88' }} className="shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #00CC6A, #00FF88)',
                color: '#050914',
                boxShadow: '0 4px 16px rgba(0,255,136,0.25)',
              }}
            >
              <RefreshCw size={15} />
              Recarregar metas
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
