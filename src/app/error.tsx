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
      <div className="card-glow w-full max-w-md p-10 text-center space-y-6 animate-slide-up">
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
