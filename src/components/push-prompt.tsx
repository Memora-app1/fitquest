'use client'

import { useEffect, useState } from 'react'

export function PushPrompt() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'default') return
    // Mostrar após 30s na primeira visita
    const timer = setTimeout(() => setShow(true), 30_000)
    return () => clearTimeout(timer)
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      const json = sub.toJSON()
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      })

      setShow(false)
    } catch {
      setShow(false)
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
      <div
        className="p-4 flex gap-4 items-start animate-slide-up rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(245,200,66,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(245,200,66,0.15)' }} />
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Ativar notificações?</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Receba lembretes de hábitos e conquistas desbloqueadas.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={subscribe}
              disabled={loading}
              className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
            >
              {loading ? 'Ativando…' : 'Ativar'}
            </button>
            <button
              onClick={() => setShow(false)}
              className="btn-ghost text-xs py-1.5 px-3"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
