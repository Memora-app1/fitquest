'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-md p-10 text-center space-y-6 animate-slide-up rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(239,68,68,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(239,68,68,0.15)' }} />
        <div className="text-6xl">⚠️</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="text-text-secondary">
            Um erro inesperado aconteceu. Seu progresso está seguro.
          </p>
          {error.digest && (
            <p className="text-xs text-text-muted font-mono">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button onClick={reset} className="btn-primary px-6 py-3">
            Tentar novamente
          </button>
          <Link href="/dashboard" className="btn-ghost px-6 py-3">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  )
}
