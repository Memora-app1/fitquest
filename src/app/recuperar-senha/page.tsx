'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/nova-senha` }
    );

    setLoading(false);

    if (resetError) {
      if (resetError.message.includes('rate') || resetError.message.includes('too many')) {
        setError('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        setError('Não foi possível enviar o email. Tente novamente.');
      }
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-green/5 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md animate-slide-up">
          <div
            className="relative space-y-6 overflow-hidden rounded-2xl p-8 text-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(0,255,136,0.25)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
              style={{ background: 'rgba(0,255,136,0.12)' }}
            />
            {/* Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-brand-green/30 bg-brand-green/10">
              <CheckCircle2 size={36} className="text-brand-green" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Email enviado!</h1>
              <p className="text-text-secondary">
                Enviamos um link para <span className="font-semibold text-white">{email}</span>
              </p>
              <p className="text-sm text-text-muted">
                Clique no link do email para criar uma nova senha. O link expira em 1 hora.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3 rounded-xl border border-border bg-bg-elevated p-4 text-left">
              <div className="mb-1 text-xs uppercase tracking-wider text-text-muted">
                Próximos passos
              </div>
              {[
                'Abra seu email',
                'Clique em "Redefinir senha"',
                'Crie uma nova senha segura',
                'Pronto — de volta ao Ascendia!',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 text-[10px] font-bold text-brand-orange">
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

            <Link
              href="/login"
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-orange/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            <span className="heading-display gradient-text text-3xl">⚡ Ascendia</span>
          </Link>
        </div>

        <div
          className="relative space-y-6 overflow-hidden rounded-2xl p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(255,77,0,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10">
              <Mail size={22} className="text-brand-orange" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Recuperar senha</h1>
              <p className="mt-0.5 text-sm text-text-secondary">
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
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
              <div className="rounded-xl border border-brand-red/20 bg-brand-red/10 p-3 text-sm text-brand-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-60"
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
            <Link
              href="/login"
              className="flex items-center justify-center gap-1 font-medium text-brand-orange hover:underline"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
