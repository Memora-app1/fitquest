import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { TrendingUp, Users, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CrescimentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin');

  const db = createServiceClient();

  const last90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]!;
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]!;
  const last7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!;

  const [snapshotsRes, totalUsersRes, newLast7Res, newLast30Res, trialConvRes] = await Promise.all([
    db
      .from('metrics_daily')
      .select('date, new_users, total_users, trial_users, active_users')
      .gte('date', last90)
      .order('date', { ascending: true })
      .limit(90),
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', last7),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', last30),
    // Conversão: usuários que saíram do trial para active nos últimos 30 dias
    db
      .from('xp_transactions')
      .select('user_id')
      .eq('source_type', 'subscription_upgrade')
      .gte('created_at', last30)
      .limit(500),
  ]);

  const snapshots = snapshotsRes.data ?? [];
  const noData = snapshots.length === 0;

  // Crescimento semana a semana: agrupar por semana
  const weeklyMap: Record<string, number> = {};
  for (const s of snapshots) {
    const d = new Date(s.date);
    const mon = new Date(d);
    mon.setDate(d.getDate() - d.getDay() + 1);
    const key = mon.toISOString().split('T')[0]!;
    weeklyMap[key] = (weeklyMap[key] ?? 0) + (s.new_users ?? 0);
  }
  const weeklyEntries = Object.entries(weeklyMap).slice(-12);
  const maxWeekly = Math.max(...weeklyEntries.map(([, v]) => v), 1);

  const maxNew = Math.max(...snapshots.map((s) => s.new_users ?? 0), 1);

  // Totais
  const totalNewLast30 = newLast30Res.count ?? 0;
  const totalNewLast7 = newLast7Res.count ?? 0;
  const totalUsers = totalUsersRes.count ?? 0;

  // WoW growth (última semana vs anterior)
  const lastWeekTotal = snapshots.slice(-7).reduce((s, d) => s + (d.new_users ?? 0), 0);
  const prevWeekTotal = snapshots.slice(-14, -7).reduce((s, d) => s + (d.new_users ?? 0), 0);
  const wowPct =
    prevWeekTotal > 0 ? (((lastWeekTotal - prevWeekTotal) / prevWeekTotal) * 100).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
          <TrendingUp size={20} style={{ color: '#00FF88' }} /> Crescimento
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          Novos cadastros, evolução da base e crescimento semana a semana.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total de usuários', value: totalUsers.toLocaleString('pt-BR'), color: '#fff' },
          { label: 'Novos (7d)', value: totalNewLast7.toLocaleString('pt-BR'), color: '#00FF88' },
          { label: 'Novos (30d)', value: totalNewLast30.toLocaleString('pt-BR'), color: '#7C3AED' },
          {
            label: 'Crescimento WoW',
            value: wowPct !== null ? `${Number(wowPct) > 0 ? '+' : ''}${wowPct}%` : '—',
            color: wowPct !== null && Number(wowPct) >= 0 ? '#00FF88' : '#FF4D00',
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
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: '#8899BB' }}
            >
              {k.label}
            </div>
            <div className="text-2xl font-black" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico diário */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
          Novos usuários por dia (90d)
        </h2>
        {noData ? (
          <p className="text-xs" style={{ color: '#8899BB' }}>
            Aguardando snapshots do cron{' '}
            <code className="rounded px-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
              /api/cron/metrics-snapshot
            </code>
            .
          </p>
        ) : (
          <div className="flex h-28 items-end gap-0.5">
            {snapshots.map((s, i) => {
              const h = Math.max(2, Math.round(((s.new_users ?? 0) / maxNew) * 112));
              const isLast = i === snapshots.length - 1;
              return (
                <div key={s.date} className="group relative flex flex-1 flex-col justify-end">
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${h}px`,
                      background: isLast ? '#00FF88' : 'rgba(0,255,136,0.35)',
                    }}
                  />
                  <div className="absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    +{s.new_users} ·{' '}
                    {new Date(s.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gráfico semanal */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
          Novos usuários por semana (12 semanas)
        </h2>
        {weeklyEntries.length === 0 ? (
          <p className="text-xs" style={{ color: '#8899BB' }}>
            Sem dados.
          </p>
        ) : (
          <div className="flex h-28 items-end gap-1.5">
            {weeklyEntries.map(([week, count], i) => {
              const h = Math.max(4, Math.round((count / maxWeekly) * 112));
              const isLast = i === weeklyEntries.length - 1;
              return (
                <div key={week} className="group relative flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t group-hover:opacity-100"
                    style={{
                      height: `${h}px`,
                      background: isLast ? '#7C3AED' : 'rgba(124,58,237,0.4)',
                    }}
                  />
                  <span className="text-[9px]" style={{ color: '#8899BB' }}>
                    {new Date(week).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                  <div className="absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    +{count} na semana
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evolução da base total */}
      {!noData && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Evolução da base total
          </h2>
          <div className="flex h-20 items-end gap-0.5">
            {snapshots.map((s, i) => {
              const maxTotal = Math.max(...snapshots.map((x) => x.total_users ?? 0), 1);
              const h = Math.max(4, Math.round(((s.total_users ?? 0) / maxTotal) * 80));
              const isLast = i === snapshots.length - 1;
              return (
                <div key={s.date} className="group relative flex flex-1 flex-col justify-end">
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${h}px`,
                      background: isLast ? '#F5C842' : 'rgba(245,200,66,0.3)',
                    }}
                  />
                  <div className="absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    {(s.total_users ?? 0).toLocaleString('pt-BR')} usuários
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px]" style={{ color: '#8899BB' }}>
            <span>
              {new Date(snapshots[0]!.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
            <span>
              {new Date(snapshots[snapshots.length - 1]!.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
