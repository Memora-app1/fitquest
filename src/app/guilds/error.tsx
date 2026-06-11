'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCcw, Users } from 'lucide-react'

export default function GuildsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GuildsError]', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div
        className="w-full max-w-md p-10 text-center space-y-6 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Users size={28} style={{ color: '#7C3AED' }} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black">Erro ao carregar Guilds</h1>
          <p className="text-sm text-text-secondary">
            Não foi possível carregar as guilds. Verifique sua conexão.
          </p>
          {error.digest && (
            <p className="text-xs text-text-muted font-mono">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={reset} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <RefreshCcw size={15} /> Tentar novamente
          </button>
          <Link href="/dashboard" className="btn-ghost flex-1 flex items-center justify-center gap-2">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
