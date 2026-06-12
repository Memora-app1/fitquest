import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Preços em centavos
const PLAN_PRICES: Record<string, number> = {
  monthly: 3700, // R$ 37,00
  annual: 30660, // R$ 306,60 por ano = R$ 25,55/mês
  lifetime: 59700, // R$ 597,00 único
};

const PLAN_MONTHLY: Record<string, number> = {
  monthly: 3700,
  annual: 2555, // 306,60/12
  lifetime: 0, // não conta para MRR
};

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
  lifetime: 'Lifetime',
};

export default async function ReceitaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin');

  const db = createServiceClient();

  const last30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const [activeSubsRes, lifetimeRes, trialRes, expiredRes, cancelledRes, snapshotsRes] =
    await Promise.all([
      // Assinantes ativos por plano
      db.from('profiles').select('subscription_plan').eq('subscription_status', 'active'),
      // Lifetimes
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'lifetime'),
      // Trials
      db
        .from('profiles')
        .select('id, trial_end, subscription_plan')
        .eq('subscription_status', 'trial')
        .order('trial_end', { ascending: true })
        .limit(1000),
      // Expirados no último mês (churn)
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'expired')
        .gte('updated_at', last30),
      // Cancelados com acesso ainda ativo
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'cancelled'),
      // Snapshots de receita
      db
        .from('metrics_daily')
        .select('date, mrr_cents, new_subs, churned_subs')
        .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]!)
        .order('date', { ascending: true }),
    ]);

  const activeSubs = activeSubsRes.data ?? [];

  // MRR calculado
  const planBreakdown: Record<string, number> = {};
  for (const p of activeSubs) {
    const plan = p.subscription_plan ?? 'monthly';
    planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1;
  }

  let mrrCents = 0;
  for (const [plan, count] of Object.entries(planBreakdown)) {
    mrrCents += (PLAN_MONTHLY[plan] ?? 0) * count;
  }

  const lifetimeCount = lifetimeRes.count ?? 0;
  const totalActive = activeSubs.length + lifetimeCount;
  const trialCount = (trialRes.data ?? []).length;
  const expiredCount = expiredRes.count ?? 0;
  const cancelledCount = cancelledRes.count ?? 0;

  // ARR estimado
  const arrCents = mrrCents * 12;

  // Trials expirando nos próximos 7 dias
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString();
  const trialExpiring = (trialRes.data ?? []).filter(
    (t) => t.trial_end && t.trial_end <= in7days
  ).length;

  // Distribuição dos planos pagos
  const planDistribution = Object.entries(planBreakdown)
    .map(([plan, count]) => ({
      plan,
      count,
      label: PLAN_LABELS[plan] ?? plan,
      pct: activeSubs.length > 0 ? ((count / activeSubs.length) * 100).toFixed(1) : '0',
      monthly: PLAN_MONTHLY[plan] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
          <DollarSign size={20} style={{ color: '#00FF88' }} /> Receita
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          MRR estimado, distribuição de planos e funil de conversão.{' '}
          <span style={{ color: '#FF4D00' }}>
            Stripe é a fonte de verdade — estes são valores estimados.
          </span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: 'MRR estimado',
            value: `R$ ${(mrrCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            color: '#00FF88',
          },
          {
            label: 'ARR estimado',
            value: `R$ ${(arrCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
            color: '#7C3AED',
          },
          {
            label: 'Assinantes ativos',
            value: totalActive.toLocaleString('pt-BR'),
            color: '#3B82F6',
          },
          {
            label: 'Churn (30d)',
            value: expiredCount.toLocaleString('pt-BR'),
            color: '#FF4D00',
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
            <div className="text-xl font-black" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Distribuição de planos */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Distribuição de Planos Ativos
          </h2>
          {planDistribution.length === 0 ? (
            <p className="text-xs" style={{ color: '#8899BB' }}>
              Nenhum plano ativo ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {planDistribution.map((p) => {
                const colors: Record<string, string> = {
                  monthly: '#3B82F6',
                  annual: '#7C3AED',
                  lifetime: '#F5C842',
                };
                const color = colors[p.plan] ?? '#8899BB';
                return (
                  <div key={p.plan}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: '#fff' }}>{p.label}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#8899BB' }}>
                          R${' '}
                          {(p.monthly / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          /mês
                        </span>
                        <span style={{ color }}>
                          {p.count} ({p.pct}%)
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#8899BB' }}>Lifetime (one-time)</span>
                  <span style={{ color: '#F5C842' }}>{lifetimeCount} usuários</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Funil & alertas */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Funil & Alertas
          </h2>
          <div className="space-y-3">
            {[
              {
                label: 'Em Trial',
                value: trialCount.toLocaleString('pt-BR'),
                color: '#3B82F6',
                sub: 'potencial de conversão',
              },
              {
                label: 'Trial expirando em 7d',
                value: trialExpiring.toLocaleString('pt-BR'),
                color: '#F5C842',
                sub: 'urgente enviar e-mail',
                alert: trialExpiring > 0,
              },
              {
                label: 'Cancelados (acesso ativo)',
                value: cancelledCount.toLocaleString('pt-BR'),
                color: '#8899BB',
                sub: 'aguardando fim do período',
              },
              {
                label: 'Expirados (30d)',
                value: expiredCount.toLocaleString('pt-BR'),
                color: '#FF4D00',
                sub: 'churned',
              },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-2">
                  {r.alert && <AlertTriangle size={13} style={{ color: '#F5C842' }} />}
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#fff' }}>
                      {r.label}
                    </div>
                    <div className="text-[10px]" style={{ color: '#8899BB' }}>
                      {r.sub}
                    </div>
                  </div>
                </div>
                <span className="text-base font-black" style={{ color: r.color }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Snapshot de receita (se existir) */}
      {(snapshotsRes.data ?? []).some((s) => s.mrr_cents > 0) && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            MRR Histórico (snapshots)
          </h2>
          <div className="flex h-24 items-end gap-0.5">
            {(snapshotsRes.data ?? []).map((s, i) => {
              const max = Math.max(...(snapshotsRes.data ?? []).map((x) => x.mrr_cents ?? 0), 1);
              const h = Math.max(2, Math.round(((s.mrr_cents ?? 0) / max) * 96));
              const isLast = i === (snapshotsRes.data ?? []).length - 1;
              return (
                <div key={s.date} className="group relative flex flex-1 flex-col justify-end">
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${h}px`,
                      background: isLast ? '#00FF88' : 'rgba(0,255,136,0.3)',
                    }}
                  />
                  <div className="absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    R$ {((s.mrr_cents ?? 0) / 100).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aviso Stripe */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'rgba(255,77,0,0.06)', border: '1px solid rgba(255,77,0,0.15)' }}
      >
        <AlertTriangle size={16} style={{ color: '#F5C842', marginTop: 2, flexShrink: 0 }} />
        <div>
          <p className="text-xs font-bold" style={{ color: '#fff' }}>
            Atenção — dados estimados
          </p>
          <p className="mt-0.5 text-xs" style={{ color: '#8899BB' }}>
            Os valores de MRR/ARR são calculados com base nos campos{' '}
            <code className="rounded px-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
              subscription_plan
            </code>{' '}
            e{' '}
            <code className="rounded px-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
              subscription_status
            </code>{' '}
            na tabela profiles. Podem divergir do Stripe por causa de cancelamentos parciais,
            reembolsos, ou defasagem no webhook. Consulte o painel do Stripe para receita oficial.
          </p>
        </div>
      </div>
    </div>
  );
}
