'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#050914', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            width: '100%', maxWidth: '420px', padding: '40px 32px',
            textAlign: 'center', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(5,9,20,0.99) 100%)',
            border: '1px solid rgba(239,68,68,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 8px' }}>
              Erro crítico
            </h1>
            <p style={{ color: '#8899BB', fontSize: '14px', margin: '0 0 8px' }}>
              Um erro inesperado afetou o sistema. Seu progresso está seguro.
            </p>
            {error.digest && (
              <p style={{ color: '#5A6B85', fontSize: '11px', fontFamily: 'monospace', margin: '0 0 24px' }}>
                ID: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={reset}
                style={{
                  padding: '12px 24px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
                  color: '#fff', fontWeight: 700, fontSize: '14px',
                }}
              >
                Tentar novamente
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: '12px 24px', borderRadius: '14px', textDecoration: 'none',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8899BB', fontWeight: 600, fontSize: '14px', display: 'block',
                }}
              >
                Voltar ao Dashboard
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
