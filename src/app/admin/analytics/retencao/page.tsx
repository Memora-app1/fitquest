import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Flame, TrendingDown, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RetencaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin');

  const db = createServiceClient();

  const now = new Date();
  const d1ago = new Date(now.getTime() - 1 * 86400000).toISOString();
  const d7ago = new Date(now.getTime() - 7 * 86400000).toISOString();
  const d30ago = new Date(now.getTime() - 30 * 86400000).toISOString();
  const d60ago = new Date(now.getTime() - 60 * 86400000).toISOString();
  const d90ago = new Date(now.getTime() - 90 * 86400000).toISOString();

  const [
    totalUsersRes,
    activeD1Res,
    activeD7Res,
    activeD30Res,
    // Cohorte: usuários criados há 30 dias que têm habit_log nos últimos 7 dias
    cohort30TotalRes,
    cohort30ActiveRes,
    // Streak distribution
    streakBucketsRes,
    // Churn: trial expirados nos últimos 30 dias
    churnedTrialRes,
    // Recovery mode
    recoveryRes,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    // DAU — logaram habit hoje
    db.from('habit_logs').select('user_id').gte('logged_date', now.toISOString().split('T')[0]!).limit(100000),
    // WAU — logaram habit nos últimos 7 dias
    db.from('habit_logs').select('user_id').gte('logged_date', d7ago.split('T')[0]!).limit(500000),
    // MAU — logaram habit nos últimos 30 dias
    db.from('habit_logs').select('user_id').gte('logged_date', d30ago.split('T')[0]!).limit(2000000),
    // Cohort D30: criados entre 30-60 dias atrás que ainda são ativos (hábito nos últimos 7d)
    db.from('profiles').select('id').gte('created_at', d60ago).lte('created_at', d30ago).limit(100000),
    db.from('habit_logs').select('user_id').gte('logged_date', d7ago.split('T')[0]!).limit(5000),
    // Streak distribution
    db
      .from('profiles')
      .select('streak_current')
      .in('subscription_status', ['trial', 'active', 'lifetime'])
      .limit(5000),
    // Churned: expirados nos últimos 30 dias
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'expired')
      .gte('updated_at', d30ago),
    // Recovery mode ativo
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('recovery_mode', true),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;

  // DAU / WAU / MAU únicos
  const dauSet = new Set((activeD1Res.data ?? []).map((r) => r.user_id));
  const wauSet = new Set((activeD7Res.data ?? []).map((r) => r.user_id));
  const mauSet = new Set((activeD30Res.data ?? []).map((r) => r.user_id));

  const dau = dauSet.size;
  const wau = wauSet.size;
  const mau = mauSet.size;

  const dauMau = mau > 0 ? ((dau / mau) * 100).toFixed(1) : '0';
  const wauMau = mau > 0 ? ((wau / mau) * 100).toFixed(1) : '0';

  // Cohort D30 retention
  const cohort30Ids = new Set((cohort30TotalRes.data ?? []).map((r) => r.id));
  const activeD7Ids = new Set((cohort30ActiveRes.data ?? []).map((r) => r.user_id));
  const cohort30Total = cohort30Ids.size;
  const cohort30Active = [...cohort30Ids].filter((id) => activeD7Ids.has(id)).length;
  const cohort30Pct = cohort30Total > 0 ? ((cohort30Active / cohort30Total) * 100).toFixed(1) : '0';

  // Streak distribution
  const streakBuckets = { zero: 0, one_to_6: 0, week_to_29: 0, month_plus: 0 };
  for (const p of streakBucketsRes.data ?? []) {
    const s = p.streak_current ?? 0;
    if (s === 0) streakBuckets.zero++;
    else if (s < 7) streakBuckets.one_to_6++;
    else if (s < 30) streakBuckets.week_to_29++;
    else streakBuckets.month_plus++;
  }
  const streakTotal = Object.values(streakBuckets).reduce((a, b) => a + b, 0);

  const streakRows = [
    { label: '0 dias (inativos)', value: streakBuckets.zero, color: '#FF4D00' },
    { label: '1–6 dias', value: streakBuckets.one_to_6, color: '#F5C842' },
    { label: '7–29 dias (séries)', value: streakBuckets.week_to_29, color: '#7C3AED' },
    { label: '30+ dias (lendário)', value: streakBuckets.month_plus, color: '#00FF88' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
          <Flame size={20} style={{ color: '#FF4D00' }} /> Retenção
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          DAU/WAU/MAU, distribuição de streaks, cohort 30d e churn.
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: 'DAU',
            value: dau.toLocaleString('pt-BR'),
            sub: 'hábito hoje',
            color: '#FF4D00',
          },
          {
            label: 'WAU',
            value: wau.toLocaleString('pt-BR'),
            sub: 'hábito em 7d',
            color: '#7C3AED',
          },
          {
            label: 'MAU',
            value: mau.toLocaleString('pt-BR'),
            sub: 'hábito em 30d',
            color: '#3B82F6',
          },
          {
            label: 'DAU/MAU',
            value: dauMau + '%',
            sub: 'stickiness',
            color: Number(dauMau) >= 20 ? '#00FF88' : '#F5C842',
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
              className="mb-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: '#8899BB' }}
            >
              {k.label}
            </div>
            <div className="text-2xl font-black" style={{ color: k.color }}>
              {k.value}
            </div>
            <div className="text-[11px]" style={{ color: '#8899BB' }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Cohort D30 */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-1 text-sm font-bold" style={{ color: '#fff' }}>
            Retenção Cohort 30d
          </h2>
          <p className="mb-4 text-xs" style={{ color: '#8899BB' }}>
            Usuários criados há 30–60 dias que ainda registraram hábito nos últimos 7 dias.
          </p>
          {cohort30Total === 0 ? (
            <p className="text-xs" style={{ color: '#8899BB' }}>
              Dados insuficientes.
            </p>
          ) : (
            <>
              <div
                className="mb-1 text-4xl font-black"
                style={{
                  color:
                    Number(cohort30Pct) >= 40
                      ? '#00FF88'
                      : Number(cohort30Pct) >= 20
                        ? '#F5C842'
                        : '#FF4D00',
                }}
              >
                {cohort30Pct}%
              </div>
              <p className="mb-3 text-xs" style={{ color: '#8899BB' }}>
                {cohort30Active.toLocaleString('pt-BR')} de {cohort30Total.toLocaleString('pt-BR')}{' '}
                ativos
              </p>
              <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cohort30Pct}%`,
                    background:
                      Number(cohort30Pct) >= 40
                        ? '#00FF88'
                        : Number(cohort30Pct) >= 20
                          ? '#F5C842'
                          : '#FF4D00',
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px]" style={{ color: '#8899BB' }}>
                <span>0%</span>
                <span>Benchmark SaaS fitness: ~35%</span>
                <span>100%</span>
              </div>
            </>
          )}
        </div>

        {/* Churn / Recovery */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Churn & Recovery
          </h2>
          <div className="space-y-3">
            {[
              {
                label: 'Trials expirados (30d)',
                value: (churnedTrialRes.count ?? 0).toLocaleString('pt-BR'),
                icon: <TrendingDown size={14} />,
                color: '#FF4D00',
                sub: 'sem conversão',
              },
              {
                label: 'Recovery Mode ativo',
                value: (recoveryRes.count ?? 0).toLocaleString('pt-BR'),
                icon: <RefreshCw size={14} />,
                color: '#F5C842',
                sub: 'voltando ao streak',
              },
              {
                label: 'WAU/MAU',
                value: wauMau + '%',
                icon: <Flame size={14} />,
                color: Number(wauMau) >= 50 ? '#00FF88' : '#F5C842',
                sub: 'frequência semanal',
              },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ color: r.color }}>{r.icon}</span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#fff' }}>
                      {r.label}
                    </div>
                    <div className="text-[10px]" style={{ color: '#8899BB' }}>
                      {r.sub}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-black" style={{ color: r.color }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribuição de streaks */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
          Distribuição de Streaks
        </h2>
        {streakTotal === 0 ? (
          <p className="text-xs" style={{ color: '#8899BB' }}>
            Sem dados de streak.
          </p>
        ) : (
          <div className="space-y-3">
            {streakRows.map((row) => {
              const pct = streakTotal > 0 ? (row.value / streakTotal) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: '#fff' }}>{row.label}</span>
                    <span style={{ color: row.color }}>
                      {row.value.toLocaleString('pt-BR')} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
