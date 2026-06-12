'use client';

import { useState } from 'react';
import { Moon, Sun, Trash2, CheckCircle } from 'lucide-react';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';

const QUALITY_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Péssimo' },
  { value: 2, emoji: '😪', label: 'Ruim' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '😊', label: 'Bom' },
  { value: 5, emoji: '😴', label: 'Ótimo' },
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface SleepLog {
  id: string;
  date: string;
  bed_time: string | null;
  wake_time: string | null;
  duration_hours: number | null;
  quality: number | null;
  xp_earned: number;
}

interface SleepResponse extends SleepLog {
  xpEarned: number;
  leveledUp?: boolean;
  newLevel?: number;
  achievementsUnlocked?: string[];
  error?: string;
}

function calcDuration(bed: string, wake: string): number | null {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  if (bh === undefined || bm === undefined || wh === undefined || wm === undefined) return null;
  const bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return Math.round(((wakeMins - bedMins) / 60) * 10) / 10;
}

function formatDuration(hours: number | null): string {
  if (hours === null || hours === 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

function sleepColor(h: number | null): string {
  if (!h || h === 0) return 'rgba(255,255,255,0.08)';
  if (h >= 8) return '#00FF88';
  if (h >= 7) return '#F5C842';
  if (h >= 6) return '#FF4D00';
  return '#EF4444';
}

export function SleepTracker({
  initialLogs,
  todayStr,
}: {
  initialLogs: SleepLog[];
  todayStr: string;
}) {
  const [logs, setLogs] = useState<SleepLog[]>(initialLogs);
  const [bedTime, setBedTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState<number>(4);
  const [saving, setSaving] = useState(false);
  const { toasts, showXp } = useXpToast();

  const todayLog = logs.find((l) => l.date === todayStr) ?? null;
  const duration = bedTime && wakeTime ? calcDuration(bedTime, wakeTime) : null;

  const weekLogs = logs.slice(0, 7);
  const logsWithDuration = weekLogs.filter(
    (l) => l.duration_hours !== null && l.duration_hours > 0
  );
  const avgDuration =
    logsWithDuration.length > 0
      ? Math.round(
          (logsWithDuration.reduce((s, l) => s + (l.duration_hours ?? 0), 0) /
            logsWithDuration.length) *
            10
        ) / 10
      : null;

  const maxBarDuration = Math.max(...weekLogs.map((l) => l.duration_hours ?? 0), 8);

  async function saveSleep() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/health/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayStr,
          bed_time: bedTime || null,
          wake_time: wakeTime || null,
          duration_hours: duration,
          quality,
        }),
      });
      const data = (await res.json()) as SleepResponse;
      if (res.ok && data.id) {
        setLogs((prev) => {
          const filtered = prev.filter((l) => l.date !== todayStr);
          return [{ ...data, xp_earned: data.xpEarned }, ...filtered].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
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
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteSleep(date: string) {
    setLogs((prev) => prev.filter((l) => l.date !== date));
    await fetch(`/api/health/sleep?date=${date}`, { method: 'DELETE' });
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />

      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
          border: todayLog ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(124,58,237,0.2)',
          boxShadow: todayLog ? '0 0 40px rgba(124,58,237,0.08)' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-3xl"
          style={{ background: 'rgba(124,58,237,0.14)' }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.35)',
                }}
              >
                <Moon size={14} style={{ color: '#7C3AED' }} />
              </div>
              <div>
                <div className="text-sm font-black">Sono</div>
                <div className="text-[10px] text-text-muted">meta: 8h por noite</div>
              </div>
            </div>
            {avgDuration !== null && (
              <div className="text-right">
                <div className="text-xl font-black" style={{ color: '#7C3AED' }}>
                  {formatDuration(avgDuration)}
                </div>
                <div className="text-[10px] text-text-muted">média semanal</div>
              </div>
            )}
          </div>

          {/* Today's log: status se já registrado, formulário se não */}
          {todayLog ? (
            <div
              className="mb-4 flex items-center justify-between gap-3 rounded-xl p-4"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <CheckCircle size={20} style={{ color: '#7C3AED' }} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold" style={{ color: '#7C3AED' }}>
                    Sono registrado hoje
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    {todayLog.bed_time && <span>🌙 {todayLog.bed_time.slice(0, 5)}</span>}
                    {todayLog.wake_time && <span>☀️ {todayLog.wake_time.slice(0, 5)}</span>}
                    {todayLog.duration_hours !== null && (
                      <span
                        className="font-bold"
                        style={{ color: sleepColor(todayLog.duration_hours) }}
                      >
                        ⏱ {formatDuration(todayLog.duration_hours)}
                      </span>
                    )}
                    {todayLog.quality !== null && (
                      <span>
                        {QUALITY_OPTIONS.find((q) => q.value === todayLog.quality)?.emoji}
                      </span>
                    )}
                    {todayLog.xp_earned > 0 && (
                      <span className="font-bold text-brand-gold">+{todayLog.xp_earned} XP</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteSleep(todayStr)}
                className="shrink-0 rounded-lg p-2 text-text-muted transition-all hover:bg-brand-red/10 hover:text-brand-red"
                title="Remover registro"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div
              className="mb-4 space-y-3.5 rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
                Registrar sono de hoje
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="sleep-bed"
                    className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted"
                  >
                    <Moon size={9} /> Dormiu
                  </label>
                  <input
                    id="sleep-bed"
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="input w-full py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sleep-wake"
                    className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted"
                  >
                    <Sun size={9} /> Acordou
                  </label>
                  <input
                    id="sleep-wake"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="input w-full py-2 text-sm"
                  />
                </div>
              </div>

              {/* Duration badge */}
              {duration !== null && duration > 0 && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background:
                      duration >= 8
                        ? 'rgba(0,255,136,0.08)'
                        : duration >= 7
                          ? 'rgba(245,200,66,0.08)'
                          : duration >= 6
                            ? 'rgba(255,77,0,0.08)'
                            : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${duration >= 8 ? 'rgba(0,255,136,0.25)' : duration >= 7 ? 'rgba(245,200,66,0.25)' : duration >= 6 ? 'rgba(255,77,0,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}
                >
                  <span className="text-sm font-black" style={{ color: sleepColor(duration) }}>
                    ⏱ {formatDuration(duration)}
                  </span>
                  <span className="text-xs text-text-muted">
                    {duration >= 8
                      ? '⚡ +30 XP (bônus ideal!)'
                      : duration >= 7
                        ? 'quase 8h!'
                        : duration >= 6
                          ? 'regular'
                          : 'poco sono ⚠️'}
                  </span>
                </div>
              )}

              {/* Quality selector */}
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-wider text-text-muted">
                  Qualidade do sono
                </div>
                <div className="flex gap-2">
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => setQuality(q.value)}
                      title={q.label}
                      className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-all"
                      style={{
                        background:
                          quality === q.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                        border:
                          quality === q.value
                            ? '1px solid rgba(124,58,237,0.55)'
                            : '1px solid rgba(255,255,255,0.06)',
                        transform: quality === q.value ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span className="text-xl leading-none">{q.emoji}</span>
                      <span className="mt-0.5 text-[8px] text-text-muted">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveSleep}
                disabled={saving}
                className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60"
              >
                <Moon size={15} />
                {saving ? 'Salvando…' : `Salvar sono · +${duration && duration >= 8 ? 30 : 20} XP`}
              </button>
            </div>
          )}

          {/* 7-night history bars */}
          {weekLogs.length > 1 && (
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-wider text-text-muted">
                Histórico (últimas {weekLogs.length} noites)
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {[...weekLogs].reverse().map((log) => {
                  const h = log.duration_hours ?? 0;
                  const barPct =
                    maxBarDuration > 0 ? Math.max(h > 0 ? 8 : 2, (h / maxBarDuration) * 100) : 8;
                  const color = sleepColor(h);
                  const dayLabel = DAY_LABELS[new Date(log.date + 'T12:00:00').getDay()] ?? '';
                  const isToday = log.date === todayStr;
                  return (
                    <div key={log.date} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-3 items-end text-[8px] text-text-muted">
                        {h > 0 ? formatDuration(h) : ''}
                      </div>
                      <div className="flex w-full flex-col justify-end" style={{ height: '40px' }}>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          title={h > 0 ? formatDuration(h) : 'Sem registro'}
                          style={{
                            height: `${barPct}%`,
                            background: h > 0 ? color : 'rgba(255,255,255,0.06)',
                            boxShadow: h >= 8 ? `0 0 8px ${color}60` : 'none',
                          }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: isToday ? '#7C3AED' : 'rgba(136,153,187,0.5)' }}
                      >
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Color legend */}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {[
                  { color: '#00FF88', label: '8h+' },
                  { color: '#F5C842', label: '7–8h' },
                  { color: '#FF4D00', label: '6–7h' },
                  { color: '#EF4444', label: '<6h' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-[2px]" style={{ background: l.color }} />
                    <span className="text-[9px] text-text-muted">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
