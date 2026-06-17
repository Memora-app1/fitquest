'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, CheckCircle2, Zap, Trophy, Flame, Target, Shield, Gift } from 'lucide-react';

function friendlyError(message: string): string {
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'Este email já tem uma conta. Tente fazer login.';
  }
  if (message.includes('Database error') || message.includes('saving new user')) {
    return 'Erro ao criar perfil. Tente novamente em alguns segundos.';
  }
  if (message.includes('Invalid email')) {
    return 'Email inválido. Verifique o endereço digitado.';
  }
  if (message.includes('Password should be')) {
    return 'A senha precisa ter no mínimo 6 caracteres.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
  }
  return 'Ocorreu um erro. Tente novamente.';
}

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

const BENEFITS = [
  {
    icon: <Zap size={16} className="text-brand-gold" />,
    text: 'XP por hábitos, treinos e tarefas',
  },
  {
    icon: <Flame size={16} className="text-brand-orange" />,
    text: 'Streak diário que te mantém motivado',
  },
  {
    icon: <Trophy size={16} className="text-brand-purple" />,
    text: '8 níveis do Iniciante ao Ascendia Master',
  },
  {
    icon: <Target size={16} className="text-brand-green" />,
    text: 'Coach IA contextualizado no seu progresso',
  },
  {
    icon: <Shield size={16} className="text-brand-blue" />,
    text: 'Finanças e tarefas integradas ao XP',
  },
];

const MILESTONES = [
  { label: 'Dia 1', desc: '+100 XP bônus de boas-vindas', color: '#F5C842' },
  { label: 'Semana 1', desc: 'Nível 2 — Dedicado', color: '#7C3AED' },
  { label: 'Mês 1', desc: 'Atleta ou acima', color: '#FF4D00' },
  { label: 'Mês 3', desc: 'Ascendia Master 🏆', color: '#00FF88' },
];

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill referral code from URL param ?ref=CODE
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  async function handleGoogleSignup() {
    setOauthLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (oauthError) {
      setError('Erro ao conectar com Google. Tente com email.');
      setOauthLoading(false);
    }
  }

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const canSubmit = !loading && (confirmPassword.length === 0 || password === confirmPassword);

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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || email.split('@')[0] },
      },
    });

    if (signUpError) {
      console.error('[signup] error:', signUpError.message, signUpError);
      setError(friendlyError(signUpError.message));
      setLoading(false);
      return;
    }

    // Aplica código de indicação se foi informado (fire-and-forget, não bloqueia redirect)
    if (referralCode.trim()) {
      fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralCode.trim().toUpperCase() }),
      }).catch(() => null);
    }

    router.push('/onboarding');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen">
      {/* Left panel — branding */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[480px] xl:w-[520px]"
        style={{ background: 'linear-gradient(145deg, #0D1829 0%, #050914 100%)' }}
      >
        {/* Decorative glows */}
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-purple/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-brand-orange/10 blur-[100px]" />

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <span className="heading-display gradient-text text-3xl">⚡ Ascendia</span>
        </Link>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="heading-display mb-3 text-4xl leading-tight">
              Comece sua
              <br />
              <span className="gradient-text">jornada hoje.</span>
            </h2>
            <p className="leading-relaxed text-text-secondary">
              7 dias grátis para descobrir como a gamificação transforma sua rotina.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                  {b.icon}
                </div>
                <span className="text-sm text-text-secondary">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div className="space-y-3 rounded-2xl border border-border bg-bg-elevated/50 p-4">
            <div className="text-xs uppercase tracking-wider text-text-muted">
              Sua linha do tempo
            </div>
            {MILESTONES.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: `${m.color}20`, color: m.color }}
                >
                  {m.label}
                </div>
                <span className="text-xs text-text-secondary">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10 text-xs text-text-muted">
          Sem cartão de crédito para o trial · Cancele a qualquer momento
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        {/* Mobile background glow */}
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-purple/5 blur-[80px] lg:hidden" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-orange/5 blur-[80px] lg:hidden" />

        <div className="relative z-10 w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/">
              <span className="heading-display gradient-text text-3xl">⚡ Ascendia</span>
            </Link>
          </div>

          <div
            className="relative space-y-5 overflow-hidden rounded-2xl p-8"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(124,58,237,0.06)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10 space-y-1">
              <h1 className="text-2xl font-bold">Criar conta · 7 dias para testar</h1>
              <p className="text-sm text-text-secondary">
                Sem cartão de crédito · Cancele quando quiser
              </p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={oauthLoading || loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {oauthLoading ? 'Conectando…' : 'Continuar com Google'}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-text-muted">ou com email</span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Como podemos te chamar?
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                  placeholder="Seu primeiro nome"
                  autoComplete="given-name"
                  autoFocus
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Senha</label>
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

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Confirmar senha
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

              {/* Referral code (optional) */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                  <Gift size={13} style={{ color: '#F5C842' }} />
                  Código de indicação
                  <span className="text-[11px] text-text-muted">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="input w-full font-mono uppercase tracking-widest"
                    placeholder="EX: ABC123"
                    maxLength={12}
                    autoComplete="off"
                  />
                  {referralCode.length >= 4 && (
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold" style={{ color: '#F5C842' }}>
                      <Zap size={10} fill="currentColor" />
                      +200 XP
                    </div>
                  )}
                </div>
                {referralCode.length >= 4 && (
                  <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: '#00FF88' }}>
                    <CheckCircle2 size={10} />
                    Você e seu amigo recebem +200 XP de bônus!
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-brand-red/20 bg-brand-red/10 p-3 text-sm text-brand-red">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Criando conta…
                  </>
                ) : (
                  'Começar agora — é grátis →'
                )}
              </button>
            </form>

            {/* Login link */}
            <div className="text-center text-sm text-text-secondary">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-brand-orange hover:underline">
                Entrar →
              </Link>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-text-muted">
              Ao criar conta, você concorda com os{' '}
              <Link
                href="/termos"
                className="underline transition-colors hover:text-text-secondary"
              >
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link
                href="/privacidade"
                className="underline transition-colors hover:text-text-secondary"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
