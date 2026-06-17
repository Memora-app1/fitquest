import { createClient } from '@/lib/supabase/server';
import { Zap } from 'lucide-react';
import { XpHistoryChartLazy } from './xp-history-chart-lazy';
import type { DayXP } from './xp-history-chart';

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export async function XpHistory({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = toISO(now);

  const thirtyDaysAgo = new Date(now.getTime() - 29 * 86400000);
  const thirtyDaysAgoStr = toISO(thirtyDaysAgo);

  const { data: txns } = await supabase
    .from('xp_transactions')
    .select('amount, source_type, created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgoStr + 'T00:00:00')
    .order('created_at', { ascending: true })
    .limit(1000);

  const transactions = txns ?? [];

  if (transactions.length === 0) return null;

  // Build 30-day buckets
  const days: DayXP[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = toISO(d);
    const isToday = dateStr === todayStr;
    const label = formatLabel(dateStr);

    const dayTxns = transactions.filter((t) => t.created_at.split('T')[0] === dateStr);
    const habit = dayTxns
      .filter((t) => t.source_type === 'habit')
      .reduce((s, t) => s + (t.amount ?? 0), 0);
    const task = dayTxns
      .filter((t) => t.source_type === 'task')
      .reduce((s, t) => s + (t.amount ?? 0), 0);
    const workout = dayTxns
      .filter((t) => t.source_type === 'workout')
      .reduce((s, t) => s + (t.amount ?? 0), 0);
    const other = dayTxns
      .filter(
        (t) => t.source_type !== 'habit' && t.source_type !== 'task' && t.source_type !== 'workout'
      )
      .reduce((s, t) => s + (t.amount ?? 0), 0);
    const total = habit + task + workout + other;

    days.push({ date: dateStr, label, total, habit, task, workout, other, isToday });
  }

  // Only render if at least 1 day has XP
  const daysWithXP = days.filter((d) => d.total > 0).length;
  if (daysWithXP === 0) return null;

  // Compute trend: last 15d vs first 15d avg
  const first15 = days.slice(0, 15);
  const last15 = days.slice(15);
  const firstAvg =
    first15.filter((d) => d.total > 0).reduce((s, d) => s + d.total, 0) /
    Math.max(1, first15.filter((d) => d.total > 0).length);
  const lastAvg =
    last15.filter((d) => d.total > 0).reduce((s, d) => s + d.total, 0) /
    Math.max(1, last15.filter((d) => d.total > 0).length);
  const trend = firstAvg > 0 ? Math.round(((lastAvg - firstAvg) / firstAvg) * 100) : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.16)',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(245,200,66,0.08)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(245,200,66,0.12)',
                  border: '1px solid rgba(245,200,66,0.22)',
                }}
              >
                <Zap size={12} style={{ color: '#F5C842' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Histórico de XP
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Últimos 30 dias</h2>
            <p className="mt-0.5 text-sm text-text-muted">XP ganho por dia e origem</p>
          </div>

          {/* Trend badge */}
          {trend !== null && (
            <div
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{
                background: trend >= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,0,0.1)',
                border: `1px solid ${trend >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,0,0.2)'}`,
                color: trend >= 0 ? '#00FF88' : '#FF4D00',
              }}
            >
              {trend >= 0 ? '📈' : '📉'}
              <span>
                XP {trend >= 0 ? 'crescendo' : 'caindo'}{' '}
                <span className="font-black">{Math.abs(trend)}%</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Chart ───────────────────────────────────────────────────── */}
        <XpHistoryChartLazy data={days} />
      </div>
    </div>
  );
}
