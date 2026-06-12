import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Zap, TrendingUp, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function XpManagementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'support')) redirect('/admin');

  const db = createServiceClient();

  // Últimas 20 transações de XP manual
  const { data: recentGrants } = await db
    .from('xp_transactions')
    .select('id, user_id, amount, reason, xp_total_after, created_at, profiles(name)')
    .in('source_type', ['admin_grant', 'admin_deduct'])
    .order('created_at', { ascending: false })
    .limit(20);

  // Top 5 usuários por XP total (para concessão rápida)
  const { data: topUsers } = await db
    .from('profiles')
    .select('id, name, xp_total, level')
    .in('subscription_status', ['trial', 'active', 'lifetime'])
    .order('xp_total', { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
          <Zap size={20} style={{ color: '#F5C842' }} /> Concessão de XP
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          Ajuste manual de XP para usuários específicos. Toda ação é auditada.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Formulário de concessão */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Conceder / Remover XP
          </h2>
          <form action="/api/admin/xp-grant" method="POST" className="space-y-3">
            <div>
              <label className="mb-1 block text-xs" style={{ color: '#8899BB' }}>
                ID do usuário
              </label>
              <input
                name="user_id"
                placeholder="UUID do usuário"
                required
                className="w-full rounded-lg px-3 py-2 font-mono text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: '#8899BB' }}>
                Quantidade de XP <span style={{ color: '#8899BB' }}>(negativo para remover)</span>
              </label>
              <input
                name="amount"
                type="number"
                placeholder="Ex: 500 ou -100"
                required
                min={-100000}
                max={100000}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: '#8899BB' }}>
                Motivo (obrigatório)
              </label>
              <input
                name="reason"
                placeholder="Ex: Compensação por bug no cron de streak"
                required
                maxLength={200}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
              style={{
                background: 'rgba(245,200,66,0.1)',
                color: '#F5C842',
                border: '1px solid rgba(245,200,66,0.25)',
              }}
            >
              <Zap size={14} /> Aplicar XP
            </button>
          </form>

          {/* Usuários recentes para copiar o ID */}
          <div className="mt-5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="mb-3 text-xs font-semibold" style={{ color: '#8899BB' }}>
              Top usuários — clique para copiar ID
            </p>
            <div className="space-y-1.5">
              {(topUsers ?? []).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined') navigator.clipboard.writeText(u.id);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-all hover:bg-white/5"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ color: '#fff' }}>{u.name}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#8899BB' }}>Nv {u.level}</span>
                    <span style={{ color: '#F5C842' }}>
                      ⚡{(u.xp_total ?? 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Histórico de concessões manuais */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold" style={{ color: '#fff' }}>
            <Clock size={14} style={{ color: '#8899BB' }} /> Últimas concessões manuais
          </h2>
          {(recentGrants ?? []).length === 0 && (
            <p className="text-xs" style={{ color: '#8899BB' }}>
              Nenhuma concessão manual ainda.
            </p>
          )}
          <div className="space-y-2">
            {(recentGrants ?? []).map((g) => {
              const profile = Array.isArray(g.profiles)
                ? (g.profiles[0] as { name: string } | undefined)
                : (g.profiles as unknown as { name: string } | null);
              const isGrant = (g.amount ?? 0) > 0;
              return (
                <div
                  key={g.id}
                  className="rounded-lg p-3 text-xs"
                  style={{
                    background: isGrant ? 'rgba(0,255,136,0.04)' : 'rgba(255,77,0,0.04)',
                    border: `1px solid ${isGrant ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,0,0.1)'}`,
                  }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span style={{ color: '#fff' }}>{profile?.name ?? g.user_id?.slice(0, 8)}</span>
                    <span className="font-black" style={{ color: isGrant ? '#00FF88' : '#FF4D00' }}>
                      {isGrant ? '+' : ''}
                      {g.amount} XP
                    </span>
                  </div>
                  <div className="truncate" style={{ color: '#8899BB' }}>
                    {g.reason}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span style={{ color: '#8899BB' }}>
                      Total após: {(g.xp_total_after ?? 0).toLocaleString('pt-BR')}
                    </span>
                    <span style={{ color: '#8899BB' }}>
                      {new Date(g.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
