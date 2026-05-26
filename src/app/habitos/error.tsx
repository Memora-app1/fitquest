'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, Target, AlertCircle, ChevronRight } from 'lucide-react'

export default function HabitosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[HabitosError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 60%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(255,77,0,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,77,0,0.04)',
        }}
      >
        {/* Ambient glows */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(255,77,0,0.18)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(124,58,237,0.1)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon row */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(255,77,0,0.12)',
                border: '1px solid rgba(255,77,0,0.3)',
              }}
            >
              <Target size={28} className="text-brand-orange" />
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(255,77,0,0.12)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.2)' }}
              >
                Seção: Hábitos
              </div>
              <h1 className="text-xl font-black">Erro ao carregar hábitos</h1>
            </div>
          </div>

          {/* Description */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(255,77,0,0.06)', border: '1px solid rgba(255,77,0,0.15)' }}
          >
            <AlertCircle size={16} className="text-brand-orange mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não conseguimos carregar seus hábitos. Isso pode ser um problema temporário de conexão.
                Seus dados estão seguros e nenhum progresso foi perdido.
              </p>
              {error.digest && (
                <p className="text-xs text-text-muted font-mono mt-2 select-all">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Quick recovery tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">O que você pode fazer:</p>
            {[
              'Tente recarregar a seção abaixo',
              'Verifique sua conexão com a internet',
              'Se o erro persistir, volte ao dashboard',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} className="text-brand-orange shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #FF4D00, #FF7A00)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(255,77,0,0.3)',
              }}
            >
              <RefreshCw size={15} />
              Recarregar hábitos
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
