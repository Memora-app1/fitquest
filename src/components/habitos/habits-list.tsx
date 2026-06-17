'use client';

import { useState, useTransition, useOptimistic, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  Check,
  Plus,
  X,
  Trash2,
  MoreVertical,
  Pencil,
  Flame,
  Zap,
  Bell,
  Sparkles,
  Target,
} from 'lucide-react';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';
import { HabitPacksModal } from './habit-packs';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  xp_per_completion: number;
  frequency_per_week: number;
  reminder_time?: string | null;
}

interface HabitLog {
  habit_id: string;
  logged_date: string;
}

const ICONS = ['💪', '🏃', '🧘', '💧', '📖', '🍎', '😴', '🎯', '⚡', '🔥', '✨', '🧠'];
const COLORS = ['#FF4D00', '#7C3AED', '#00FF88', '#F5C842', '#3B82F6', '#EC4899'];

export function HabitsList({
  habits: initialHabits,
  loggedToday,
  weekLogs,
  initialShowCreate = false,
}: {
  habits: Habit[];
  loggedToday: Set<string>;
  weekLogs: HabitLog[];
  initialShowCreate?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [showCreate, setShowCreate] = useState(initialShowCreate);
  const [showPacks, setShowPacks] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toasts, showXp } = useXpToast();

  // Pre-computa Map<habitId, Set<dateString>> uma vez — O(N) vs O(N × M) anterior.
  // Sem isso, cada getLast30Days() e getCurrentStreak() filtrava weekLogs inteiro por hábito.
  const logsByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const log of weekLogs) {
      if (!map.has(log.habit_id)) map.set(log.habit_id, new Set());
      map.get(log.habit_id)!.add(log.logged_date);
    }
    return map;
  }, [weekLogs]);

  // Array de strings dos últimos 30 dias, calculado uma única vez por render.
  const last30Dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      return d.toISOString().split('T')[0]!;
    });
  }, []);

  // React 19 useOptimistic — atualiza a UI instantaneamente antes da resposta do servidor.
  // Se o fetch falhar, o estado base (loggedToday) prevalece e o optimistic é revertido automaticamente.
  const [optimistic, addOptimistic] = useOptimistic(
    loggedToday,
    (current: Set<string>, habitId: string) => {
      const next = new Set(current);
      next.add(habitId);
      return next;
    }
  );

  function toggle(id: string) {
    if (optimistic.has(id)) return;
    if (navigator.vibrate) navigator.vibrate([15, 5, 30]);

    startTransition(async () => {
      // Atualiza UI antes do servidor responder
      addOptimistic(id);

      const res = await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId: id }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          xpEarned?: number;
          perfectDay?: boolean;
          leveledUp?: boolean;
          newLevel?: number;
          criticalHit?: boolean;
          achievementsUnlocked?: string[];
        };
        if (data.criticalHit) {
          if (navigator.vibrate) navigator.vibrate([15, 8, 30, 8, 60, 15, 100]);
        }
        showXp(data.xpEarned ?? 0, {
          perfectDay: data.perfectDay,
          leveledUp: data.leveledUp ? data.newLevel : undefined,
          criticalHit: data.criticalHit,
        });
        if (data.perfectDay) {
          if (navigator.vibrate) navigator.vibrate([40, 20, 80, 20, 120]);
          window.dispatchEvent(new CustomEvent('ascendia:perfect-day'));
        }
        if (data.leveledUp && data.newLevel) {
          window.dispatchEvent(
            new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } })
          );
        }
        for (const slug of data.achievementsUnlocked ?? []) {
          window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }));
        }
        router.refresh();
      }
      // Se falhar, useOptimistic reverte automaticamente para loggedToday
    });
  }

  function requestDeleteHabit(id: string) {
    setOpenMenu(null);
    setConfirmDeleteId(id);
  }

  async function confirmDelete() {
    const id = confirmDeleteId;
    if (!id) return;
    setConfirmDeleteId(null);
    setDeletingId(id);
    const res = await fetch(`/api/habits?id=${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
    }
  }

  function getLast30Days(habitId: string): boolean[] {
    const loggedDates = logsByHabit.get(habitId) ?? new Set<string>();
    return last30Dates.map((d) => loggedDates.has(d));
  }

  function getCurrentStreak(habitId: string): number {
    const loggedDates = logsByHabit.get(habitId) ?? new Set<string>();
    const today = new Date();
    let streak = 0;
    while (streak <= 30) {
      const d = new Date(today);
      d.setDate(today.getDate() - streak);
      if (!loggedDates.has(d.toISOString().split('T')[0]!)) break;
      streak++;
    }
    return streak;
  }

  if (habits.length === 0) {
    return (
      <>
        <div
          className="relative overflow-hidden rounded-2xl p-8 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
            style={{ background: 'rgba(124,58,237,0.2)' }}
          />
          <div className="relative z-10">
            <div className="mb-3 text-5xl">🎯</div>
            <h3 className="mb-1 text-xl font-bold">Nenhum hábito ainda</h3>
            <p className="mb-4 text-text-secondary">
              Crie seu primeiro hábito pra começar a ganhar XP
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowPacks(true)}
                className="btn-ghost flex items-center gap-2"
              >
                <Sparkles size={16} className="text-brand-purple" /> Usar um pacote
              </button>
              <button type="button" onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={18} className="mr-1 inline" /> Criar do zero
              </button>
            </div>
          </div>
        </div>
        {showCreate && (
          <CreateHabitModal
            onClose={() => setShowCreate(false)}
            onCreated={(h) => setHabits((prev) => [...prev, h])}
          />
        )}
        {showPacks && (
          <HabitPacksModal
            onClose={() => setShowPacks(false)}
            onCreated={() => setShowPacks(false)}
          />
        )}
      </>
    );
  }

  // Progresso do dia: quantos hábitos já foram feitos vs total ativo
  const doneCount = habits.filter((h) => optimistic.has(h.id)).length;
  const totalCount = habits.length;
  const remaining = totalCount - doneCount;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = doneCount === totalCount && totalCount > 0;

  return (
    <>
      <XpToastContainer toasts={toasts} />

      {/* Banner de Progresso — Dia Perfeito (maior gatilho de retenção segundo pesquisa 2026) */}
      {totalCount > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: allDone
              ? 'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(13,24,41,0.98) 100%)'
              : 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
            border: allDone
              ? '1px solid rgba(0,255,136,0.3)'
              : remaining === 1
                ? '1px solid rgba(255,77,0,0.4)'
                : '1px solid rgba(245,200,66,0.2)',
            boxShadow: remaining === 1 && !allDone ? '0 0 20px rgba(255,77,0,0.1)' : 'none',
          }}
        >
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: allDone ? '#00FF88' : '#F5C842' }} />
              <span
                className="text-xs font-bold"
                style={{ color: allDone ? '#00FF88' : '#F5C842' }}
              >
                {allDone
                  ? '🎉 Dia Perfeito!'
                  : remaining === 1
                    ? '⚡ Falta 1 hábito para +200 XP!'
                    : `${doneCount}/${totalCount} hábitos hoje`}
              </span>
            </div>
            <span className="text-xs font-black" style={{ color: allDone ? '#00FF88' : '#8899BB' }}>
              {allDone ? '+200 XP ✓' : `${progressPct}%`}
            </span>
          </div>

          {/* Barra de progresso */}
          <div
            className="h-1.5 overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: allDone
                  ? '#00FF88'
                  : remaining === 1
                    ? 'linear-gradient(90deg, #F5C842, #FF4D00)'
                    : 'linear-gradient(90deg, #F5C842, #7C3AED)',
                boxShadow: allDone ? '0 0 8px rgba(0,255,136,0.6)' : 'none',
              }}
            />
          </div>

          {!allDone && remaining <= 2 && (
            <p className="mt-1.5 text-[11px] text-text-muted">
              {remaining === 1
                ? 'Complete o último hábito e garanta +200 XP de Dia Perfeito!'
                : `Faltam ${remaining} hábitos — você está quase lá!`}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowPacks(true)}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <Sparkles size={16} className="text-brand-purple" />
          Pacotes
        </button>
        <button type="button" onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo hábito
        </button>
      </div>

      <div className="space-y-3">
        {habits.map((h) => {
          const done = optimistic.has(h.id);
          const last30 = getLast30Days(h.id);
          const total30 = last30.filter(Boolean).length;
          const currentStreak = getCurrentStreak(h.id);
          const isDeleting = deletingId === h.id;
          const pct30 = Math.round((total30 / 30) * 100);

          return (
            <div
              key={h.id}
              className={cn(
                'relative overflow-hidden rounded-2xl p-5 transition-all',
                done && 'opacity-90',
                isDeleting && 'opacity-40'
              )}
              style={{
                background: done
                  ? `linear-gradient(135deg, ${h.color}10 0%, rgba(13,24,41,0.98) 100%)`
                  : 'rgba(13,24,41,0.8)',
                border: `1px solid ${done ? h.color + '40' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: done ? `0 0 20px ${h.color}15` : 'none',
              }}
            >
              {/* Color glow top-right */}
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl transition-opacity"
                style={{ backgroundColor: h.color, opacity: done ? 0.15 : 0.06 }}
              />

              <div className="relative z-10">
                {/* Top row: icon + name + actions */}
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-all"
                    style={{
                      backgroundColor: done ? `${h.color}25` : `${h.color}15`,
                      border: `1px solid ${h.color}30`,
                    }}
                  >
                    {h.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-bold">
                      {h.name}
                      {done && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: `${h.color}20`, color: h.color }}
                        >
                          ✓ Feito hoje
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                      <span>{h.frequency_per_week}x/semana</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-brand-gold">
                        <Zap size={10} fill="currentColor" />+{h.xp_per_completion} XP
                      </span>
                      <span>·</span>
                      <span className="text-[10px] font-semibold">
                        {h.xp_per_completion >= 100
                          ? '🔴 Difícil'
                          : h.xp_per_completion >= 75
                            ? '🟡 Médio'
                            : '🟢 Fácil'}
                      </span>
                      {currentStreak > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-brand-orange">
                            <Flame size={10} />
                            {currentStreak} dias
                          </span>
                        </>
                      )}
                      {h.reminder_time && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5" style={{ color: '#00D9FF' }}>
                            <Bell size={9} />
                            {h.reminder_time.slice(0, 5)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => toggle(h.id)}
                      disabled={done || isDeleting}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all',
                        done ? 'cursor-default' : 'hover:opacity-90 active:scale-95'
                      )}
                      style={
                        done
                          ? { background: `${h.color}20`, color: h.color }
                          : { background: h.color, color: '#050914' }
                      }
                    >
                      {done ? (
                        <>
                          <Check size={14} /> Feito
                        </>
                      ) : (
                        '+ Registrar'
                      )}
                    </button>

                    {/* More menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === h.id ? null : h.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated text-text-muted transition-colors active:bg-border active:text-white"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenu === h.id && (
                        <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-border bg-bg-card shadow-xl">
                          <button
                            onClick={() => {
                              setEditHabit(h);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-bg-elevated"
                          >
                            <Pencil size={14} className="text-brand-orange" />
                            Editar
                          </button>
                          <button
                            onClick={() => requestDeleteHabit(h.id)}
                            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-brand-red transition-colors hover:bg-brand-red/10"
                          >
                            <Trash2 size={14} />
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contribution graph + stats */}
                <div className="space-y-1.5">
                  <div className="flex gap-0.5">
                    {last30.map((d, i) => (
                      <div
                        key={i}
                        className="h-3 flex-1 rounded-sm transition-all"
                        style={{
                          backgroundColor: d ? h.color : '#152238',
                          opacity: d ? (i > 24 ? 1 : i > 14 ? 0.85 : 0.7) : 1,
                        }}
                        title={d ? 'Feito' : 'Não feito'}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>30 dias atrás</span>
                    <div className="flex items-center gap-3">
                      <span>
                        <span style={{ color: h.color }} className="font-bold">
                          {total30}
                        </span>
                        /30 dias ·{' '}
                        <span
                          className="font-semibold"
                          style={{
                            color: pct30 >= 80 ? '#00FF88' : pct30 >= 50 ? '#F5C842' : '#FF4D00',
                          }}
                        >
                          {pct30}%
                        </span>
                      </span>
                    </div>
                    <span>Hoje</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backdrop para fechar menus */}
      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}

      {showCreate && (
        <CreateHabitModal
          onClose={() => setShowCreate(false)}
          onCreated={(h) => setHabits((prev) => [...prev, h])}
        />
      )}

      {editHabit && (
        <EditHabitModal
          habit={editHabit}
          onClose={() => setEditHabit(null)}
          onSaved={(updated) => {
            setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
            setEditHabit(null);
          }}
        />
      )}

      {showPacks && (
        <HabitPacksModal
          onClose={() => setShowPacks(false)}
          onCreated={() => setShowPacks(false)}
        />
      )}

      {/* Confirmação de exclusão — inline, sem confirm() nativo */}
      {confirmDeleteId && (
        <>
          <div
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(5,9,20,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setConfirmDeleteId(null)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[90] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
            style={{
              background: '#0D1829',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              animation: 'bounceIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <Trash2 size={22} style={{ color: '#EF4444' }} />
            </div>
            <h3 className="mb-1 text-center text-base font-black">Remover hábito?</h3>
            <p className="mb-5 text-center text-xs text-text-secondary">
              O histórico de logs será mantido. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-xl py-3 text-sm font-black transition-all active:scale-95"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444',
                }}
              >
                Remover
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Create Modal ───────────────────────────────────────────────────────────

function CreateHabitModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (habit: Habit) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [color, setColor] = useState('#FF4D00');
  const [freq, setFreq] = useState(4);
  const [reminderTime, setReminderTime] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const XP_BY_DIFFICULTY = { easy: 50, medium: 75, hard: 100 };
  useScrollLock(true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name,
        icon,
        color,
        category: 'custom',
        target_type: 'count',
        target_value: freq,
        target_period: 'week',
        target_unit: 'vez',
        frequency_per_week: freq,
        xp_per_completion: XP_BY_DIFFICULTY[difficulty],
        reminder_time: reminderTime ? reminderTime + ':00' : null,
      })
      .select('id, name, icon, color, category, xp_per_completion, frequency_per_week')
      .single();

    if (data) onCreated(data);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center">
      <div
        className="relative w-full max-w-md animate-slide-up space-y-4 overflow-hidden overflow-y-auto rounded-2xl p-6"
        style={{
          maxHeight: '90dvh',
          background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(255,77,0,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(255,77,0,0.15)' }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Novo hábito</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-all active:scale-90 active:text-white"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Nome do hábito</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treinar, Beber água, Meditar..."
              className="input w-full"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all',
                    icon === i ? 'scale-110 ring-2' : 'bg-bg-elevated hover:bg-border'
                  )}
                  style={
                    icon === i ? { background: `${color}20`, boxShadow: `0 0 0 2px ${color}` } : {}
                  }
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-10 w-10 rounded-lg transition-all"
                  style={{
                    backgroundColor: c,
                    boxShadow:
                      color === c ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 12px ${c}60` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">
              Frequência:{' '}
              <span className="font-bold text-white">
                {freq === 7 ? 'Todo dia' : `${freq}x/semana`}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full accent-brand-orange"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span>1x/sem</span>
              <span>Todo dia</span>
            </div>
          </div>

          {/* Reminder time (optional) */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Lembrete (opcional)</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input flex-1"
                style={{ colorScheme: 'dark' }}
              />
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="text-xs text-text-muted transition-colors hover:text-white"
                >
                  Remover
                </button>
              )}
            </div>
            {reminderTime && (
              <p className="mt-1 text-[11px] text-text-muted">
                🔔 Push às {reminderTime} se não logado ainda
              </p>
            )}
          </div>

          {/* Dificuldade */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">
              Dificuldade
              <span className="ml-2 text-xs text-text-muted">(define o XP ganho)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'easy', label: 'Fácil', emoji: '🟢', xp: 50, color: '#00FF88' },
                  { key: 'medium', label: 'Médio', emoji: '🟡', xp: 75, color: '#F5C842' },
                  { key: 'hard', label: 'Difícil', emoji: '🔴', xp: 100, color: '#FF4D00' },
                ] as const
              ).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDifficulty(d.key)}
                  className="flex flex-col items-center gap-0.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                  style={
                    difficulty === d.key
                      ? {
                          background: `${d.color}20`,
                          border: `1.5px solid ${d.color}`,
                          color: d.color,
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#8899BB',
                        }
                  }
                >
                  <span>
                    {d.emoji} {d.label}
                  </span>
                  <span className="text-[10px] font-bold opacity-75">+{d.xp} XP</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || !name} className="btn-primary w-full">
            {loading ? 'Criando...' : '+ Criar hábito'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

interface HabitWithReminder extends Habit {
  reminder_time?: string | null;
}

function EditHabitModal({
  habit,
  onClose,
  onSaved,
}: {
  habit: HabitWithReminder;
  onClose: () => void;
  onSaved: (habit: HabitWithReminder) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(habit.name);
  const [icon, setIcon] = useState(habit.icon);
  const [color, setColor] = useState(habit.color);
  const [freq, setFreq] = useState(habit.frequency_per_week);
  // Converte 'HH:MM:00' → 'HH:MM' para o input type="time"
  const [reminderTime, setReminderTime] = useState(
    habit.reminder_time ? habit.reminder_time.slice(0, 5) : ''
  );
  useScrollLock(true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/habits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: habit.id,
        name,
        icon,
        color,
        frequency_per_week: freq,
        reminder_time: reminderTime || null,
      }),
    });

    setLoading(false);
    if (res.ok) {
      onSaved({
        ...habit,
        name,
        icon,
        color,
        frequency_per_week: freq,
        reminder_time: reminderTime || null,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center">
      <div
        className="relative w-full max-w-md animate-slide-up space-y-4 overflow-hidden overflow-y-auto rounded-2xl p-6"
        style={{
          maxHeight: '90dvh',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(124,58,237,0.15)' }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Editar hábito</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-all active:scale-90 active:text-white"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Nome do hábito</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all',
                    icon === i ? 'scale-110' : 'bg-bg-elevated hover:bg-border'
                  )}
                  style={
                    icon === i ? { background: `${color}20`, boxShadow: `0 0 0 2px ${color}` } : {}
                  }
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-10 w-10 rounded-lg transition-all"
                  style={{
                    backgroundColor: c,
                    boxShadow:
                      color === c ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 12px ${c}60` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">
              Frequência:{' '}
              <span className="font-bold text-white">
                {freq === 7 ? 'Todo dia' : `${freq}x/semana`}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full accent-brand-orange"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span>1x/sem</span>
              <span>Todo dia</span>
            </div>
          </div>

          {/* Reminder time (optional) */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Lembrete (opcional)</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input flex-1"
                style={{ colorScheme: 'dark' }}
              />
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="text-xs text-text-muted transition-colors hover:text-white"
                >
                  Remover
                </button>
              )}
            </div>
            {reminderTime && (
              <p className="mt-1 text-[11px] text-text-muted">
                🔔 Push às {reminderTime} se não logado ainda
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
