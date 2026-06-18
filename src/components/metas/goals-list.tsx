'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Trash2, CheckCircle2, Pause, ChevronUp, ChevronDown, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
}

const GOAL_ICONS = [
  '🎯',
  '💪',
  '🏃',
  '📚',
  '💰',
  '🏠',
  '✈️',
  '🎓',
  '🧘',
  '🏆',
  '🌱',
  '❤️',
  '⚡',
  '🎮',
  '🎨',
  '🧠',
];
const GOAL_CATEGORIES = [
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'saude', label: '❤️ Saúde' },
  { value: 'financeiro', label: '💰 Financeiro' },
  { value: 'carreira', label: '🎓 Carreira' },
  { value: 'educacao', label: '📚 Educação' },
  { value: 'habitos', label: '🎯 Hábitos' },
  { value: 'pessoal', label: '🌱 Pessoal' },
  { value: 'custom', label: '⚡ Outro' },
];

function calcProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function formatDeadline(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  if (days <= 30) return `${days} dias restantes`;
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export function GoalsList({ initialGoals }: { initialGoals: Goal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [showCreate, setShowCreate] = useState(false);
  const [updateGoal, setUpdateGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const { toasts, showXp } = useXpToast();

  async function handleDelete(id: string) {
    if (!confirm('Remover esta meta?')) return;
    const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
    if (res.ok) setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleComplete(goal: Goal) {
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: goal.id,
        status: 'completed',
        current_value: goal.target_value,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        goal: Goal;
        xpEarned?: number;
        leveledUp?: boolean;
        newLevel?: number;
        achievementsUnlocked?: string[];
      };
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? data.goal : g)));
      if (data.xpEarned) {
        showXp(data.xpEarned, { leveledUp: data.leveledUp ? data.newLevel : undefined });
        if (data.leveledUp && data.newLevel) {
          window.dispatchEvent(
            new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } })
          );
        }
        for (const slug of data.achievementsUnlocked ?? []) {
          window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }));
        }
      }
      router.refresh();
    }
  }

  async function handleTogglePause(goal: Goal) {
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, status: newStatus }),
    });
    if (res.ok) {
      const data = (await res.json()) as { goal: Goal };
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? data.goal : g)));
    }
  }

  const filtered = goals.filter((g) => {
    if (filter === 'active') return g.status === 'active' || g.status === 'paused';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  const activeCount = goals.filter((g) => g.status === 'active').length;
  const completedCount = goals.filter((g) => g.status === 'completed').length;

  return (
    <>
      <XpToastContainer toasts={toasts} />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-brand-orange text-white'
                  : 'bg-bg-elevated text-text-secondary hover:text-white'
              )}
            >
              {f === 'active' && `Ativas (${activeCount})`}
              {f === 'completed' && `Concluídas (${completedCount})`}
              {f === 'all' && 'Todas'}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} className="mr-1 inline" /> Nova meta
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          className="relative overflow-hidden rounded-2xl p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
            style={{ background: 'rgba(255,77,0,0.2)' }}
          />
          <div className="relative z-10">
            <div className="mb-4 text-5xl">🎯</div>
            <h3 className="mb-2 text-xl font-bold">
              {filter === 'active' ? 'Nenhuma meta ativa' : 'Nenhuma meta aqui'}
            </h3>
            <p className="mb-4 text-text-secondary">
              {filter === 'active'
                ? 'Crie sua primeira meta para começar a acompanhar seu progresso'
                : 'Nada aqui ainda'}
            </p>
            {filter === 'active' && (
              <button type="button" onClick={() => setShowCreate(true)} className="btn-primary">
                Criar primeira meta
              </button>
            )}
          </div>
        </div>
      )}

      {/* Goals grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((goal) => {
            const progress = calcProgress(goal.current_value, goal.target_value);
            const isCompleted = goal.status === 'completed';
            const isPaused = goal.status === 'paused';
            const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;

            // Color based on state
            const accentColor = isCompleted
              ? '#00FF88'
              : isOverdue
                ? '#EF4444'
                : isPaused
                  ? '#8899BB'
                  : progress >= 75
                    ? '#F5C842'
                    : '#FF4D00';

            const progressBarStyle = isCompleted
              ? { background: 'linear-gradient(90deg, #00FF88, #00CC6A)' }
              : progress >= 75
                ? { background: 'linear-gradient(90deg, #F5C842, #FF4D00)' }
                : { background: 'linear-gradient(90deg, #FF4D00, #7C3AED)' };

            return (
              <div
                key={goal.id}
                className={cn(
                  'relative space-y-4 overflow-hidden rounded-2xl p-5 transition-all',
                  isPaused && 'opacity-60'
                )}
                style={{
                  background: isCompleted
                    ? 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 100%)'
                    : isOverdue
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)'
                      : 'rgba(13,24,41,0.8)',
                  border: `1px solid ${accentColor}25`,
                  boxShadow: isCompleted ? `0 0 20px rgba(0,255,136,0.08)` : 'none',
                }}
              >
                {/* Subtle glow corner */}
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-xl"
                  style={{ backgroundColor: accentColor, opacity: 0.08 }}
                />

                <div className="relative z-10 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-3xl"
                      style={{
                        background: `${accentColor}15`,
                        border: `1px solid ${accentColor}25`,
                      }}
                    >
                      {goal.icon ?? '🎯'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn('truncate font-bold', isCompleted && 'text-text-muted')}>
                          {goal.title}
                        </h3>
                        {isCompleted && (
                          <CheckCircle2 size={16} className="shrink-0 text-brand-green" />
                        )}
                        {isPaused && <Pause size={14} className="shrink-0 text-text-muted" />}
                      </div>
                      {goal.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                          {goal.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs capitalize text-text-muted">
                          {GOAL_CATEGORIES.find((c) => c.value === goal.category)?.label ??
                            goal.category}
                        </span>
                        {goal.deadline && (
                          <span
                            className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs"
                            style={
                              isOverdue
                                ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444' }
                                : { background: 'rgba(255,255,255,0.06)', color: '#8899BB' }
                            }
                          >
                            <Flag size={9} />
                            {formatDeadline(goal.deadline)}
                          </span>
                        )}
                        {progress >= 75 && !isCompleted && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}
                          >
                            🔥 Quase lá!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick update button */}
                    {!isCompleted && (
                      <button
                        onClick={() => setUpdateGoal(goal)}
                        title="Atualizar progresso"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-brand-gold"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <ChevronUp size={14} />
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-text-muted">
                        {goal.current_value.toLocaleString('pt-BR')}
                        <span className="text-text-muted/60">
                          {' '}
                          / {goal.target_value.toLocaleString('pt-BR')} {goal.unit}
                        </span>
                      </span>
                      <span className="font-bold" style={{ color: accentColor }}>
                        {progress}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, ...progressBarStyle }}
                      />
                    </div>
                  </div>

                  {/* Actions row */}
                  {!isCompleted && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUpdateGoal(goal)}
                        className="btn-primary flex-1 py-2 text-sm"
                      >
                        Atualizar
                      </button>
                      <button
                        onClick={() => handleComplete(goal)}
                        title="Marcar como concluída"
                        className="rounded-xl px-3 py-2 text-sm font-semibold transition-all hover:opacity-80"
                        style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleTogglePause(goal)}
                        title={isPaused ? 'Retomar' : 'Pausar'}
                        className="rounded-xl bg-bg-elevated px-3 py-2 text-text-muted transition-colors hover:bg-border"
                      >
                        {isPaused ? <ChevronUp size={14} /> : <Pause size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        title="Remover"
                        className="rounded-xl bg-bg-elevated px-3 py-2 text-text-muted transition-colors hover:bg-brand-red/10 hover:text-brand-red"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {isCompleted && goal.completed_at && (
                    <div className="flex items-center gap-1 text-xs text-brand-green">
                      <CheckCircle2 size={12} />
                      Concluída em {new Date(goal.completed_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateGoalModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => setGoals((prev) => [g, ...prev])}
        />
      )}

      {/* Update Progress Modal */}
      {updateGoal && (
        <UpdateProgressModal
          goal={updateGoal}
          onClose={() => setUpdateGoal(null)}
          onUpdated={(g, xpEarned, leveledUp, newLevel) => {
            setGoals((prev) => prev.map((x) => (x.id === g.id ? g : x)));
            setUpdateGoal(null);
            if (xpEarned) {
              showXp(xpEarned, { leveledUp: leveledUp ? newLevel : undefined });
              if (leveledUp && newLevel) {
                window.dispatchEvent(
                  new CustomEvent('ascendia:levelup', { detail: { level: newLevel } })
                );
              }
            }
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ─── Create Modal ────────────────────────────────────────────────────────────

function CreateGoalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (goal: Goal) => void;
}) {
  useScrollLock(true);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [category, setCategory] = useState('custom');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || undefined,
        icon,
        category,
        target_value: parseFloat(targetValue),
        unit,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    });

    setLoading(false);

    if (res.ok) {
      const data = (await res.json()) as { goal: Goal };
      onCreated(data.goal);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg animate-slide-up space-y-4 overflow-hidden overflow-y-auto rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(245,200,66,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(245,200,66,0.15)' }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nova meta</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Icon picker */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all',
                    icon === i ? 'bg-brand-orange/30 ring-2 ring-brand-orange' : 'bg-bg-elevated'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Título da meta *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Ex: Correr 100km no mês"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input h-16 w-full resize-none text-sm"
              placeholder="Por que esta meta é importante?"
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-full"
            >
              {GOAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target + unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm text-text-secondary">Valor alvo *</label>
              <input
                required
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="input w-full"
                placeholder="100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-text-secondary">Unidade *</label>
              <input
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input w-full"
                placeholder="km, livros, kg..."
                maxLength={50}
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-2 block text-sm text-text-secondary">
              Prazo <span className="text-text-muted">(opcional)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input w-full"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title || !targetValue || !unit}
            className="btn-primary w-full"
          >
            {loading ? 'Criando...' : 'Criar meta'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Update Progress Modal ───────────────────────────────────────────────────

function UpdateProgressModal({
  goal,
  onClose,
  onUpdated,
}: {
  goal: Goal;
  onClose: () => void;
  onUpdated: (goal: Goal, xpEarned?: number, leveledUp?: boolean, newLevel?: number) => void;
}) {
  useScrollLock(true);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(String(goal.current_value));
  const progress = calcProgress(parseFloat(value) || 0, goal.target_value);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const newValue = parseFloat(value) || 0;
    const newStatus = newValue >= goal.target_value ? 'completed' : 'active';

    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, current_value: newValue, status: newStatus }),
    });

    setLoading(false);
    if (res.ok) {
      const data = (await res.json()) as {
        goal: Goal;
        xpEarned?: number;
        leveledUp?: boolean;
        newLevel?: number;
      };
      onUpdated(data.goal, data.xpEarned, data.leveledUp, data.newLevel);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-sm animate-slide-up space-y-4 overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(0,255,136,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(0,255,136,0.12)' }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <h2 className="text-lg font-bold">Atualizar progresso</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="text-center">
          <div className="mb-1 text-4xl">{goal.icon ?? '🎯'}</div>
          <div className="font-bold">{goal.title}</div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-text-secondary">
              Progresso atual ({goal.unit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max={goal.target_value * 2}
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input w-full text-center text-2xl font-bold"
              autoFocus
            />
            <div className="mt-1 text-center text-sm text-text-muted">
              de {goal.target_value} {goal.unit}
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-text-muted">Progresso</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full bg-gradient-brand transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {progress >= 100 && (
            <div className="rounded-xl border border-brand-green/30 bg-brand-green/10 p-3 text-center text-sm text-brand-green">
              🎉 Meta alcançada! Será marcada como concluída.
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
