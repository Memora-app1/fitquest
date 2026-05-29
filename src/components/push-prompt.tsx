'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, X, Zap, Flame, Trophy } from 'lucide-react'

const LS_KEY = 'fq_push_dismissed_at'
const LS_NEVER = 'fq_push_never'
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(LS_NEVER) === '1') return false
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return true
    return Date.now() - parseInt(raw, 10) > REMIND_AFTER_MS
  } catch {
    return true
  }
}

function dismissTemporarily() {
  try { localStorage.setItem(LS_KEY, String(Date.now())) } catch { /* noop */ }
}

function dismissForever() {
  try { localStorage.setItem(LS_NEVER, '1') } catch { /* noop */ }
}

// Notification preview examples shown in the prompt body
const EXAMPLES = [
  { icon: '🔥', text: 'Sua sequência de 7 dias está em risco!', color: '#FF4D00' },
  { icon: '🏆', text: 'Conquista desbloqueada: Guerreiro da Semana', color: '#F5C842' },
  { icon: '⚡', text: 'Lembrete: 2 hábitos pendentes hoje (+100 XP)', color: '#7C3AED' },
]

type Phase = 'idle' | 'visible' | 'loading' | 'success' | 'error'

export function PushPrompt() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [exampleIndex, setExampleIndex] = useState(0)

  // Rotate examples every 2.5s while visible
  useEffect(() => {
    if (phase !== 'visible') return
    const id = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 2500)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'default') return
    if (!shouldShow()) return

    // Melhor timing: mostrar APÓS 1º hábito concluído (opt-in +22% vs timer fixo)
    function handleHabitLogged() {
      setTimeout(() => setPhase('visible'), 2500) // aguarda animação de XP
    }
    window.addEventListener('ascendia:habit-logged', handleHabitLogged, { once: true })

    // Fallback: 3 minutos se nenhum hábito for logado
    const fallback = setTimeout(() => setPhase('visible'), 3 * 60 * 1000)

    return () => {
      window.removeEventListener('ascendia:habit-logged', handleHabitLogged)
      clearTimeout(fallback)
    }
  }, [])

  async function subscribe() {
    setPhase('loading')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      const json = sub.toJSON()
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      })

      if (res.ok) {
        setPhase('success')
        setTimeout(() => setPhase('idle'), 3000)
      } else {
        throw new Error('Failed to register push subscription')
      }
    } catch {
      setPhase('error')
      setTimeout(() => setPhase('visible'), 2500)
    }
  }

  function handleDismiss() {
    dismissTemporarily()
    setPhase('idle')
  }

  function handleNever() {
    dismissForever()
    setPhase('idle')
  }

  if (phase === 'idle') return null

  const example = EXAMPLES[exampleIndex]!

  // ── Success state ────────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 pointer-events-none">
        <div
          className="p-4 flex items-center gap-3 rounded-2xl animate-slide-up"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(0,255,136,0.35)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,136,0.1)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}
          >
            <Bell size={18} style={{ color: '#00FF88' }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: '#00FF88' }}>Notificações ativadas!</p>
            <p className="text-xs text-text-secondary mt-0.5">Você vai receber lembretes de hábitos e conquistas.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 pointer-events-none">
        <div
          className="p-4 flex items-center gap-3 rounded-2xl"
          style={{
            background: 'rgba(13,24,41,0.99)',
            border: '1px solid rgba(239,68,68,0.35)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <BellOff size={18} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#EF4444' }}>Não foi possível ativar</p>
            <p className="text-xs text-text-secondary mt-0.5">Verifique as permissões do navegador.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main prompt ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-slide-up"
    >
      <div
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(245,200,66,0.28)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.65), 0 0 30px rgba(245,200,66,0.06)',
        }}
      >
        {/* Corner glow */}
        <div
          className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(245,200,66,0.18)' }}
        />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all z-10"
          aria-label="Fechar"
        >
          <X size={13} />
        </button>

        <div className="relative z-10 p-4 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3 pr-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(245,200,66,0.14)',
                border: '1px solid rgba(245,200,66,0.28)',
              }}
            >
              <Bell size={18} style={{ color: '#F5C842' }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Ativar notificações?</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                Receba alertas de hábitos, conquistas e lembretes
              </p>
            </div>
          </div>

          {/* Rotating example notification preview */}
          <div
            key={exampleIndex}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: `rgba(${example.color === '#FF4D00' ? '255,77,0' : example.color === '#F5C842' ? '245,200,66' : '124,58,237'},0.07)`,
              border: `1px solid rgba(${example.color === '#FF4D00' ? '255,77,0' : example.color === '#F5C842' ? '245,200,66' : '124,58,237'},0.18)`,
            }}
          >
            <span className="text-base shrink-0">{example.icon}</span>
            <p
              className="text-xs font-medium leading-snug"
              style={{ color: example.color }}
            >
              {example.text}
            </p>
          </div>

          {/* Value props row */}
          <div className="flex items-center gap-3 px-0.5">
            {[
              { icon: Zap, label: '+XP bônus', color: '#F5C842', rgb: '245,200,66' },
              { icon: Flame, label: 'Streak seguro', color: '#FF4D00', rgb: '255,77,0' },
              { icon: Trophy, label: 'Conquistas', color: '#7C3AED', rgb: '124,58,237' },
            ].map(({ icon: Icon, label, color, rgb }) => (
              <div key={label} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color }}>
                <Icon size={10} fill="currentColor" />
                {label}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={subscribe}
              disabled={phase === 'loading'}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(245,200,66,0.85), rgba(255,180,0,0.9))',
                color: '#050914',
                boxShadow: '0 4px 16px rgba(245,200,66,0.25)',
              }}
            >
              {phase === 'loading' ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Ativando…
                </>
              ) : (
                <>
                  <Bell size={13} />
                  Ativar agora
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold text-text-secondary transition-all hover:text-white hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              Depois
            </button>
          </div>

          {/* Never show link */}
          <button
            onClick={handleNever}
            className="w-full text-center text-[10px] text-text-muted hover:text-text-secondary transition-colors flex items-center justify-center gap-1"
          >
            <BellOff size={9} />
            Nunca mostrar isso
          </button>
        </div>
      </div>
    </div>
  )
}
