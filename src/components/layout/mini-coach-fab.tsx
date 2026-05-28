'use client'

/**
 * Mini Coach FAB — botão flutuante de acesso rápido ao Coach IA.
 * Fica no canto inferior direito, acima do bottom nav no mobile.
 * Pulsa suavemente para chamar atenção sem incomodar.
 */

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bot, X, Zap, MessageCircle } from 'lucide-react'

const QUICK_PROMPTS = [
  'Como está meu progresso hoje?',
  'Me dê um plano de treino rápido',
  'Dicas para manter o streak',
  'Analise meus hábitos desta semana',
]

export function MiniCoachFab() {
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Não mostrar na página do Coach (já tem o chat)
  if (pathname === '/coach') return null
  // Não mostrar no onboarding ou login
  if (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup') return null

  // Pulsa sutilmente a cada 30s para lembrar o usuário
  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 1500)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  function handleQuickPrompt(prompt: string) {
    setOpen(false)
    // Encoda o prompt e navega pro coach
    router.push(`/coach?q=${encodeURIComponent(prompt)}`)
  }

  function handleOpenCoach() {
    setOpen(false)
    router.push('/coach')
  }

  return (
    <>
      {/* Overlay quando aberto */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2">

        {/* Quick prompts menu */}
        {open && (
          <div
            className="mb-2 rounded-2xl overflow-hidden animate-slide-up shadow-2xl"
            style={{
              background: 'rgba(13,24,41,0.98)',
              border: '1px solid rgba(124,58,237,0.35)',
              backdropFilter: 'blur(20px)',
              minWidth: '240px',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                <Bot size={12} style={{ color: '#9F5AF7' }} />
              </div>
              <span className="text-xs font-bold text-white">Coach IA</span>
              <span className="text-[9px] text-text-muted ml-auto">perguntas rápidas</span>
            </div>

            {/* Quick prompts */}
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.04] group"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <Zap size={12} className="text-text-muted group-hover:text-brand-purple transition-colors shrink-0" />
                <span className="text-xs text-text-secondary group-hover:text-white transition-colors">
                  {prompt}
                </span>
              </button>
            ))}

            {/* Open coach button */}
            <button
              onClick={handleOpenCoach}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.04]"
              style={{ borderTop: '1px solid rgba(124,58,237,0.15)' }}
            >
              <MessageCircle size={12} style={{ color: '#9F5AF7' }} />
              <span className="text-xs font-semibold" style={{ color: '#9F5AF7' }}>
                Abrir chat completo →
              </span>
            </button>
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setOpen(prev => !prev)}
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center
            transition-all duration-300 shadow-2xl
            ${pulse && !open ? 'scale-110' : 'scale-100'}
            hover:scale-105 active:scale-95
          `}
          style={{
            background: open
              ? 'rgba(239,68,68,0.15)'
              : 'linear-gradient(135deg, rgba(124,58,237,0.9) 0%, rgba(159,90,247,0.9) 100%)',
            border: open
              ? '1px solid rgba(239,68,68,0.3)'
              : '1px solid rgba(159,90,247,0.5)',
            boxShadow: open
              ? '0 4px 20px rgba(239,68,68,0.2)'
              : `0 4px 20px rgba(124,58,237,0.4), 0 0 ${pulse ? '30px' : '0px'} rgba(124,58,237,0.3)`,
          }}
          aria-label="Abrir Coach IA"
        >
          {open ? (
            <X size={20} style={{ color: '#EF4444' }} />
          ) : (
            <Bot size={22} className="text-white" />
          )}
        </button>

        {/* Pulse ring */}
        {pulse && !open && (
          <div
            className="absolute bottom-0 right-0 w-14 h-14 rounded-2xl pointer-events-none animate-ping"
            style={{
              background: 'transparent',
              border: '2px solid rgba(124,58,237,0.4)',
              animationDuration: '1s',
            }}
          />
        )}
      </div>
    </>
  )
}
