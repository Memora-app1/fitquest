'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  Flame,
  Trophy,
  Zap,
  Shield,
  Target,
  CheckCircle,
  Clock,
  ChevronRight,
  Smartphone,
  RefreshCw,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

interface Props {
  notifications: Notification[];
  pushEnabled: boolean;
  deviceCount: number;
}

const TYPE_CONFIG: Record<
  string,
  { color: string; bg: string; Icon: React.ElementType; label: string }
> = {
  streak_alert: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    Icon: Flame,
    label: 'Alerta de Streak',
  },
  achievement: { color: '#F5C842', bg: 'rgba(245,200,66,0.12)', Icon: Trophy, label: 'Conquista' },
  xp_milestone: { color: '#F5C842', bg: 'rgba(245,200,66,0.12)', Icon: Zap, label: 'Marco de XP' },
  streak_freeze: {
    color: '#00D9FF',
    bg: 'rgba(0,217,255,0.12)',
    Icon: Shield,
    label: 'Streak Freeze',
  },
  habit_reminder: {
    color: '#FF4D00',
    bg: 'rgba(255,77,0,0.12)',
    Icon: Target,
    label: 'Lembrete de Hábito',
  },
  task_reminder: {
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.12)',
    Icon: CheckCircle,
    label: 'Lembrete de Tarefa',
  },
  coach_insight: {
    color: '#00FF88',
    bg: 'rgba(0,255,136,0.12)',
    Icon: Bell,
    label: 'Insight do Coach',
  },
  finance_due: {
    color: '#F5C842',
    bg: 'rgba(245,200,66,0.12)',
    Icon: Clock,
    label: 'Conta a Pagar',
  },
  daily_recap: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', Icon: Zap, label: 'Resumo Diário' },
};

const NOTIFICATION_TYPES = [
  {
    key: 'habit_reminder',
    label: 'Lembretes de Hábitos',
    desc: 'Aviso quando um hábito está pendente',
    icon: Target,
    color: '#FF4D00',
  },
  {
    key: 'streak_alert',
    label: 'Alerta de Streak',
    desc: 'Quando sua sequência está em risco',
    icon: Flame,
    color: '#EF4444',
  },
  {
    key: 'task_reminder',
    label: 'Lembretes de Tarefas',
    desc: 'Tarefas com prazo próximo',
    icon: CheckCircle,
    color: '#7C3AED',
  },
  {
    key: 'achievement',
    label: 'Conquistas',
    desc: 'Quando você desbloqueia uma conquista',
    icon: Trophy,
    color: '#F5C842',
  },
  {
    key: 'daily_recap',
    label: 'Resumo Diário',
    desc: 'Resumo das suas atividades às 21h',
    icon: Zap,
    color: '#7C3AED',
  },
  {
    key: 'coach_insight',
    label: 'Insights do Coach IA',
    desc: 'Sugestões personalizadas do seu coach',
    icon: Bell,
    color: '#00FF88',
  },
  {
    key: 'finance_due',
    label: 'Contas a Pagar',
    desc: 'Lembrete de parcelas e contas pendentes',
    icon: Clock,
    color: '#F5C842',
  },
];

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

