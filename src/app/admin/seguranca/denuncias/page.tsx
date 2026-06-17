import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Assédio',
  inappropriate_content: 'Conteúdo inadequado',
  fake_account: 'Conta falsa',
  cheating: 'Trapaça',
  other: 'Outro',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF4D00',
  reviewing: '#F5C842',
  resolved: '#00FF88',
  dismissed: '#8899BB',
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'moderator')) redirect('/admin');

  const params = await searchParams;
  const status = params.status ?? 'pending';

  const db = createServiceClient();

  const { data: reports, count } = await db
    .from('user_reports')
    .select('id, reason, description, status, created_at, reporter_id, reported_id', {
      count: 'exact',
    })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  // Pega nomes dos usuários envolvidos
  const allIds = [
    ...new Set([
      ...(reports ?? []).map((r) => r.reporter_id),
      ...(reports ?? []).map((r) => r.reported_id),
    ]),
  ];
  const nameMap: Record<string, string> = {};
  if (allIds.length > 0) {
    const { data: profiles } = await db.from('profiles').select('id, name').in('id', allIds).limit(100);
    for (const p of profiles ?? []) nameMap[p.id] = p.name;
  }

  const tabs = [
    { label: 'Pendentes', value: 'pending', color: '#FF4D00' },
    { label: 'Analisando', value: 'reviewing', color: '#F5C842' },
    { label: 'Resolvidas', value: 'resolved', color: '#00FF88' },
    { label: 'Dispensadas', value: 'dismissed', color: '#8899BB' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
          <AlertTriangle size={20} style={{ color: '#FF4D00' }} /> Denúncias
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          {(count ?? 0).toLocaleString('pt-BR')} denúncias com status: {status}
        </p>
      </div>

      {/* Tabs de status */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/seguranca/denuncias?status=${tab.value}`}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background:
                status === tab.value
                  ? `rgba(${hexToRgb(tab.color)},0.15)`
                  : 'rgba(255,255,255,0.04)',
              color: status === tab.value ? tab.color : '#8899BB',
              border: `1px solid ${status === tab.value ? `rgba(${hexToRgb(tab.color)},0.3)` : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Lista de denúncias */}
      <div className="space-y-3">
        {(reports ?? []).length === 0 && (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <CheckCircle size={32} className="mx-auto mb-2" style={{ color: '#00FF88' }} />
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>
              Nenhuma denúncia {status === 'pending' ? 'pendente' : `com status "${status}"`}
            </p>
          </div>
        )}
        {(reports ?? []).map((r) => {
          const reporterName = nameMap[r.reporter_id] ?? r.reporter_id?.slice(0, 8);
          const reportedName = nameMap[r.reported_id] ?? r.reported_id?.slice(0, 8);
          const statusColor = STATUS_COLORS[r.status] ?? '#8899BB';

          return (
            <div
              key={r.id}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        background: `rgba(${hexToRgb(statusColor)},0.12)`,
                        color: statusColor,
                      }}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#FF4D00' }}>
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                    <span className="text-xs" style={{ color: '#8899BB' }}>
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div>
                      <span style={{ color: '#8899BB' }}>Denunciante: </span>
                      <Link
                        href={`/admin/usuarios/${r.reporter_id}`}
                        style={{ color: '#fff' }}
                        className="transition-colors hover:text-brand-orange"
                      >
                        {reporterName}
                      </Link>
                    </div>
                    <div>
                      <span style={{ color: '#8899BB' }}>Denunciado: </span>
                      <Link
                        href={`/admin/usuarios/${r.reported_id}`}
                        style={{ color: '#FF4D00', fontWeight: 600 }}
                        className="transition-opacity hover:opacity-80"
                      >
                        {reportedName}
                      </Link>
                    </div>
                    {r.description && <div style={{ color: '#8899BB' }}>"{r.description}"</div>}
                  </div>
                </div>

                {/* Ações de moderação */}
                {r.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <form action={`/api/admin/reports/${r.id}`} method="POST">
                      <input type="hidden" name="status" value="reviewing" />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background: 'rgba(245,200,66,0.1)',
                          color: '#F5C842',
                          border: '1px solid rgba(245,200,66,0.2)',
                        }}
                      >
                        <Eye size={11} /> Analisar
                      </button>
                    </form>
                    <form action={`/api/admin/reports/${r.id}`} method="POST">
                      <input type="hidden" name="status" value="dismissed" />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: '#8899BB',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <XCircle size={11} /> Dispensar
                      </button>
                    </form>
                  </div>
                )}
                {r.status === 'reviewing' && (
                  <form action={`/api/admin/reports/${r.id}`} method="POST">
                    <input type="hidden" name="status" value="resolved" />
                    <button
                      type="submit"
                      className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background: 'rgba(0,255,136,0.1)',
                        color: '#00FF88',
                        border: '1px solid rgba(0,255,136,0.2)',
                      }}
                    >
                      <CheckCircle size={11} /> Resolver
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
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
