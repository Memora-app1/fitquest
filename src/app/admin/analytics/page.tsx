import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { TrendingUp, Users, Zap, Flame, CheckSquare, Dumbbell } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAnalyticsData() {
  const db = createServiceClient();

  const last30days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });

  const [snapshotsRes, subscriptionBreakdownRes, topHabitsRes, xpBySourceRes] = await Promise.all([
    db
      .from('metrics_daily')
      .select(
        'date, dau, new_users, total_users, habits_logged, xp_granted, active_users, trial_users'
      )
      .gte('date', last30days[0])
      .order('date', { ascending: true }),
    db
      .from('profiles')
      .select('subscription_status')
      .in('subscription_status', ['trial', 'active', 'lifetime', 'expired', 'cancelled']),
    db
      .from('habit_logs')
      .select('habit_id, habits(name, icon)')
      .gte('logged_date', last30days[0])
      .limit(500),
    db
      .from('xp_transactions')
      .select('source_type, amount')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .limit(2000),
  ]);

  const snapshots = snapshotsRes.data ?? [];

  // Subscription breakdown
  const breakdown: Record<string, number> = {};
  for (const p of subscriptionBreakdownRes.data ?? []) {
    breakdown[p.subscription_status] = (breakdown[p.subscription_status] ?? 0) + 1;
  }

  // Top habits
  const habitCounts: Record<string, { name: string; icon: string; count: number }> = {};
  for (const log of topHabitsRes.data ?? []) {
    const h = Array.isArray(log.habits)
      ? (log.habits[0] as { name: string; icon: string } | undefined)
      : (log.habits as { name: string; icon: string } | null);
    if (!h || !log.habit_id) continue;
    const key = log.habit_id;
    if (!habitCounts[key]) habitCounts[key] = { name: h.name, icon: h.icon, count: 0 };
    habitCounts[key]!.count++;
  }
  const topHabits = Object.values(habitCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const maxHabitCount = topHabits[0]?.count ?? 1;

  // XP by source
  const xpBySource: Record<string, number> = {};
  for (const tx of xpBySourceRes.data ?? []) {
    const key = tx.source_type ?? 'other';
    xpBySource[key] = (xpBySource[key] ?? 0) + (tx.amount ?? 0);
  }

  // Calcular DAU médio dos últimos 7 dias
  const last7 = snapshots.slice(-7);
  const avgDau7 =
    last7.length > 0 ? Math.round(last7.reduce((s, d) => s + (d.dau ?? 0), 0) / last7.length) : 0;

  const totalNewLast30 = snapshots.reduce((s, d) => s + (d.new_users ?? 0), 0);
  const totalXpLast30 = snapshots.reduce((s, d) => s + (d.xp_granted ?? 0), 0);
  const totalHabitsLast30 = snapshots.reduce((s, d) => s + (d.habits_logged ?? 0), 0);

  return {
    snapshots,
    breakdown,
    topHabits,
    maxHabitCount,
    xpBySource,
    avgDau7,
    totalNewLast30,
    totalXpLast30,
    totalHabitsLast30,
    last30days,
  };
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin');

  const d = await getAnalyticsData();

  const subColors: Record<string, string> = {
    active: '#00FF88',
    trial: '#3B82F6',
    lifetime: '#7C3AED',
    cancelled: '#F5C842',
    expired: '#FF4D00',
  };
  const subLabels: Record<string, string> = {
    active: 'Ativos',
    trial: 'Trial',
    lifetime: 'Lifetime',
    cancelled: 'Cancelados',
    expired: 'Expirados',
  };

  const maxDau = Math.max(...d.snapshots.map((s) => s.dau ?? 0), 1);
  const maxNew = Math.max(...d.snapshots.map((s) => s.new_users ?? 0), 1);
  const maxXp = Math.max(...d.snapshots.map((s) => s.xp_granted ?? 0), 1);

  const xpSourceLabels: Record<string, string> = {
    habit: 'Hábitos',
    workout: 'Treinos',
    task: 'Tarefas',
    achievement: 'Conquistas',
    streak: 'Streak',
    admin_grant: 'Admin',
    login: 'Login diário',
    other: 'Outros',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#fff' }}>
          Analytics
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          Últimos 30 dias · dados dos snapshots diários
        </p>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: 'DAU médio (7d)',
            value: d.avgDau7.toLocaleString('pt-BR'),
            icon: <Users size={14} />,
            color: '#00FF88',
          },
          {
            label: 'Novos usuários (30d)',
            value: d.totalNewLast30.toLocaleString('pt-BR'),
            icon: <TrendingUp size={14} />,
            color: '#7C3AED',
          },
          {
            label: 'Hábitos registrados (30d)',
            value: d.totalHabitsLast30.toLocaleString('pt-BR'),
            icon: <Flame size={14} />,
            color: '#FF4D00',
          },
          {
            label: 'XP gerado (30d)',
            value: d.totalXpLast30.toLocaleString('pt-BR'),
            icon: <Zap size={14} />,
            color: '#F5C842',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: '#8899BB' }}
              >
                {k.label}
              </span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: '#fff' }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico DAU (30 dias) */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
          DAU — Usuários ativos diários (30d)
        </h2>
        {d.snapshots.length === 0 ? (
          <p className="text-xs" style={{ color: '#8899BB' }}>
            Nenhum snapshot ainda. Execute o cron{' '}
            <code className="rounded px-1 py-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              /api/cron/metrics-snapshot
            </code>{' '}
            para gerar dados.
          </p>
        ) : (
          <div className="flex h-32 items-end gap-1">
            {d.snapshots.map((s, i) => {
              const h = Math.max(4, Math.round(((s.dau ?? 0) / maxDau) * 128));
              const isToday = i === d.snapshots.length - 1;
              return (
                <div
                  key={s.date}
                  className="group relative flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${h}px`,
                      background: isToday ? '#00FF88' : 'rgba(0,255,136,0.3)',
                    }}
                  />
                  {(i % 5 === 0 || isToday) && (
                    <span className="origin-left rotate-45 text-[9px]" style={{ color: '#8899BB' }}>
                      {new Date(s.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  )}
                  <div className="absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    {s.dau} DAU
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Gráfico novos usuários */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Novos usuários por dia
          </h2>
          <div className="flex h-24 items-end gap-1">
            {d.snapshots.map((s, i) => {
              const h = Math.max(2, Math.round(((s.new_users ?? 0) / maxNew) * 96));
              return (
                <div
                  key={s.date}
                  className="group relative flex-1 rounded-t-sm"
                  style={{ height: `${h}px`, background: 'rgba(124,58,237,0.5)' }}
                >
                  <div className="absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    +{s.new_users}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição de planos */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Distribuição de Planos
          </h2>
          <div className="space-y-2.5">
            {Object.entries(d.breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const total = Object.values(d.breakdown).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                const color = subColors[status] ?? '#8899BB';
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: '#fff' }}>{subLabels[status] ?? status}</span>
                      <span style={{ color }}>
                        {count.toLocaleString('pt-BR')} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top hábitos mais registrados */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Top Hábitos (30d)
          </h2>
          <div className="space-y-2">
            {d.topHabits.length === 0 && (
              <p className="text-xs" style={{ color: '#8899BB' }}>
                Sem dados ainda.
              </p>
            )}
            {d.topHabits.map((h, i) => {
              const max = d.maxHabitCount;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-center">{h.icon}</span>
                  <span className="w-32 truncate" style={{ color: '#fff' }}>
                    {h.name}
                  </span>
                  <div
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(h.count / max) * 100}%`, background: '#FF4D00' }}
                    />
                  </div>
                  <span className="w-10 text-right font-bold" style={{ color: '#FF4D00' }}>
                    {h.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* XP por fonte */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            XP por Fonte (30d)
          </h2>
          <div className="space-y-2">
            {Object.entries(d.xpBySource)
              .sort(([, a], [, b]) => b - a)
              .map(([source, xp]) => {
                const max = Math.max(...Object.values(d.xpBySource), 1);
                return (
                  <div key={source} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate" style={{ color: '#8899BB' }}>
                      {xpSourceLabels[source] ?? source}
                    </span>
                    <div
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(xp / max) * 100}%`, background: '#F5C842' }}
                      />
                    </div>
                    <span className="w-16 text-right font-bold" style={{ color: '#F5C842' }}>
                      {xp.toLocaleString('pt-BR')}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
