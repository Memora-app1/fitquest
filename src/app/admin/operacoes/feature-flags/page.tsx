import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { FeatureFlagToggle } from './feature-flag-toggle';

export const dynamic = 'force-dynamic';

export default async function FeatureFlagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin');

  const db = createServiceClient();
  const { data: flags } = await db
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#fff' }}>
          Feature Flags
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          Ative ou desative features sem novo deploy. Apenas admins podem alterar.
        </p>
      </div>

      <div className="space-y-3">
        {(flags ?? []).map((flag) => (
          <FeatureFlagToggle key={flag.id} flag={flag} canEdit={hasMinRole(session, 'admin')} />
        ))}
        {(!flags || flags.length === 0) && (
          <p className="text-sm" style={{ color: '#8899BB' }}>
            Nenhuma flag cadastrada. Execute a migration 010.
          </p>
        )}
      </div>

      {hasMinRole(session, 'admin') && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Criar nova flag
          </h2>
          <form action="/api/admin/feature-flags" method="POST" className="flex flex-col gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="slug"
                placeholder="slug_da_flag"
                required
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
              <input
                name="name"
                placeholder="Nome legível"
                required
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
            </div>
            <input
              name="description"
              placeholder="Descrição (opcional)"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              }}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: '#7C3AED', color: '#fff' }}
              >
                Criar Flag
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
