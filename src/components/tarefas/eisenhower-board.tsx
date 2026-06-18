'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  Check,
  Trash2,
  AlertCircle,
  Star,
  Clock,
  SkipForward,
  ChevronDown,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/supabase/types';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';
import { useScrollLock } from '@/hooks/use-scroll-lock';

const QUADRANTS = [
  {
    id: 'do' as const,
    title: 'FAZER AGORA',
    subtitle: 'Urgente + Importante',
    description: 'Crises, prazos críticos, reuniões emergenciais',
    urgent: true,
    important: true,
    borderColor: 'border-t-brand-red',
    bgColor: 'bg-brand-red/5',
    textColor: 'text-brand-red',
    badgeBg: 'bg-brand-red/15',
    badgeText: 'text-brand-red',
    icon: AlertCircle,
    emoji: '🔴',
  },
  {
    id: 'schedule' as const,
    title: 'AGENDAR',
    subtitle: 'Importante, não urgente',
    description: 'Desenvolvimento pessoal, planejamento, projetos estratégicos',
    urgent: false,
    important: true,
    borderColor: 'border-t-brand-green',
    bgColor: 'bg-brand-green/5',
    textColor: 'text-brand-green',
    badgeBg: 'bg-brand-green/15',
    badgeText: 'text-brand-green',
    icon: Star,
    emoji: '🟢',
  },
  {
    id: 'delegate' as const,
    title: 'DELEGAR',
    subtitle: 'Urgente, não importante',
    description: 'Interrupções, alguns emails, certas reuniões',
    urgent: true,
    important: false,
    borderColor: 'border-t-brand-gold',
    bgColor: 'bg-brand-gold/5',
    textColor: 'text-brand-gold',
    badgeBg: 'bg-brand-gold/15',
    badgeText: 'text-brand-gold',
    icon: Clock,
    emoji: '🟡',
  },
  {
    id: 'eliminate' as const,
    title: 'ELIMINAR',
    subtitle: 'Nem urgente nem importante',
    description: 'Distrações, tarefas irrelevantes, hábitos que não agregam',
    urgent: false,
    important: false,
    borderColor: 'border-t-text-muted',
    bgColor: 'bg-bg-elevated',
    textColor: 'text-text-muted',
    badgeBg: 'bg-white/5',
    badgeText: 'text-text-muted',
    icon: SkipForward,
    emoji: '⚫',
  },
] as const;

type QuadrantId = (typeof QUADRANTS)[number]['id'];

interface EisenhowerTask {
  id: string;
  title: string;
  urgent: boolean;
  important: boolean;
  status: TaskStatus;
  xp_reward: number;
  due_date: string | null;
}

const QUADRANT_RGB: Record<string, string> = {
  do: '239,68,68',
  schedule: '0,255,136',
  delegate: '245,200,66',
  eliminate: '136,153,187',
};

