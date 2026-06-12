'use client';

/**
 * NotificationBell — sino com badge de não-lidas.
 * Abre o NotificationDrawer ao clicar.
 * Busca contagem inicial via prop (passada do AppShell server-side).
 */

import { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDrawer } from './notification-drawer';

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);

  const handleRead = useCallback(() => {
    setUnread(0);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-white"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        aria-label="Notificações"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black"
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
  );
}
