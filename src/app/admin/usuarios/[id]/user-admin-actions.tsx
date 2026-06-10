'use client'

import { useState } from 'react'
import { UserX, Zap, RefreshCw, AlertTriangle } from 'lucide-react'
import type { AdminSession } from '@/lib/admin'

interface Props {
  userId:             string
  currentSession:     AdminSession
  isSuspended:        boolean
  subscriptionStatus: string
}

export function UserAdminActions({ userId, currentSession, isSuspended, subscriptionStatus }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function callAction(action: string, payload?: Record<string, unknown>) {
    setLoading(action)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      setMessage({ type: 'success', text: data.message ?? 'Ação realizada com sucesso.' })
      setTimeout(() => { window.location.reload() }, 1500)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro' })
    } finally {
      setLoading(null)
    }
  }

  async function grantXP() {
    const xpStr = prompt('Quantidade de XP (negativo para remover):')
    if (!xpStr) return
    const amount = parseInt(xpStr, 10)
    if (isNaN(amount)) return alert('XP inválido')
    const reason = prompt('Motivo (admin):') ?? 'Ajuste manual'
    await callAction('grant_xp', { amount, reason })
  }

  async function suspendUser() {
    const reason = prompt('Motivo da suspensão:')
    if (!reason) return
    const days = prompt('Duração em dias (deixe vazio para permanente):')
    await callAction('suspend', {
      reason,
      days: days ? parseInt(days, 10) : null,
    })
  }

  async function unsuspendUser() {
    if (!confirm('Levantar a suspensão deste usuário?')) return
    await callAction('unsuspend')
  }

  async function resetStreak() {
    if (!confirm('Resetar o streak deste usuário para 0?')) return
    await callAction('reset_streak')
  }

  const isAdmin    = currentSession.role === 'super_admin' || currentSession.role === 'admin'
  const isMod      = isAdmin || currentSession.role === 'moderator'
  const isSupport  = isMod || currentSession.role === 'support'

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {message && (
        <div
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: message.type === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,0,0.1)',
            color:      message.type === 'success' ? '#00FF88' : '#FF4D00',
            border:     `1px solid ${message.type === 'success' ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,0,0.2)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isSupport && (
          <button
            onClick={grantXP}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(245,200,66,0.1)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.2)' }}
          >
            <Zap size={12} />
            {loading === 'grant_xp' ? 'Aguarde...' : 'Ajustar XP'}
          </button>
        )}

        {isMod && !isSuspended && (
          <button
            onClick={suspendUser}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(255,77,0,0.1)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.2)' }}
          >
            <UserX size={12} />
            {loading === 'suspend' ? 'Aguarde...' : 'Suspender'}
          </button>
        )}

        {isMod && isSuspended && (
          <button
            onClick={unsuspendUser}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}
          >
            <RefreshCw size={12} />
            {loading === 'unsuspend' ? 'Aguarde...' : 'Levantar Suspensão'}
          </button>
        )}

        {isAdmin && (
          <button
            onClick={resetStreak}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#8899BB', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <AlertTriangle size={12} />
            {loading === 'reset_streak' ? 'Aguarde...' : 'Reset Streak'}
          </button>
        )}
      </div>
    </div>
  )
}
