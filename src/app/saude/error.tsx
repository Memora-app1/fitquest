'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, Heart, AlertCircle } from 'lucide-react'

export default function SaudeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[SaudeError]', error) }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-md p-8 rounded-2xl relative overflow-hidden text-center space-y-6"
        style={{
          background: 'linear-gradient(135deg, rgba(0,217,255,0.06) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(0,217,255,0.2)',
        }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.2)' }}>
          <Heart size={28} style={{ color: '#00D9FF' }} />
        </div>
        <div>
          <h1 className="text-xl font-black mb-2">Erro ao carregar Saúde</h1>
          <p className="text-sm text-text-secondary">
            Não conseguimos carregar seus dados de saúde. Seus registros estão seguros.
          </p>
          {error.digest && <p className="text-xs text-text-muted font-mono mt-2">ID: {error.digest}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(0,217,255,0.15)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}
          >
            <RefreshCw size={14} /> Recarregar
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-text-secondary border border-border hover:text-white transition-colors">
            <Home size={14} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