export function EisenhowerBoard({ initialTasks }: { initialTasks: EisenhowerTask[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<EisenhowerTask[]>(initialTasks);
  const [showNew, setShowNew] = useState<QuadrantId | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const { toasts, showXp } = useXpToast();

  function setLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      loading ? next.add(id) : next.delete(id);
      return next;
    });
  }

  const completeTask = useCallback(
    async (task: EisenhowerTask) => {
      if (task.status === 'done' || loadingIds.has(task.id)) return;
      if (navigator.vibrate) navigator.vibrate([10, 5, 25]);
      setLoading(task.id, true);

      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: 'done' } : t)));

      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: 'done' }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          xpEarned?: number;
          leveledUp?: boolean;
          newLevel?: number;
          achievementsUnlocked?: string[];
        };
        if (data.xpEarned)
          showXp(data.xpEarned, { leveledUp: data.leveledUp ? data.newLevel : undefined });
        if (data.leveledUp && data.newLevel) {
          window.dispatchEvent(
            new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } })
          );
        }
        for (const slug of data.achievementsUnlocked ?? []) {
          window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }));
        }
        router.refresh();
      } else {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      }
      setLoading(task.id, false);
    },
    [loadingIds, router, showXp]
  );

  const moveTask = useCallback(
    async (task: EisenhowerTask, quadrant: (typeof QUADRANTS)[number]) => {
      if (loadingIds.has(task.id)) return;
      if (task.urgent === quadrant.urgent && task.important === quadrant.important) return;
      setLoading(task.id, true);

      const updates = { id: task.id, urgent: quadrant.urgent, important: quadrant.important };

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, urgent: quadrant.urgent, important: quadrant.important } : t
        )
      );

      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, urgent: task.urgent, important: task.important } : t
          )
        );
      }
      setLoading(task.id, false);
    },
    [loadingIds]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (loadingIds.has(id)) return;
      setLoading(id, true);
      setTasks((prev) => prev.filter((t) => t.id !== id));

      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      setLoading(id, false);
    },
    [loadingIds]
  );

  const onCreated = useCallback((task: EisenhowerTask) => {
    setTasks((prev) => [...prev, task]);
    setShowNew(null);
  }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'archived');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  function getQuadrantTasks(q: (typeof QUADRANTS)[number]) {
    return activeTasks.filter((t) => t.urgent === q.urgent && t.important === q.important);
  }

  return (
    <div className="space-y-4">
      <XpToastContainer toasts={toasts} />

      {/* Quadrant grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {QUADRANTS.map((q) => {
          const qTasks = getQuadrantTasks(q);
          const Icon = q.icon;
          return (
            <div
              key={q.id}
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                background: `linear-gradient(135deg, rgba(${QUADRANT_RGB[q.id]},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid rgba(${QUADRANT_RGB[q.id]},0.2)`,
                borderTop: `3px solid rgba(${QUADRANT_RGB[q.id]},0.6)`,
              }}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={q.textColor} />
                    <span className={cn('text-base font-bold', q.textColor)}>{q.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{qTasks.length}</span>
                    <button
                      onClick={() => setShowNew(q.id)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full transition-all',
                        'text-text-muted hover:bg-white/10 hover:text-white'
                      )}
                      title="Nova tarefa neste quadrante"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-text-muted">{q.subtitle}</div>
              </div>

              {/* Tasks */}
              <div className="min-h-[80px] space-y-2">
                {qTasks.length === 0 && (
                  <div className="py-6 text-center text-sm text-text-muted opacity-60">
                    {q.description}
                  </div>
                )}
                {qTasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    quadrant={q}
                    allQuadrants={QUADRANTS}
                    isLoading={loadingIds.has(t.id)}
                    onComplete={() => completeTask(t)}
                    onDelete={() => deleteTask(t.id)}
                    onMove={(targetQ) => moveTask(t, targetQ)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Done tasks summary */}
      {doneTasks.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(0,255,136,0.18)',
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Check size={16} className="text-brand-green" />
            <span className="text-sm font-semibold text-brand-green">Concluídas hoje</span>
            <span className="text-xs text-text-muted">({doneTasks.length})</span>
          </div>
          <div className="space-y-1.5">
            {doneTasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm text-text-muted">
                <Check size={12} className="shrink-0 text-brand-green" />
                <span className="line-through">{t.title}</span>
                <span className="ml-auto shrink-0 text-xs font-bold text-brand-gold">
                  +{t.xp_reward} XP
                </span>
              </div>
            ))}
            {doneTasks.length > 5 && (
              <div className="pt-1 text-center text-xs text-text-muted">
                +{doneTasks.length - 5} tarefas concluídas
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tip */}
      <div
        className="rounded-2xl p-4 text-sm text-text-secondary"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(0,255,136,0.2)',
        }}
      >
        💡 <strong className="text-white">Foque no quadrante verde</strong> — Importantes + não
        urgentes são onde você cresce de verdade. O quadrante vermelho é onde você sobrevive.
      </div>

      {/* New task modal */}
      {showNew && (
        <NewTaskModal
          quadrantId={showNew}
          quadrant={QUADRANTS.find((q) => q.id === showNew)!}
          onClose={() => setShowNew(null)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}

function TaskItem({
  task,
  quadrant,
  allQuadrants,
  isLoading,
  onComplete,
  onDelete,
  onMove,
}: {
  task: EisenhowerTask;
  quadrant: (typeof QUADRANTS)[number];
  allQuadrants: typeof QUADRANTS;
  isLoading: boolean;
  onComplete: () => void;
  onDelete: () => void;
  onMove: (q: (typeof QUADRANTS)[number]) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const dueDateDisplay = task.due_date
    ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-bg-card p-3 transition-all',
        isLoading && 'pointer-events-none opacity-50',
        task.status === 'done' && 'opacity-40'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Complete button */}
        <button
          onClick={onComplete}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
            task.status === 'done'
              ? 'border-brand-green bg-brand-green'
              : 'border-border hover:border-brand-green hover:bg-brand-green/20'
          )}
        >
          {task.status === 'done' && <Check size={10} className="text-black" />}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'text-sm font-medium leading-snug',
              task.status === 'done' && 'text-text-muted line-through'
            )}
          >
            {task.title}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {dueDateDisplay && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium',
                  isOverdue ? 'bg-brand-red/20 text-brand-red' : 'bg-white/5 text-text-muted'
                )}
              >
                {isOverdue ? '⚠️' : '📅'} {dueDateDisplay}
              </span>
            )}
            <span className="ml-auto text-xs text-brand-gold">+{task.xp_reward} XP</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-0.5 flex shrink-0 items-center gap-1 self-start opacity-0 transition-opacity group-hover:opacity-100">
          {/* Move menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:text-white"
              title="Mover para outro quadrante"
            >
              <span className="text-[10px] font-bold">⇄</span>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-44 space-y-1 rounded-xl border border-border bg-bg-card p-2 shadow-xl">
                  <div className="mb-1 px-2 text-[10px] uppercase text-text-muted">Mover para</div>
                  {allQuadrants
                    .filter(
                      (q) => q.urgent !== quadrant.urgent || q.important !== quadrant.important
                    )
                    .map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          onMove(q);
                          setShowMenu(false);
                        }}
                        className={cn(
                          'w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-bg-elevated',
                          q.textColor
                        )}
                      >
                        {q.emoji} {q.title}
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:text-brand-red"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <EisenhowerSubtasks taskId={task.id} isDone={task.status === 'done'} />
    </div>
  );
}

// ── Minimal Subtask Panel for Eisenhower ──────────────────────────────────────

interface ESubtask {
  id: string;
  title: string;
  is_completed: boolean;
}

function EisenhowerSubtasks({ taskId, isDone }: { taskId: string; isDone: boolean }) {
  const [open, setOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<ESubtask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    if (loaded) return;
    const res = await fetch(`/api/subtasks?taskId=${taskId}`);
    if (res.ok) {
      const data = (await res.json()) as { subtasks: ESubtask[] };
      setSubtasks(data.subtasks);
    }
    setLoaded(true);
  }

  async function toggle() {
    if (!open) await load();
    setOpen((v) => !v);
  }

  async function toggleItem(s: ESubtask) {
    const completing = !s.is_completed;
    setSubtasks((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, is_completed: completing } : x))
    );
    if (completing && navigator.vibrate) navigator.vibrate([8, 4, 16]);
    const res = await fetch('/api/subtasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_completed: completing }),
    });
    if (res.ok) {
      const data = (await res.json()) as { achievementsUnlocked?: string[] };
      for (const slug of data.achievementsUnlocked ?? []) {
        window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }));
      }
    }
  }

  async function addItem() {
    if (!newTitle.trim()) return;
    const res = await fetch('/api/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, title: newTitle.trim() }),
    });
    if (res.ok) {
      const data = (await res.json()) as { subtask: ESubtask };
      setSubtasks((prev) => [...prev, data.subtask]);
      setNewTitle('');
      setAdding(false);
    }
  }

  const done = subtasks.filter((s) => s.is_completed).length;

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          void toggle();
        }}
        className="flex items-center gap-1.5 text-[10px] text-text-muted transition-colors hover:text-text-secondary"
      >
        <ListChecks size={10} />
        {loaded && subtasks.length > 0 ? `${done}/${subtasks.length} subtarefas` : 'Subtarefas'}
        <ChevronDown size={9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5">
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => void toggleItem(s)}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  s.is_completed
                    ? 'border-brand-green bg-brand-green'
                    : 'border-border hover:border-brand-green/60'
                )}
              >
                {s.is_completed && <Check size={8} className="text-black" />}
              </button>
              <span className={cn('text-xs', s.is_completed && 'text-text-muted line-through')}>
                {s.title}
              </span>
            </div>
          ))}
          {adding ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void addItem();
                  if (e.key === 'Escape') {
                    setAdding(false);
                    setNewTitle('');
                  }
                }}
                placeholder="Subtarefa..."
                className="flex-1 rounded border border-border bg-bg-elevated px-2 py-0.5 text-xs outline-none focus:border-brand-purple"
                maxLength={200}
              />
              <button
                onClick={() => void addItem()}
                className="text-brand-purple transition-colors hover:text-white"
              >
                <Check size={11} />
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewTitle('');
                }}
                aria-label="Cancelar"
                className="text-text-muted transition-colors hover:text-white"
              >
                <X size={11} />
              </button>
            </div>
          ) : !isDone ? (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-brand-purple"
            >
              <Plus size={9} />
              Adicionar
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function NewTaskModal({
  quadrantId,
  quadrant,
  onClose,
  onCreated,
}: {
  quadrantId: QuadrantId;
  quadrant: (typeof QUADRANTS)[number];
  onClose: () => void;
  onCreated: (task: EisenhowerTask) => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  useScrollLock(true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || loading) return;
    setLoading(true);

    const body: Record<string, unknown> = {
      title: title.trim(),
      urgent: quadrant.urgent,
      important: quadrant.important,
      status: 'todo',
    };
    if (dueDate) body.due_date = new Date(dueDate).toISOString();

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as { task: EisenhowerTask };
      onCreated(data.task);
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md space-y-4 overflow-hidden rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, rgba(${QUADRANT_RGB[quadrantId]},0.09) 0%, rgba(13,24,41,0.99) 100%)`,
          border: `1px solid rgba(${QUADRANT_RGB[quadrantId]},0.3)`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: `rgba(${QUADRANT_RGB[quadrantId]},0.15)` }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Nova tarefa</h2>
            <div className={cn('mt-0.5 text-sm', quadrant.textColor)}>
              {quadrant.emoji} {quadrant.title} — {quadrant.subtitle}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-muted transition-colors hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="input w-full"
          />

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-text-muted">
              Prazo (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Quadrant info */}
          <div className={cn('flex items-center gap-2 rounded-xl p-3 text-sm', quadrant.badgeBg)}>
            <span className="text-lg">{quadrant.emoji}</span>
            <div>
              <div className={cn('text-xs font-medium', quadrant.textColor)}>{quadrant.title}</div>
              <div className="text-xs text-text-muted">{quadrant.description}</div>
            </div>
          </div>

          <div className="text-xs text-brand-gold">
            Recompensa: +{quadrant.urgent && quadrant.important ? 50 : 30} XP ao concluir
          </div>

          <button type="submit" disabled={loading || !title.trim()} className="btn-primary w-full">
            {loading ? 'Criando...' : 'Criar tarefa'}
          </button>
        </form>
      </div>
    </div>
  );
}