export function NotificacoesClient({
  notifications: initial,
  pushEnabled: initialPushEnabled,
  deviceCount,
}: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [pushLoading, setPushLoading] = useState(false);
  const [readAll, setReadAll] = useState(false);
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox');

  const unreadCount = notifications.filter((n) => !n.read_at && !readAll).length;

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      alert('Seu browser não suporta notificações push.');
      return;
    }
    setPushLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setPushLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const j = sub.toJSON();
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: j.keys }),
      });
      setPushEnabled(true);
    } finally {
      setPushLoading(false);
    }
  }

  async function disablePush() {
    if (!confirm('Desativar notificações push?')) return;
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushEnabled(false);
    } finally {
      setPushLoading(false);
    }
  }

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
    setReadAll(true);
  }, []);

  const unread = notifications.filter((n) => !n.read_at && !readAll);
  const read = notifications.filter((n) => n.read_at || readAll);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="heading-display gradient-text text-3xl">Notificações</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-text-muted">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-white"
          >
            <CheckCheck size={14} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(['inbox', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
              tab === t ? 'bg-brand-orange text-white' : 'text-text-muted hover:text-white'
            )}
          >
            {t === 'inbox'
              ? `Caixa de Entrada${unreadCount > 0 ? ` (${unreadCount})` : ''}`
              : 'Preferências'}
          </button>
        ))}
      </div>

      {/* INBOX TAB */}
      {tab === 'inbox' && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="space-y-3 py-16 text-center">
              <Bell size={40} className="mx-auto text-text-muted opacity-30" />
              <p className="text-sm text-text-muted">Nenhuma notificação ainda</p>
              <p className="text-xs text-text-muted">
                Ative as notificações push para não perder nenhum alerta
              </p>
            </div>
          ) : (
            <>
              {/* Unread */}
              {unread.length > 0 && (
                <div className="space-y-1.5">
                  <div className="px-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Não lidas
                  </div>
                  {unread.map((n) => (
                    <NotifCard key={n.id} n={n} />
                  ))}
                </div>
              )}
              {/* Read */}
              {read.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="px-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Anteriores
                  </div>
                  {read.map((n) => (
                    <NotifCard key={n.id} n={n} dimmed />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div className="space-y-4">
          {/* Push status card */}
          <div
            className="space-y-3 rounded-2xl p-5"
            style={{
              background: pushEnabled ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.03)',
              border: pushEnabled
                ? '1px solid rgba(0,255,136,0.2)'
                : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: pushEnabled ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.06)',
                    border: pushEnabled
                      ? '1px solid rgba(0,255,136,0.25)'
                      : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {pushEnabled ? (
                    <Bell size={18} className="text-brand-green" />
                  ) : (
                    <BellOff size={18} className="text-text-muted" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Notificações Push</div>
                  <div className="mt-0.5 text-xs text-text-muted">
                    {pushEnabled
                      ? `Ativas em ${deviceCount} dispositivo${deviceCount !== 1 ? 's' : ''}`
                      : 'Desativadas — ative para receber alertas em tempo real'}
                  </div>
                </div>
              </div>
              <button
                onClick={pushEnabled ? disablePush : enablePush}
                disabled={pushLoading}
                className={cn(
                  'shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50',
                  pushEnabled
                    ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                    : 'bg-brand-orange text-white'
                )}
              >
                {pushLoading ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : pushEnabled ? (
                  'Desativar'
                ) : (
                  'Ativar'
                )}
              </button>
            </div>

            {pushEnabled && (
              <div className="flex items-center gap-2 text-xs text-brand-green">
                <Smartphone size={11} />
                <span>Você receberá alertas mesmo com o app fechado</span>
              </div>
            )}
          </div>

          {/* Notification types */}
          <div className="space-y-2">
            <div className="px-1 text-xs font-bold uppercase tracking-widest text-text-muted">
              Tipos de Notificação
            </div>
            {NOTIFICATION_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.key}
                  className="flex items-center gap-3 rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${type.color}18`, border: `1px solid ${type.color}30` }}
                  >
                    <Icon size={16} style={{ color: type.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{type.label}</div>
                    <div className="text-xs text-text-muted">{type.desc}</div>
                  </div>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: pushEnabled ? '#00FF88' : 'rgba(255,255,255,0.15)' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Note */}
          <p className="px-4 text-center text-xs text-text-muted">
            Os horários de notificação são configurados automaticamente com base nos seus hábitos e
            atividades.
          </p>
        </div>
      )}
    </div>
  );
}

function NotifCard({ n, dimmed = false }: { n: Notification; dimmed?: boolean }) {
  const cfg = TYPE_CONFIG[n.type] ?? {
    color: '#8899BB',
    bg: 'rgba(255,255,255,0.05)',
    Icon: Bell,
    label: n.type,
  };
  const Icon = cfg.Icon;
  const isNew = !n.read_at;

  return (
    <Link
      href={n.action_url ?? '#'}
      className={cn(
        'flex items-start gap-3 rounded-xl p-3.5 transition-all active:scale-[0.99]',
        dimmed ? 'opacity-60' : ''
      )}
      style={{
        background: isNew ? cfg.bg : 'rgba(255,255,255,0.025)',
        border: isNew ? `1px solid ${cfg.color}30` : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
      >
        <span className="text-base leading-none">{n.icon ?? '🔔'}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-sm font-semibold leading-tight',
            isNew ? 'text-white' : 'text-text-secondary'
          )}
        >
          {n.title}
        </div>
        {n.body && <div className="mt-0.5 text-xs leading-relaxed text-text-muted">{n.body}</div>}
        <div className="mt-1 text-[10px] text-text-muted">{formatRelative(n.created_at)}</div>
      </div>

      {isNew && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: cfg.color }} />
      )}
    </Link>
  );
}
