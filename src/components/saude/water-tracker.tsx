'use client';

import { useState } from 'react';
import { Droplets, Trash2, Plus, Check, X } from 'lucide-react';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';
import { WATER_GOAL_ML } from '@/lib/constants';

const QUICK_AMOUNTS = [
  { ml: 200, label: '200ml', emoji: '🥤', desc: 'Copo' },
  { ml: 300, label: '300ml', emoji: '☕', desc: 'Caneca' },
  { ml: 500, label: '500ml', emoji: '💧', desc: 'Garrafa P' },
  { ml: 1000, label: '1L', emoji: '🍶', desc: 'Garrafa G' },
];

interface WaterEntry {
  id: string;
  amount_ml: number;
  created_at: string;
}

interface WaterResponse {
  id: string;
  amount_ml: number;
  created_at: string;
  totalToday: number;
  xpEarned: number;
  leveledUp?: boolean;
  newLevel?: number;
  goalReached: boolean;
  achievementsUnlocked?: string[];
  error?: string;
}

export function WaterTracker({
  initialEntries,
  initialTotal,
}: {
  initialEntries: WaterEntry[];
  initialTotal: number;
}) {
  const [entries, setEntries] = useState<WaterEntry[]>(initialEntries);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [justGoal, setJustGoal] = useState(false);
  const { toasts, showXp } = useXpToast();

  const pct = Math.min(Math.round((total / WATER_GOAL_ML) * 100), 100);
  const goalReached = total >= WATER_GOAL_ML;
  const circumference = 2 * Math.PI * 54;

  async function addWater(amount: number) {
    if (loading || amount <= 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/health/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: amount }),
      });
      const data = (await res.json()) as WaterResponse;
      if (res.ok && data.id) {
        setEntries((prev) => [
          { id: data.id, amount_ml: data.amount_ml, created_at: data.created_at },
          ...prev,
        ]);
        setTotal(data.totalToday);
        if (data.xpEarned > 0) {
          showXp(data.xpEarned, { leveledUp: data.leveledUp ? data.newLevel : undefined });
          if (data.leveledUp && data.newLevel) {
            window.dispatchEvent(
              new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } })
            );
          }
          for (const slug of data.achievementsUnlocked ?? []) {
            window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }));
          }
          setJustGoal(true);
          setTimeout(() => setJustGoal(false), 2500);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function removeEntry(id: string, amount: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setTotal((prev) => Math.max(0, prev - amount));
    await fetch(`/api/health/water?id=${id}`, { method: 'DELETE' });
  }

  function handleCustomSubmit() {
    const v = parseInt(customAmount);
    if (v > 0 && v <= 5000) {
      addWater(v);
      setCustomAmount('');
      setShowCustom(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />

      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(0,217,255,0.07) 0%, rgba(13,24,41,0.98) 100%)',
          border: goalReached ? '1px solid rgba(0,217,255,0.5)' : '1px solid rgba(0,217,255,0.18)',
          boxShadow: goalReached ? '0 0 40px rgba(0,217,255,0.1)' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-3xl"
          style={{ background: 'rgba(0,217,255,0.14)' }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(0,217,255,0.15)',
                  border: '1px solid rgba(0,217,255,0.35)',
                }}
              >
                <Droplets size={14} style={{ color: '#00D9FF' }} />
              </div>
              <div>
                <div className="text-sm font-black">Hidratação</div>
                <div className="text-[10px] text-text-muted">
                  meta: {WATER_GOAL_ML / 1000}L por dia
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black" style={{ color: '#00D9FF' }}>
                {total >= 1000 ? `${(total / 1000).toFixed(1)}L` : `${total}ml`}
              </div>
              <div className="text-[10px]" style={{ color: goalReached ? '#00FF88' : '#8899BB' }}>
                {goalReached ? '✅ Meta atingida!' : `faltam ${WATER_GOAL_ML - total}ml`}
              </div>
            </div>
          </div>

          {/* Circular progress + entries */}
          <div className="mb-5 flex items-start gap-5">
            {/* Ring */}
            <div className="relative shrink-0">
              <svg width="128" height="128">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke={goalReached ? '#00FF88' : '#00D9FF'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - pct / 100)}
                  transform="rotate(-90 64 64)"
                  style={{
                    transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease',
                    filter: `drop-shadow(0 0 8px ${goalReached ? 'rgba(0,255,136,0.7)' : 'rgba(0,217,255,0.7)'})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex select-none flex-col items-center justify-center">
                <div
                  className="text-3xl font-black leading-none"
                  style={{ color: goalReached ? '#00FF88' : '#00D9FF' }}
                >
                  {pct}%
                </div>
                <div className="mt-0.5 text-[9px] text-text-muted">hidratado</div>
                {justGoal && (
                  <div className="mt-1 text-sm" style={{ animation: 'xpBump 0.4s ease-out' }}>
                    🎉
                  </div>
                )}
              </div>
            </div>

            {/* Entry list */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-text-muted">
                Registros de hoje
              </div>
              {entries.length === 0 ? (
                <p className="text-xs italic text-text-muted">Nenhum registro ainda</p>
              ) : (
                <div className="max-h-[100px] space-y-1.5 overflow-y-auto pr-1">
                  {entries.map((e) => (
                    <div key={e.id} className="group flex items-center gap-2">
                      <span className="w-10 shrink-0 text-[10px] tabular-nums text-text-muted">
                        {formatTime(e.created_at)}
                      </span>
                      <div
                        className="flex h-5 flex-1 items-center rounded-full px-2"
                        style={{ background: 'rgba(0,217,255,0.12)' }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: '#00D9FF' }}>
                          +{e.amount_ml}ml
                        </span>
                      </div>
                      <button
                        onClick={() => removeEntry(e.id, e.amount_ml)}
                        className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:text-brand-red group-hover:opacity-100"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Daily progress bar */}
              <div className="mt-3">
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: goalReached
                        ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                        : 'linear-gradient(90deg, #00D9FF, #0099CC)',
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-text-muted">
                  <span>0</span>
                  <span>{WATER_GOAL_ML / 1000}L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick add buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map(({ ml, label, emoji, desc }) => (
                <button
                  key={ml}
                  onClick={() => addWater(ml)}
                  disabled={loading}
                  className="flex flex-col items-center gap-0.5 rounded-xl p-2.5 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40"
                  style={{
                    background: 'rgba(0,217,255,0.08)',
                    border: '1px solid rgba(0,217,255,0.2)',
                  }}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="mt-1 text-xs font-black" style={{ color: '#00D9FF' }}>
                    {label}
                  </span>
                  <span className="text-[9px] text-text-muted">{desc}</span>
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            {showCustom ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Quantidade em ml (ex: 750)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomSubmit();
                    if (e.key === 'Escape') {
                      setShowCustom(false);
                      setCustomAmount('');
                    }
                  }}
                  className="input flex-1 py-2 text-sm"
                  min={1}
                  max={5000}
                  autoFocus
                />
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customAmount || parseInt(customAmount) <= 0}
                  className="btn-primary px-3 py-2 disabled:opacity-40"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setShowCustom(false);
                    setCustomAmount('');
                  }}
                  className="btn-ghost px-3 py-2"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustom(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs text-text-muted transition-colors hover:text-white"
                style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
              >
                <Plus size={12} />
                Quantidade personalizada
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
