'use client'

/**
 * NotificationBell — sino com badge de não-lidas.
 * Abre o NotificationDrawer ao clicar.
 * Busca contagem inicial via prop (passada do AppShell server-side).
 */

import { useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { NotificationDrawer } from './notification-drawer'

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)

  const handleRead = useCallback(() => {
    setUnread(0)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        aria-label="Notificações"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black px-1"
            style={{
              background: '#FF4D00',
              color: '#fff',
              border: '1.5px solid #050914',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <NotificationDrawer
        open={open}
        onClose={() => setOpen(false)}
        initialUnread={unread}
        onRead={handleRead}
      />
    </>
  )
}
