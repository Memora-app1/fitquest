'use client'

/**
 * Recovery Mode Widget — ativa/desativa o Modo Silêncio.
 * Protege o streak por 7 dias. Disponível 1x por mês.
 */

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

interface Props {
  isActive: boolean
  usedThisMonth: boolean
}

export function RecoveryModeWidget({ isActive: initialActive, usedThisMonth }: Props) {
  const [isActive, setIsActive] = useState(initialActive)
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState<string | null>(null)

  async function toggle() {
    if (loading) return
    setLoading(true)
    setMessage(null)

    try {
      const res  = await fetch('/api/recovery-mode', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: isActive ? 'deactivate' : 'activate' }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; message?: string; xpEarned?: number }

      if (data.ok) {
        setIsActive(!isActive)
        setMessage(data.message ?? null)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage(data.message ?? 'Algo deu errado.')
        setTimeout(() => setMessage(null), 3000)
      }
    } catch {
      setMessage('Erro de conexão. Tente novamente.')
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const disabled = !isActive && usedThisMonth

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(13,24,41,0.98) 100%)'
          : 'rgba(255,255,255,0.025)',
        border: isActive
          ? '1px solid rgba(124,58,237,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {isActive && (
        <div
          className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(124,58,237,0.15)' }}
        />
      )}

      <div className="relative z-10 flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
            border:     isActive ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {isActive
            ? <Moon size={18} style={{ color: '#7C3AED' }} />
            : <Sun  size={18} className="text-text-muted" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">
            {isActive ? '🌙 Modo Silêncio ativo' : 'Modo Silêncio'}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
            {isActive
              ? 'Seu streak está protegido. Volte quando quiser.'
              : disabled
              ? 'Já usado este mês. Disponível no próximo mês.'
              : 'Protege seu streak por 7 dias sem pressão. 1x por mês.'}
          </p>

          {message && (
            <p
              className="text-[11px] font-bold mt-1.5"
              style={{ color: message.includes('XP') || message.includes('🌟') ? '#00FF88' : '#FF4D00' }}
            >
              {message}
            </p>
          )}
        </div>

        <button
          onClick={toggle}
          disabled={disabled || loading}
          className="shrink-0 text-[10px] font-black px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: disabled
              ? 'rgba(255,255,255,0.04)'
              : isActive
              ? 'rgba(0,255,136,0.12)'
              : 'rgba(124,58,237,0.15)',
            color: disabled
              ? '#556677'
              : isActive
              ? '#00FF88'
              : '#7C3AED',
            border: disabled
              ? '1px solid rgba(255,255,255,0.06)'
              : isActive
              ? '1px solid rgba(0,255,136,0.25)'
              : '1px solid rgba(124,58,237,0.3)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '...' : isActive ? 'Encerrar' : 'Ativar'}
        </button>
      </div>
    </div>
  )
}
