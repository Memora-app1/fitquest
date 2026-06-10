import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { UserX, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SuspensoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'moderator')) redirect('/admin')

  const db = createServiceClient()

  const [activeSuspensions, recentLifted] = await Promise.all([
    db.from('user_suspensions')
      .select('id, user_id, reason, type, starts_at, ends_at, created_at, profiles(name)')
      .is('lifted_at', null)
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('user_suspensions')
      .select('id, user_id, reason, type, starts_at, ends_at, lifted_at, profiles(name)')
      .not('lifted_at', 'is', null)
      .order('lifted_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
          <UserX size={20} style={{ color: '#FF4D00' }} /> Suspensões Ativas
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          {(activeSuspensions.data ?? []).length} suspensões ativas no momento
        </p>
      </div>

      {/* Ativas */}
      <div className="space-y-2">
        {(activeSuspensions.data ?? []).length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <CheckCircle size={32} className="mx-auto mb-2" style={{ color: '#00FF88' }} />
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>Nenhum usuário suspenso no momento</p>
          </div>
        )}
        {(activeSuspensions.data ?? []).map(s => {
          const profile  = Array.isArray(s.profiles) ? (s.profiles[0] as { name: string } | undefined) : (s.profiles as unknown as { name: string } | null)
          const isPermanent = s.type === 'permanent'
          const isExpired   = s.ends_at ? new Date(s.ends_at) < new Date() : false

          return (
            <div
              key={s.id}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,77,0,0.04)',
                border:     '1px solid rgba(255,77,0,0.15)',
              }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={`/admin/usuarios/${s.user_id}`}
                      className="text-sm font-bold hover:underline"
                      style={{ color: '#fff' }}
                    >
                      {profile?.name ?? s.user_id?.slice(0, 12)}
                    </Link>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: isPermanent ? 'rgba(255,77,0,0.15)' : 'rgba(245,200,66,0.1)',
                        color:      isPermanent ? '#FF4D00' : '#F5C842',
                      }}
                    >
                      {isPermanent ? 'Permanente' : 'Temporária'}
                    </span>
                    {isExpired && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                        Expirada (levantar)
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: '#8899BB' }}>{s.reason}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: '#8899BB' }}>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      Desde: {new Date(s.starts_at).toLocaleDateString('pt-BR')}
                    </span>
                    {s.ends_at && (
                      <span>Até: {new Date(s.ends_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                <form action={`/api/admin/users/${s.user_id}/actions`} method="POST" className="shrink-0">
                  <input type="hidden" name="action" value="unsuspend" />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}
                    onClick={e => {
                      if (!confirm('Levantar a suspensão deste usuário?')) e.preventDefault()
                    }}
                  >
                    <CheckCircle size={12} /> Levantar
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>

      {/* Levantadas recentemente */}
      {(recentLifted.data ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: '#8899BB' }}>Levantadas Recentemente</h2>
          <div className="space-y-2">
            {(recentLifted.data ?? []).map(s => {
              const profile = Array.isArray(s.profiles) ? (s.profiles[0] as { name: string } | undefined) : (s.profiles as unknown as { name: string } | null)
              return (
                <div
                  key={s.id}
                  className="rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div>
                    <Link
                      href={`/admin/usuarios/${s.user_id}`}
                      className="font-semibold hover:underline"
                      style={{ color: '#fff' }}
                    >
                      {profile?.name ?? s.user_id?.slice(0, 12)}
                    </Link>
                    <span className="ml-2" style={{ color: '#8899BB' }}>{s.reason}</span>
                  </div>
                  <span style={{ color: '#00FF88' }}>
                    Levantada: {new Date(s.lifted_at!).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
