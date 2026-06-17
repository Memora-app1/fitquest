'use client';

/**
 * NotificationDrawer — painel deslizante de notificações.
 * Ativado pelo NotificationBell no MobileHeader.
 * Busca via /api/notifications, marca como lidas ao abrir.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Bell,
  Flame,
  Trophy,
  Zap,
  Shield,
  Target,
  CheckCircle,
  Clock,
  ThumbsUp,
  Sparkles,
  Star,
  Gift,
  Award,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  icon: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { color: string; rgb: string; Icon: React.ElementType }> = {
  streak_alert: { color: '#EF4444', rgb: '239,68,68', Icon: Flame },
  achievement: { color: '#F5C842', rgb: '245,200,66', Icon: Trophy },
  xp_milestone: { color: '#F5C842', rgb: '245,200,66', Icon: Zap },
  streak_freeze: { color: '#00D9FF', rgb: '0,217,255', Icon: Shield },
  habit_reminder: { color: '#FF4D00', rgb: '255,77,0', Icon: Target },
  task_reminder: { color: '#7C3AED', rgb: '124,58,237', Icon: CheckCircle },
  coach_insight: { color: '#00FF88', rgb: '0,255,136', Icon: Bell },
  finance_due: { color: '#F5C842', rgb: '245,200,66', Icon: Clock },
  // Social / guild
  guild_cheer: { color: '#9F5AF7', rgb: '124,58,237', Icon: ThumbsUp },
  // Resumos e lembretes
  daily_recap: { color: '#00FF88', rgb: '0,255,136', Icon: Sparkles },
  perfect_day_reminder: { color: '#F5C842', rgb: '245,200,66', Icon: Star },
  goal: { color: '#00FF88', rgb: '0,255,136', Icon: Award },
  finance_goal: { color: '#F5C842', rgb: '245,200,66', Icon: TrendingUp },
  // Recompensas
  daily_login_reward: { color: '#00FF88', rgb: '0,255,136', Icon: Gift },
  loot_box: { color: '#7C3AED', rgb: '124,58,237', Icon: Gift },
  streak_record: { color: '#FF4D00', rgb: '255,77,0', Icon: Flame },
  recovery: { color: '#00D9FF', rgb: '0,217,255', Icon: Shield },
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days === 1) return 'ontem';
  return `${days}d atrás`;
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  initialUnread: number;
  onRead: () => void;
}

export function NotificationDrawer({
  open,
  onClose,
  initialUnread,
  onRead,
}: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState(false);
  useScrollLock(open);

  // Detecta desktop para aplicar o slide correto (direita → esquerda vs baixo → cima)
  const [isDesktop, setIsDesktop] = useState(false);
  const mqRef = useRef<MediaQueryList | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    mqRef.current = mq;
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const fetchAndMark = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: Notification[] };
      setNotifications(data.notifications);

      // Marca todas como lidas se houver não lidas
      const hasUnread = data.notifications.some((n) => !n.read_at);
      if (hasUnread && !marked) {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        setMarked(true);
        onRead();
        // Atualiza localmente
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [marked, onRead]);

  useEffect(() => {
    if (open) {
      setMarked(false);
      fetchAndMark();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{ background: 'rgba(5,9,20,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer — slide de baixo no mobile, slide da direita no desktop */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-96 md:rounded-none md:rounded-l-3xl`}
        style={{
          background: '#0D1829',
          border: '1px solid rgba(255,255,255,0.06)',
          maxHeight: isDesktop ? '100vh' : '85vh',
          transform: open
            ? 'translateX(0) translateY(0)'
            : isDesktop
              ? 'translateX(100%)'
              : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1)',
        }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pb-1 pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-brand-orange" />
            <span className="text-sm font-bold">Notificações</span>
            {initialUnread > 0 && !marked && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-black"
                style={{
                  background: 'rgba(255,77,0,0.2)',
                  color: '#FF4D00',
                  border: '1px solid rgba(255,77,0,0.3)',
                }}
              >
                {initialUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.some((n) => n.read_at) && (
              <button
                onClick={async () => {
                  await fetch('/api/notifications?all=1', { method: 'DELETE' });
                  setNotifications((prev) => prev.filter((n) => !n.read_at));
                }}
                className="hover:bg-white/05 rounded-lg px-2 py-1 text-[10px] text-text-muted transition-colors hover:text-white"
              >
                Limpar lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="hover:bg-white/06 flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{
            maxHeight:
              'calc(100dvh - 72px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          }}
        >
          {loading && notifications.length === 0 ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer h-16 rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Bell size={24} className="text-text-muted" />
              </div>
              <p className="text-sm font-semibold text-text-secondary">Nenhuma notificação</p>
              <p className="mt-1 text-xs text-text-muted">
                Quando você ganhar conquistas ou seu streak estiver em risco, vamos avisar aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? {
                  color: '#8899BB',
                  rgb: '136,153,187',
                  Icon: Bell,
                };
                const Icon = cfg.Icon;
                const isUnread = !n.read_at;

                return (
                  <div
                    key={n.id}
                    className={`relative rounded-xl p-3.5 transition-all ${isUnread ? 'ring-1' : ''}`}
                    style={{
                      background: isUnread
                        ? `linear-gradient(135deg, rgba(${cfg.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`
                        : 'rgba(255,255,255,0.025)',
                      border: isUnread
                        ? `1px solid rgba(${cfg.rgb},0.2)`
                        : '1px solid rgba(255,255,255,0.04)',
                      ...(isUnread
                        ? ({ '--tw-ring-color': `rgba(${cfg.rgb},0.15)` } as React.CSSProperties)
                        : {}),
                    }}
                  >
                    {isUnread && (
                      <div
                        className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: `rgba(${cfg.rgb},0.12)`,
                          border: `1px solid rgba(${cfg.rgb},0.2)`,
                        }}
                      >
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">{n.title}</p>
                          <span className="shrink-0 text-[10px] text-text-muted">
                            {formatRelative(n.created_at)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                            {n.body}
                          </p>
                        )}
                        {n.action_url && (
                          <Link
                            href={n.action_url}
                            onClick={onClose}
                            className="mt-1.5 inline-block text-[11px] font-bold transition-colors hover:opacity-80"
                            style={{ color: cfg.color }}
                          >
                            Ver →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
