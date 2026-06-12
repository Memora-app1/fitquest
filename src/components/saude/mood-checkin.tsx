'use client';

/**
 * MoodCheckin — check-in rápido de humor, energia e estresse.
 * Upsert diário (1 registro por dia). Ganha 10 XP na primeira vez.
 * Mostra histórico dos últimos 5 dias como mini-chips abaixo do formulário.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';
import type { MoodLog } from '@/lib/supabase/types';

interface Props {
  todayLog: MoodLog | null;
  recentLogs: Pick<MoodLog, 'date' | 'mood' | 'energy' | 'stress'>[];
}

const MOOD_OPTIONS = [
  { v: 1, emoji: '😫', label: 'Péssimo' },
  { v: 2, emoji: '😔', label: 'Ruim' },
  { v: 3, emoji: '😐', label: 'Ok' },
  { v: 4, emoji: '😊', label: 'Bom' },
  { v: 5, emoji: '🤩', label: 'Ótimo' },
];
const ENERGY_OPTIONS = [
  { v: 1, emoji: '🪫', label: 'Sem energia' },
  { v: 2, emoji: '😴', label: 'Cansado' },
  { v: 3, emoji: '🙂', label: 'Normal' },
  { v: 4, emoji: '⚡', label: 'Energético' },
  { v: 5, emoji: '🚀', label: 'Explosivo' },
];
const STRESS_OPTIONS = [
  { v: 1, emoji: '🧘', label: 'Zen' },
  { v: 2, emoji: '😌', label: 'Calmo' },
  { v: 3, emoji: '😤', label: 'Normal' },
  { v: 4, emoji: '😰', label: 'Estressado' },
  { v: 5, emoji: '🤯', label: 'Máximo' },
];

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function moodColor(v: number) {
  if (v >= 5) return '#00FF88';
  if (v >= 4) return '#F5C842';
  if (v >= 3) return '#00D9FF';
  if (v >= 2) return '#FF4D00';
  return '#EF4444';
}

function ScaleRow({
  label,
  emoji,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  emoji: string;
  options: { v: number; emoji: string; label: string }[];
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        {value > 0 && (
          <span className="ml-auto text-xs font-black" style={{ color: moodColor(value) }}>
            {options.find((o) => o.v === value)?.label}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            disabled={disabled}
            className="flex h-11 flex-1 items-center justify-center rounded-xl text-xl transition-all hover:scale-110 disabled:opacity-60"
            style={{
              background:
                value === opt.v
                  ? `rgba(${value >= 4 ? '0,255,136' : value >= 3 ? '245,200,66' : '255,77,0'},0.15)`
                  : 'rgba(255,255,255,0.04)',
              border:
                value === opt.v
                  ? `1px solid ${moodColor(opt.v)}40`
                  : '1px solid rgba(255,255,255,0.06)',
              boxShadow: value === opt.v ? `0 0 12px ${moodColor(opt.v)}20` : 'none',
              transform: value === opt.v ? 'scale(1.12)' : undefined,
            }}
            title={opt.label}
          >
            {opt.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MoodCheckin({ todayLog, recentLogs }: Props) {
  const router = useRouter();
  const { toasts, showXp } = useXpToast();

  const [mood, setMood] = useState(todayLog?.mood ?? 0);
  const [energy, setEnergy] = useState(todayLog?.energy ?? 0);
  const [stress, setStress] = useState(todayLog?.stress ?? 0);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(!!todayLog);

  const canSave = mood > 0 && energy > 0 && stress > 0;

  async function handleSave() {
    if (!canSave || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/health/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, energy, stress }),
      });
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
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const overallScore = canSave ? Math.round(((mood + energy + (6 - stress)) / 15) * 100) : null;

  return (
    <div
      className="relative animate-fade-in overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 55%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      <XpToastContainer toasts={toasts} />

      <div
        className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-3xl"
        style={{ background: 'rgba(245,200,66,0.06)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(245,200,66,0.15)',
                border: '1px solid rgba(245,200,66,0.3)',
              }}
            >
              <span className="text-[10px]">💭</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Check-in do Dia
              </span>
              {saved && (
                <span
                  className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88' }}
                >
                  ✓ salvo
                </span>
              )}
            </div>
          </div>
          {overallScore !== null && (
            <div className="text-right">
              <div
                className="text-xl font-black"
                style={{ color: moodColor(Math.round(overallScore / 20)) }}
              >
                {overallScore}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">bem-estar</div>
            </div>
          )}
        </div>

        {/* Scales */}
        <div className="mb-5 space-y-4">
          <ScaleRow
            label="Humor"
            emoji="😊"
            options={MOOD_OPTIONS}
            value={mood}
            onChange={setMood}
            disabled={loading}
          />
          <ScaleRow
            label="Energia"
            emoji="⚡"
            options={ENERGY_OPTIONS}
            value={energy}
            onChange={setEnergy}
            disabled={loading}
          />
          <ScaleRow
            label="Estresse"
            emoji="🧠"
            options={STRESS_OPTIONS}
            value={stress}
            onChange={setStress}
            disabled={loading}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || loading}
          className="w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-40"
          style={{
            background: canSave
              ? 'linear-gradient(135deg, #FF4D00, #7C3AED)'
              : 'rgba(255,255,255,0.06)',
            color: '#fff',
          }}
        >
          {loading ? (
            'Salvando…'
          ) : saved ? (
            'Atualizar check-in'
          ) : (
            <span className="flex items-center justify-center gap-2">
              Salvar check-in
              <span className="flex items-center gap-0.5 text-xs font-black text-brand-gold">
                <Zap size={11} fill="currentColor" />
                +10 XP
              </span>
            </span>
          )}
        </button>

        {/* Recent history */}
        {recentLogs.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-text-muted">
              Últimos dias
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recentLogs.slice(0, 5).map((log) => {
                const d = new Date(log.date + 'T12:00:00');
                const dayLabel = DAY_SHORT[d.getDay()] ?? '';
                const avg = Math.round((log.mood + log.energy + (6 - log.stress)) / 3);
                return (
                  <div
                    key={log.date}
                    className="flex shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      minWidth: 44,
                    }}
                  >
                    <span className="text-[9px] text-text-muted">{dayLabel}</span>
                    <span className="text-base leading-none">
                      {MOOD_OPTIONS.find((o) => o.v === log.mood)?.emoji ?? '😐'}
                    </span>
                    <div
                      className="h-0.5 w-full rounded-full"
                      style={{ background: moodColor(avg) }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
