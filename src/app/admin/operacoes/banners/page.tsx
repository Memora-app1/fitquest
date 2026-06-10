import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Image, ToggleLeft, ToggleRight, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BannersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin')

  const db = createServiceClient()
  const { data: banners } = await db
    .from('app_banners')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
          <Image size={20} style={{ color: '#3B82F6' }} /> Banners In-App
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
          Banners exibidos dentro do app para segmentos específicos.
        </p>
      </div>

      {/* Criar banner */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#fff' }}>
          <Plus size={14} /> Novo Banner
        </h2>
        <form action="/api/admin/banners" method="POST" className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              name="emoji"
              placeholder="Emoji (ex: 🔥)"
              maxLength={4}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
            <input
              name="title"
              placeholder="Título"
              required
              className="px-3 py-2 rounded-lg text-sm outline-none col-span-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
          </div>
          <textarea
            name="body"
            placeholder="Texto do banner"
            required
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
          <div className="grid md:grid-cols-3 gap-3">
            <input
              name="cta_label"
              placeholder="Botão (ex: Ver mais)"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
            <input
              name="cta_url"
              placeholder="URL do botão (ex: /planos)"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
            <select
              name="target_plan"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            >
              <option value="">Todos os planos</option>
              <option value="trial">Apenas trial</option>
              <option value="active">Apenas pagantes</option>
              <option value="expired">Apenas expirados</option>
            </select>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <input
              name="color_from"
              type="color"
              defaultValue="#FF4D00"
              className="h-10 w-full rounded-lg cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              name="color_to"
              type="color"
              defaultValue="#7C3AED"
              className="h-10 w-full rounded-lg cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <input
              name="starts_at"
              type="datetime-local"
              placeholder="Início"
              className="px-3 py-2 rounded-lg text-sm outline-none col-span-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
            <input
              name="ends_at"
              type="datetime-local"
              placeholder="Expiração"
              className="px-3 py-2 rounded-lg text-sm outline-none col-span-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              name="active"
              value="false"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8899BB', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Salvar inativo
            </button>
            <button
              type="submit"
              name="active"
              value="true"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#3B82F6', color: '#fff' }}
            >
              Publicar
            </button>
          </div>
        </form>
      </div>

      {/* Lista de banners */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold" style={{ color: '#fff' }}>Banners ({(banners ?? []).length})</h2>
        {(banners ?? []).map(b => (
          <div
            key={b.id}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Preview do banner */}
            <div
              className="p-4 flex items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${b.color_from}22, ${b.color_to}11)`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-2xl">{b.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: '#fff' }}>{b.title}</div>
                <div className="text-xs mt-0.5" style={{ color: '#8899BB' }}>{b.body}</div>
              </div>
              {b.cta_label && (
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                  style={{ background: b.color_from, color: '#fff' }}
                >
                  {b.cta_label}
                </span>
              )}
            </div>
            {/* Controles */}
            <div
              className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-3 text-xs" style={{ color: '#8899BB' }}>
                {b.target_plan?.length ? (
                  <span>Segmento: {(b.target_plan as string[]).join(', ')}</span>
                ) : (
                  <span>Todos os usuários</span>
                )}
                {b.ends_at && <span>Expira: {new Date(b.ends_at).toLocaleDateString('pt-BR')}</span>}
              </div>
              <div className="flex items-center gap-2">
                <form action={`/api/admin/banners/${b.id}/toggle`} method="POST">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: b.is_active ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                      color:      b.is_active ? '#00FF88' : '#8899BB',
                      border:     `1px solid ${b.is_active ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {b.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    {b.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(banners ?? []).length === 0 && (
          <p className="text-sm" style={{ color: '#8899BB' }}>Nenhum banner criado ainda.</p>
        )}
      </div>
    </div>
  )
}
