'use client'

/**
 * LandingSocialProof — ticker flutuante com notificações de atividade recente.
 * Aparece no canto inferior esquerdo após 3s, troca a cada 4s.
 * Aumenta percepção de produto ativo e confiança social.
 */

import { useState, useEffect } from 'react'

const NOTIFICATIONS = [
  { emoji: '🔥', text: 'Lucas M. chegou ao Nível 5 — Guerreiro', time: 'agora' },
  { emoji: '⚡', text: 'Ana P. ganhou +300 XP com streak de 7 dias', time: '2min' },
  { emoji: '🏆', text: 'Rafael S. desbloqueou "Primeira Semana Perfeita"', time: '5min' },
  { emoji: '💪', text: 'Marina T. bateu PR no supino — +150 XP', time: '7min' },
  { emoji: '🎯', text: 'Pedro L. completou todos os hábitos hoje', time: '9min' },
  { emoji: '💰', text: 'Juliana B. bateu meta financeira — +500 XP', time: '12min' },
  { emoji: '🔥', text: 'Carlos M. tem 30 dias de streak consecutivo', time: '15min' },
  { emoji: '⭐', text: 'Fernanda O. subiu para o Nível 4 — Atleta', time: '18min' },
]

export function LandingSocialProof() {
  const [visible, setVisible] = useState(false)
  const [index, setIndex]     = useState(0)
  const [animIn, setAnimIn]   = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true)
      setAnimIn(true)
    }, 3000)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setAnimIn(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % NOTIFICATIONS.length)
        setAnimIn(true)
      }, 300)
    }, 4500)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  const notif = NOTIFICATIONS[index]!

  return (
    <div
      className="fixed bottom-6 left-4 z-50 max-w-[280px] pointer-events-none md:pointer-events-auto"
      style={{
        opacity:    animIn ? 1 : 0,
        transform:  animIn ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
          background:    'rgba(13,24,41,0.97)',
          border:        '1px solid rgba(255,255,255,0.1)',
          boxShadow:     '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          backdropFilter:'blur(16px)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.2)' }}
        >
          {notif.emoji}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white leading-tight truncate">{notif.text}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{notif.time} atrás</p>
        </div>
      </div>
    </div>
  )
}
