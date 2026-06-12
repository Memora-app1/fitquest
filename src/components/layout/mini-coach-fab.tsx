'use client';

/**
 * Mini Coach FAB — botão flutuante de acesso rápido ao Coach IA.
 * Fica no canto inferior direito, acima do bottom nav no mobile.
 * Pulsa suavemente para chamar atenção sem incomodar.
 *
 * NOTA: todos os hooks são chamados antes de qualquer return condicional
 * para respeitar as Rules of Hooks do React.
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bot, X, Zap, MessageCircle } from 'lucide-react';
import { useScrollLock } from '@/hooks/use-scroll-lock';

// Rotas que exibem o MobileFab — usado para empurrar o MiniCoachFab para cima
const MOBILE_FAB_ROUTES = new Set(['/habitos', '/treinos', '/tarefas', '/financas', '/saude']);

const QUICK_PROMPTS = [
  'Como está meu progresso hoje?',
  'Me dê um plano de treino rápido',
  'Dicas para manter o streak',
  'Analise meus hábitos desta semana',
];

export function MiniCoachFab() {
  // ── Todos os hooks ANTES de qualquer return condicional ──────────────────
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useScrollLock(open);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1500);
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  const base = '/' + pathname.split('/')[1];
  const hidden =
    base === '/coach' || base === '/onboarding' || base === '/login' || base === '/signup';

  if (hidden) return null;

  // Se o MobileFab também está visível nesta rota, sobe o MiniCoachFab
  const hasMobileFab = MOBILE_FAB_ROUTES.has(base);

  function handleQuickPrompt(prompt: string) {
    setOpen(false);
    router.push(`/coach?q=${encodeURIComponent(prompt)}`);
  }

  function handleOpenCoach() {
    setOpen(false);
    router.push('/coach');
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div
        className="fixed right-4 z-50 flex flex-col items-end gap-2 md:right-6"
        style={{
          bottom: hasMobileFab
            ? `calc(env(safe-area-inset-bottom, 0px) + 126px)`
            : `calc(env(safe-area-inset-bottom, 0px) + 72px)`,
          transition: 'bottom 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        {/* Quick prompts menu */}
        {open && (
          <div
            className="mb-2 overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(13,24,41,0.98)',
              border: '1px solid rgba(124,58,237,0.35)',
              backdropFilter: 'blur(20px)',
              minWidth: '240px',
              animation: 'fabSpringIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              transformOrigin: 'bottom right',
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.3)',
                }}
              >
                <Bot size={12} style={{ color: '#9F5AF7' }} />
              </div>
              <span className="text-xs font-bold text-white">Coach IA</span>
              <span className="ml-auto text-[9px] text-text-muted">perguntas rápidas</span>
            </div>

            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.04] active:bg-white/[0.06]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <Zap
                  size={12}
                  className="shrink-0 text-text-muted transition-colors group-hover:text-brand-purple"
                />
                <span className="text-xs text-text-secondary transition-colors group-hover:text-white">
                  {prompt}
                </span>
              </button>
            ))}

            <button
              onClick={handleOpenCoach}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.04] active:bg-white/[0.06]"
              style={{ borderTop: '1px solid rgba(124,58,237,0.15)' }}
            >
              <MessageCircle size={12} style={{ color: '#9F5AF7' }} />
              <span className="text-xs font-semibold" style={{ color: '#9F5AF7' }}>
                Abrir chat completo →
              </span>
            </button>
          </div>
        )}

        {/* Botão principal */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300"
          style={{
            background: open
              ? 'rgba(239,68,68,0.15)'
              : 'linear-gradient(135deg, rgba(124,58,237,0.9) 0%, rgba(159,90,247,0.9) 100%)',
            border: open ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(159,90,247,0.5)',
            boxShadow: open
              ? '0 4px 20px rgba(239,68,68,0.2)'
              : `0 4px 20px rgba(124,58,237,0.4), 0 0 ${pulse ? '30px' : '0px'} rgba(124,58,237,0.3)`,
            transform: pulse && !open ? 'scale(1.1)' : 'scale(1)',
          }}
          aria-label="Abrir Coach IA"
        >
          {open ? (
            <X size={20} style={{ color: '#EF4444' }} />
          ) : (
            <Bot size={22} className="text-white" />
          )}
        </button>

        {/* Anel de pulse */}
        {pulse && !open && (
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 animate-ping rounded-2xl"
            style={{
              background: 'transparent',
              border: '2px solid rgba(124,58,237,0.4)',
              animationDuration: '1s',
            }}
          />
        )}
      </div>
    </>
  );
}
