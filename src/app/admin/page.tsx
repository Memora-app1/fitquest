import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Users, Zap, Flame, TrendingUp, Trophy, AlertTriangle, Bell, Flag } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getOverviewStats() {
  const db = createServiceClient();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    totalUsersRes,
    newTodayRes,
    dauRes,
    activeSubsRes,
    trialRes,
    expiredRes,
    habitsLoggedTodayRes,
    xpTodayRes,
    pendingReportsRes,
    streaksRiskRes,
    topLevelRes,
    newLast30Res,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
    db
      .from('habit_logs')
      .select('user_id', { count: 'exact', head: true })
      .eq('logged_date', today),
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'lifetime']),
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'trial'),
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'expired'),
    db.from('habit_logs').select('id', { count: 'exact', head: true }).eq('logged_date', today),
    db.from('xp_transactions').select('amount').gte('created_at', today).limit(100000),
    db.from('user_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'trial')
      .lte('trial_end', new Date(Date.now() + 3 * 86400000).toISOString()),
    db
      .from('profiles')
      .select('id, name, level, xp_total, streak_current, avatar_url')
      .order('xp_total', { ascending: false })
      .limit(5),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', last30),
  ]);

  const xpToday = (xpTodayRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);

  return {
    totalUsers: totalUsersRes.count ?? 0,
    newToday: newTodayRes.count ?? 0,
    dau: dauRes.count ?? 0,
    activeSubs: activeSubsRes.count ?? 0,
    trialUsers: trialRes.count ?? 0,
    expiredUsers: expiredRes.count ?? 0,
    habitsToday: habitsLoggedTodayRes.count ?? 0,
    xpToday,
    pendingReports: pendingReportsRes.count ?? 0,
    trialsExpiringSoon: streaksRiskRes.count ?? 0,
    topUsers: topLevelRes.data ?? [],
    newLast30: newLast30Res.count ?? 0,
  };
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
}

function StatCard({ label, value, sub, icon, color, alert }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{
        background: `rgba(${hexToRgb(color)},0.06)`,
        border: `1px solid rgba(${hexToRgb(color)},${alert ? '0.4' : '0.18'})`,
        boxShadow: alert ? `0 0 20px rgba(${hexToRgb(color)},0.15)` : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#8899BB' }}
        >
          {label}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-black" style={{ color: '#fff' }}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>
        {sub && (
          <div className="mt-0.5 text-xs" style={{ color: '#8899BB' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session) redirect('/dashboard');

  const s = await getOverviewStats();

  const dauRate = s.totalUsers > 0 ? ((s.dau / s.totalUsers) * 100).toFixed(1) : '0';
  const conversionRate =
    s.trialUsers > 0 ? ((s.activeSubs / (s.activeSubs + s.trialUsers)) * 100).toFixed(1) : '0';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#fff' }}>
            Overview
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {s.pendingReports > 0 && (
          <div
            className="flex animate-pulse items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              background: 'rgba(255,77,0,0.1)',
              border: '1px solid rgba(255,77,0,0.3)',
              color: '#FF4D00',
            }}
          >
            <AlertTriangle size={14} />
            {s.pendingReports} denúncia{s.pendingReports !== 1 ? 's' : ''} pendente
            {s.pendingReports !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Usuários"
          value={s.totalUsers}
          sub={`+${s.newToday} hoje`}
          icon={<Users size={16} />}
          color="#7C3AED"
        />
        <StatCard
          label="DAU Hoje"
          value={s.dau}
          sub={`${dauRate}% dos usuários`}
          icon={<TrendingUp size={16} />}
          color="#00FF88"
        />
        <StatCard
          label="Assinantes Ativos"
          value={s.activeSubs}
          sub={`${conversionRate}% de conversão`}
          icon={<Trophy size={16} />}
          color="#F5C842"
        />
        <StatCard
          label="Em Trial"
          value={s.trialUsers}
          sub={`${s.trialsExpiringSoon} expiram em 3d`}
          icon={<Flag size={16} />}
          color={s.trialsExpiringSoon > 10 ? '#FF4D00' : '#3B82F6'}
          alert={s.trialsExpiringSoon > 20}
        />
      </div>

      {/* KPIs de engajamento */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Hábitos Hoje"
          value={s.habitsToday}
          sub="registros hoje"
          icon={<Flame size={16} />}
          color="#FF4D00"
        />
        <StatCard
          label="XP Gerado Hoje"
          value={s.xpToday.toLocaleString('pt-BR')}
          sub="total em transações"
          icon={<Zap size={16} />}
          color="#F5C842"
        />
        <StatCard
          label="Expirados"
          value={s.expiredUsers}
          sub="sem acesso"
          icon={<AlertTriangle size={16} />}
          color={s.expiredUsers > 50 ? '#FF4D00' : '#8899BB'}
          alert={s.expiredUsers > 100}
        />
        <StatCard
          label="Novos (30d)"
          value={s.newLast30}
          sub="últimos 30 dias"
          icon={<Bell size={16} />}
          color="#7C3AED"
        />
      </div>

      {/* Funil de subscription */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
          Funil de Assinatura
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Total de Usuários', count: s.totalUsers, color: '#7C3AED', pct: 100 },
            {
              label: 'Em Trial',
              count: s.trialUsers,
              color: '#3B82F6',
              pct: s.totalUsers ? (s.trialUsers / s.totalUsers) * 100 : 0,
            },
            {
              label: 'Pagantes Ativos',
              count: s.activeSubs,
              color: '#00FF88',
              pct: s.totalUsers ? (s.activeSubs / s.totalUsers) * 100 : 0,
            },
            {
              label: 'Expirados/Churn',
              count: s.expiredUsers,
              color: '#FF4D00',
              pct: s.totalUsers ? (s.expiredUsers / s.totalUsers) * 100 : 0,
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-36 shrink-0 text-xs" style={{ color: '#8899BB' }}>
                {row.label}
              </div>
              <div
                className="h-2 flex-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(row.pct, 100)}%`, background: row.color }}
                />
              </div>
              <div
                className="w-16 shrink-0 text-right text-xs font-bold"
                style={{ color: row.color }}
              >
                {row.count.toLocaleString('pt-BR')}
              </div>
              <div className="w-10 shrink-0 text-right text-[10px]" style={{ color: '#8899BB' }}>
                {row.pct.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top usuários */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
          Top Usuários por XP
        </h2>
        <div className="space-y-2">
          {s.topUsers.map((u: Record<string, unknown>, i: number) => (
            <a
              key={u.id as string}
              href={`/admin/usuarios/${u.id}`}
              className="flex items-center gap-3 rounded-lg p-2.5 transition-all hover:bg-white/5"
            >
              <div className="w-6 text-center text-xs font-black" style={{ color: '#8899BB' }}>
                {i + 1}
              </div>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                style={{
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  color: '#7C3AED',
                }}
              >
                {(u.name as string)?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold" style={{ color: '#fff' }}>
                  {u.name as string}
                </div>
                <div className="text-xs" style={{ color: '#8899BB' }}>
                  Nv {u.level as number} · {u.streak_current as number}d streak
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black" style={{ color: '#F5C842' }}>
                  ⚡ {(u.xp_total as number).toLocaleString('pt-BR')}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
