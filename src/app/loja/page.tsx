import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { ShopClient } from '@/components/loja/shop-client'
import { Store } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Loja XP',
  description: 'Troque seu XP por itens de gameplay: Streak Freeze, Boosts e mais.',
}

export const dynamic = 'force-dynamic'

const SHOP_ITEMS = [
  {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Protege seu streak por 1 dia se você falhar. Máximo 10.',
    emoji: '🛡️',
    cost: 500,
    maxOwn: 10,
    category: 'protection',
  },
  {
    id: 'loot_box',
    name: 'Caixa de Recompensa',
    description: 'Abre uma caixa surpresa. Pode conter XP, Streak Freeze ou cosméticos raros.',
    emoji: '📦',
    cost: 300,
    maxOwn: null,
    category: 'loot',
  },
  {
    id: 'xp_boost_2x',
    name: 'XP 2x (1 hora)',
    description: 'Dobra todo o XP ganho por 1 hora. Perfeito para sessões de treino.',
    emoji: '⚡',
    cost: 800,
    maxOwn: 5,
    category: 'boost',
  },
  {
    id: 'streak_recovery',
    name: 'Streak Recovery',
    description: 'Restaura seu streak para o valor de antes da última quebra (máx. 30 dias perdidos).',
    emoji: '🔄',
    cost: 1200,
    maxOwn: 3,
    category: 'protection',
  },
]

export default async function LojaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_total, streak_freezes')
    .eq('id', user.id)
    .single()

  const xp            = (profile?.xp_total as number) ?? 0
  const streakFreezes = (profile?.streak_freezes as number) ?? 0

  // Verifica boost 2x ativo
  const now = new Date().toISOString()
  const { data: activeBoost } = await supabase
    .from('daily_loot')
    .select('reward_meta')
    .eq('user_id', user.id)
    .eq('reward_type', 'multiplier')
    .is('opened_at', null)
    .gt('reward_meta', now)
    .order('reward_meta', { ascending: false })
    .limit(1)
    .maybeSingle()

  const boostExpiresAt = activeBoost ? (activeBoost.reward_meta as string) : null

  return (
    <AppShell>
      {/* Page header */}
      <div
        className="px-4 md:px-8 pt-6 pb-0"
        style={{ maxWidth: '48rem', margin: '0 auto' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.3)' }}
          >
            <Store size={18} style={{ color: '#F5C842' }} />
          </div>
          <div>
            <h1 className="heading-display text-3xl md:text-4xl">Loja XP</h1>
            <p className="text-text-secondary text-sm">Gaste seu XP em itens que potencializam sua evolução</p>
          </div>
        </div>
      </div>

      <ShopClient
        xp={xp}
        streakFreezes={streakFreezes}
        items={SHOP_ITEMS}
        boostExpiresAt={boostExpiresAt}
      />
    </AppShell>
  )
}
