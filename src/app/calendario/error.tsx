'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, CalendarDays, AlertCircle, ChevronRight } from 'lucide-react'

export default function CalendarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CalendarioError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,24,41,0.99) 60%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(59,130,246,0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Ambient glows */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(59,130,246,0.16)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(124,58,237,0.08)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon row */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.28)',
              }}
            >
              <CalendarDays size={28} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.22)' }}
              >
                Seção: Calendário
              </div>
              <h1 className="text-xl font-black">Erro ao carregar calendário</h1>
            </div>
          </div>

          {/* Description */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.14)' }}
          >
            <AlertCircle size={16} style={{ color: '#3B82F6' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar seus eventos e agenda. Seus compromissos estão salvos
                e serão exibidos assim que a conexão for restaurada.
              </p>
              {error.digest && (
                <p className="text-xs text-text-muted font-mono mt-2 select-all">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Recovery tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sugestões:</p>
            {[
              'Recarregar o calendário e seus eventos',
              'Verifique se a integração com Google Calendar está ativa',
              'Tente novamente em alguns segundos',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} style={{ color: '#3B82F6' }} className="shrink-0" />
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
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              <RefreshCw size={15} />
              Recarregar calendário
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
