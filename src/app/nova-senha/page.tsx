'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: 'Fraca', color: '#EF4444' };
  if (score <= 2) return { score: 2, label: 'Razoável', color: '#F5C842' };
  if (score <= 3) return { score: 3, label: 'Boa', color: '#FF4D00' };
  return { score: 4, label: 'Forte', color: '#00FF88' };
}

export default function NovaSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
        setError('Link expirado ou inválido. Solicite um novo link de recuperação.');
      } else {
        setError('Não foi possível atualizar a senha. Tente novamente.');
      }
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 2000);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div
            className="relative space-y-4 overflow-hidden rounded-2xl p-8 text-center"
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
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-brand-green/30 bg-brand-green/10">
              <CheckCircle2 size={36} className="text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold">Senha atualizada!</h1>
            <p className="text-text-secondary">
              Sua nova senha foi salva com sucesso. Redirecionando para o dashboard…
            </p>
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-purple/5 blur-[100px]" />

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
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(124,58,237,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            }}
          />
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
              <Lock size={22} className="text-brand-purple" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Nova senha</h1>
              <p className="mt-0.5 text-sm text-text-secondary">
                Crie uma senha segura para sua conta Ascendia.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pr-10"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: strength.score >= bar ? strength.color : '#1E2D45',
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: strength.color }}>
                    {strength.label}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input w-full pr-10 ${
                    !passwordsMatch ? 'border-brand-red/60 focus:border-brand-red' : ''
                  }`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="mt-1 text-xs text-brand-red">As senhas não coincidem</p>
              )}
              {confirmPassword.length > 0 && passwordsMatch && (
                <p className="mt-1 flex items-center gap-1 text-xs text-brand-green">
                  <CheckCircle2 size={10} /> Senhas coincidem
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-brand-red/20 bg-brand-red/10 p-3 text-sm text-brand-red">
                <p>{error}</p>
                {error.includes('expirado') && (
                  <Link
                    href="/recuperar-senha"
                    className="mt-2 block text-xs text-brand-orange underline"
                  >
                    Solicitar novo link →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!passwordsMatch && confirmPassword.length > 0)}
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Salvando…
                </>
              ) : (
                'Salvar nova senha →'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
