'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/nova-senha` }
    )

    setLoading(false)

    if (resetError) {
      if (resetError.message.includes('rate') || resetError.message.includes('too many')) {
        setError('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setError('Não foi possível enviar o email. Tente novamente.')
      }
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-green/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          <div
            className="p-8 space-y-6 text-center rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(0,255,136,0.25)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(0,255,136,0.12)' }} />
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-brand-green" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Email enviado!</h1>
              <p className="text-text-secondary">
                Enviamos um link para{' '}
                <span className="text-white font-semibold">{email}</span>
              </p>
              <p className="text-sm text-text-muted">
                Clique no link do email para criar uma nova senha. O link expira em 1 hora.
              </p>
            </div>

            {/* Steps */}
            <div className="text-left rounded-xl bg-bg-elevated border border-border p-4 space-y-3">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Próximos passos</div>
              {[
                'Abra seu email',
                'Clique em "Redefinir senha"',
                'Crie uma nova senha segura',
                'Pronto — de volta ao FitQuest!',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm text-text-secondary">{step}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-text-muted">
              Não recebeu?{' '}
              <button
                onClick={() => setSent(false)}
                className="text-brand-orange underline hover:no-underline"
              >
                Tentar outro email
              </button>{' '}
              ou verifique o spam.
            </p>

            <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2">
              <ArrowLeft size={16} />
              Voltar ao login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-orange/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="heading-display text-3xl gradient-text">⚡ FitQuest</span>
          </Link>
        </div>

        <div
          className="p-8 space-y-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(255,77,0,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)' }} />
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
              <Mail size={22} className="text-brand-orange" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Recuperar senha</h1>
              <p className="text-text-secondary text-sm mt-0.5">
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email da sua conta
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="voce@email.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Enviando…
                </>
              ) : (
                'Enviar link de recuperação →'
              )}
            </button>
          </form>

          <div className="text-center text-sm">
            <Link href="/login" className="text-brand-orange hover:underline font-medium flex items-center justify-center gap-1">
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
