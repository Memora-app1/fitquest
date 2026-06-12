import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, UserX, Flame, Zap, ChevronRight, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SUB_LABELS: Record<string, string> = {
  trial: 'Trial',
  active: 'Ativo',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  lifetime: 'Lifetime',
};
const SUB_COLORS: Record<string, string> = {
  trial: '#3B82F6',
  active: '#00FF88',
  cancelled: '#F5C842',
  expired: '#FF4D00',
  lifetime: '#7C3AED',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'support')) redirect('/admin');

  const params = await searchParams;
  const q = params.q ?? '';
  const status = params.status ?? '';
  const page = parseInt(params.page ?? '1', 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  const db = createServiceClient();

  let query = db
    .from('profiles')
    .select(
      'id, name, avatar_url, level, xp_total, streak_current, subscription_status, trial_end, created_at, is_suspended',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }
  if (status) {
    query = query.eq('subscription_status', status);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#fff' }}>
            Usuários
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
            {(count ?? 0).toLocaleString('pt-BR')} usuários encontrados
          </p>
        </div>
        <a
          href={`/api/admin/users/export${status ? `?status=${status}` : ''}`}
          download
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: 'rgba(0,255,136,0.08)',
            color: '#00FF88',
            border: '1px solid rgba(0,255,136,0.2)',
          }}
        >
          <Download size={13} />
          Exportar CSV
        </a>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <form method="GET" className="flex min-w-0 flex-1 gap-2">
          <div
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Search size={14} style={{ color: '#8899BB' }} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#fff' }}
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
            }}
          >
            <option value="">Todos os planos</option>
            <option value="trial">Trial</option>
            <option value="active">Ativo</option>
            <option value="cancelled">Cancelado</option>
            <option value="expired">Expirado</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: '#FF4D00', color: '#fff' }}
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {['Usuário', 'Plano', 'Nível', 'Streak', 'XP Total', 'Cadastro', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#8899BB' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u, i) => {
              const color = SUB_COLORS[u.subscription_status] ?? '#8899BB';
              return (
                <tr
                  key={u.id}
                  style={{
                    borderBottom:
                      i < (users?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: u.is_suspended ? 'rgba(255,77,0,0.04)' : 'transparent',
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                        style={{ background: 'rgba(124,58,237,0.15)', color: '#7C3AED' }}
                      >
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div
                          className="flex items-center gap-1.5 font-medium"
                          style={{ color: '#fff' }}
                        >
                          {u.name}
                          {u.is_suspended && <UserX size={12} style={{ color: '#FF4D00' }} />}
                        </div>
                        <div className="text-xs" style={{ color: '#8899BB' }}>
                          {u.id.slice(0, 8)}…
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: `rgba(${hexToRgb(color)},0.12)`, color }}
                    >
                      {SUB_LABELS[u.subscription_status] ?? u.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold" style={{ color: '#fff' }}>
                      Nv {u.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-1"
                      style={{ color: u.streak_current > 0 ? '#FF4D00' : '#8899BB' }}
                    >
                      {u.streak_current > 0 && <Flame size={12} fill="currentColor" />}
                      <span className="font-semibold">{u.streak_current}d</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" style={{ color: '#F5C842' }}>
                      <Zap size={12} fill="currentColor" />
                      <span className="text-xs font-bold">
                        {(u.xp_total ?? 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8899BB' }}>
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/usuarios/${u.id}`}
                      className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-white"
                      style={{ color: '#8899BB' }}
                    >
                      Ver <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/usuarios?q=${q}&status=${status}&page=${p}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all"
              style={{
                background: p === page ? '#FF4D00' : 'rgba(255,255,255,0.05)',
                color: p === page ? '#fff' : '#8899BB',
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
