'use client'

/**
 * NotificationDrawer — painel deslizante de notificações.
 * Ativado pelo NotificationBell no MobileHeader.
 * Busca via /api/notifications, marca como lidas ao abrir.
 */

import { useState, useEffect, useCallback } from 'react'
import { X, Bell, Flame, Trophy, Zap, Shield, Target, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  icon: string | null
  action_url: string | null
  read_at: string | null
  created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; rgb: string; Icon: React.ElementType }> = {
  streak_alert:    { color: '#EF4444', rgb: '239,68,68',  Icon: Flame },
  achievement:     { color: '#F5C842', rgb: '245,200,66', Icon: Trophy },
  xp_milestone:    { color: '#F5C842', rgb: '245,200,66', Icon: Zap },
  streak_freeze:   { color: '#00D9FF', rgb: '0,217,255',  Icon: Shield },
  habit_reminder:  { color: '#FF4D00', rgb: '255,77,0',   Icon: Target },
  task_reminder:   { color: '#7C3AED', rgb: '124,58,237', Icon: CheckCircle },
  coach_insight:   { color: '#00FF88', rgb: '0,255,136',  Icon: Bell },
  finance_due:     { color: '#F5C842', rgb: '245,200,66', Icon: Clock },
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days === 1) return 'ontem'
  return `${days}d atrás`
}

interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
  initialUnread: number
  onRead: () => void
}

export function NotificationDrawer({ open, onClose, initialUnread, onRead }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [marked, setMarked] = useState(false)

  const fetchAndMark = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json() as { notifications: Notification[] }
      setNotifications(data.notifications)

      // Marca todas como lidas se houver não lidas
      const hasUnread = data.notifications.some((n) => !n.read_at)
      if (hasUnread && !marked) {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        setMarked(true)
        onRead()
        // Atualiza localmente
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
      }
    } finally {
      setLoading(false)
    }
  }, [marked, onRead])

  useEffect(() => {
    if (open) {
      setMarked(false)
      fetchAndMark()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(5,9,20,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer — slides up from bottom on mobile, slides in from right on desktop */}
      <div
        className={`fixed z-[70] transition-transform duration-300 ease-out
          bottom-0 left-0 right-0 rounded-t-3xl
          md:bottom-auto md:top-0 md:right-0 md:left-auto md:w-96 md:h-full md:rounded-none md:rounded-l-3xl
        `}
        style={{
          background: '#0D1829',
          border: '1px solid rgba(255,255,255,0.06)',
          transform: open ? 'translateY(0) translateX(0)' : 'translateY(100%) translateX(0)',
          maxHeight: '85vh',
        }}
      >
        {/* Handle bar (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-brand-orange" />
            <span className="font-bold text-sm">Notificações</span>
            {initialUnread > 0 && !marked && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,77,0,0.2)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.3)' }}
              >
                {initialUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.some(n => n.read_at) && (
              <button
                onClick={async () => {
                  await fetch('/api/notifications?all=1', { method: 'DELETE' })
                  setNotifications(prev => prev.filter(n => !n.read_at))
                }}
                className="text-[10px] text-text-muted hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/05"
              >
                Limpar lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/06 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 72px)' }}>
          {loading && notifications.length === 0 ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Bell size={24} className="text-text-muted" />
              </div>
              <p className="font-semibold text-text-secondary text-sm">Nenhuma notificação</p>
              <p className="text-xs text-text-muted mt-1">
                Quando você ganhar conquistas ou seu streak estiver em risco, vamos avisar aqui.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? { color: '#8899BB', rgb: '136,153,187', Icon: Bell }
                const Icon = cfg.Icon
                const isUnread = !n.read_at

                return (
                  <div
                    key={n.id}
                    className={`rounded-xl p-3.5 transition-all relative ${isUnread ? 'ring-1' : ''}`}
                    style={{
                      background: isUnread
                        ? `linear-gradient(135deg, rgba(${cfg.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`
                        : 'rgba(255,255,255,0.025)',
                      border: isUnread
                        ? `1px solid rgba(${cfg.rgb},0.2)`
                        : '1px solid rgba(255,255,255,0.04)',
                      ...(isUnread ? { '--tw-ring-color': `rgba(${cfg.rgb},0.15)` } as React.CSSProperties : {}),
                    }}
                  >
                    {isUnread && (
                      <div
                        className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: `rgba(${cfg.rgb},0.12)`,
                          border: `1px solid rgba(${cfg.rgb},0.2)`,
                        }}
                      >
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">{n.title}</p>
                          <span className="text-[10px] text-text-muted shrink-0">{formatRelative(n.created_at)}</span>
                        </div>
                        {n.body && (
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{n.body}</p>
                        )}
                        {n.action_url && (
                          <Link
                            href={n.action_url}
                            onClick={onClose}
                            className="text-[11px] font-bold mt-1.5 inline-block transition-colors hover:opacity-80"
                            style={{ color: cfg.color }}
                          >
                            Ver →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
