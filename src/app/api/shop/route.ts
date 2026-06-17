/**
 * XP Shop — troca XP por itens de gameplay.
 *
 * GET  /api/shop   — lista itens disponíveis + XP e inventário do usuário
 * POST /api/shop   { item: ShopItemId } — compra um item
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { calculateLevel } from '@/lib/xp';
import { createDailyLoot } from '@/lib/xp-server';
import { todayString } from '@/lib/utils';

export const SHOP_ITEMS = {
  streak_freeze: {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Protege seu streak por 1 dia se você falhar. Máximo 10.',
    emoji: '🛡️',
    cost: 500,
    maxOwn: 10,
    category: 'protection',
  },
  loot_box: {
    id: 'loot_box',
    name: 'Caixa de Recompensa',
    description: 'Abre uma caixa surpresa. Pode conter XP, Streak Freeze ou cosméticos raros.',
    emoji: '📦',
    cost: 300,
    maxOwn: null, // sem limite
    category: 'loot',
  },
  xp_boost_2x: {
    id: 'xp_boost_2x',
    name: 'XP 2x (1 hora)',
    description: 'Dobra todo o XP ganho por 1 hora. Perfeito para sessões de treino.',
    emoji: '⚡',
    cost: 800,
    maxOwn: 5,
    category: 'boost',
  },
  streak_recovery: {
    id: 'streak_recovery',
    name: 'Streak Recovery',
    description:
      'Restaura seu streak para o valor de antes da última quebra (máx. 30 dias perdidos).',
    emoji: '🔄',
    cost: 1200,
    maxOwn: 3,
    category: 'protection',
  },
} as const;

type ShopItemId = keyof typeof SHOP_ITEMS;

const bodySchema = z.object({
  item: z.enum(['streak_freeze', 'loot_box', 'xp_boost_2x', 'streak_recovery']),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid_item' }, { status: 400 });

  const { item } = parsed.data;
  const shopItem = SHOP_ITEMS[item];

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_total, level, streak_freezes, streak_current, streak_longest')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });

  const currentXp = profile.xp_total as number;

  if (currentXp < shopItem.cost) {
    return NextResponse.json(
      {
        error: 'insufficient_xp',
        message: `Você precisa de ${shopItem.cost} XP mas tem ${currentXp}.`,
        needed: shopItem.cost,
        current: currentXp,
      },
      { status: 400 }
    );
  }

  // Verifica limite de posse
  if (item === 'streak_freeze') {
    const current = (profile.streak_freezes as number) ?? 0;
    if (current >= shopItem.maxOwn!) {
      return NextResponse.json(
        {
          error: 'max_owned',
          message: `Você já tem o máximo de ${shopItem.maxOwn} streak freezes.`,
        },
        { status: 400 }
      );
    }
  }

  const serviceSupabase = createServiceClient();
  const newXp = currentXp - shopItem.cost;
  const newLevel = calculateLevel(newXp);

  // Desconta XP
  await serviceSupabase.from('xp_transactions').insert({
    user_id: user.id,
    amount: -shopItem.cost,
    reason: `XP Shop: ${shopItem.name}`,
    source_type: 'bonus',
    source_id: `shop_${item}_${Date.now()}`,
    xp_total_after: newXp,
    level_after: newLevel,
  });

  await serviceSupabase
    .from('profiles')
    .update({ xp_total: newXp, level: newLevel })
    .eq('id', user.id);

  // Aplica o item
  if (item === 'streak_freeze') {
    const current = (profile.streak_freezes as number) ?? 0;
    await serviceSupabase
      .from('profiles')
      .update({ streak_freezes: current + 1 })
      .eq('id', user.id);
  } else if (item === 'loot_box') {
    // Cria um loot box extra com data futura (não duplica o de hoje)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]!;
    const today = todayString();
    // Tenta hoje primeiro, se já existe tenta amanhã
    const created = await createDailyLoot(user.id, today, 'login_streak');
    if (!created) {
      await createDailyLoot(user.id, tomorrow, 'login_streak');
    }
  } else if (item === 'xp_boost_2x') {
    // Registra boost em daily_loot (reward_meta = ISO expiry string, opened_at = null enquanto ativo)
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    await serviceSupabase.from('daily_loot').insert({
      user_id: user.id,
      date: todayString(),
      rarity: 'epic',
      reward_type: 'multiplier',
      reward_value: 2,
      reward_meta: expiresAt,
      source: 'shop_xp_boost_2x',
      opened_at: null,
    });
    await serviceSupabase.from('notifications').insert({
      user_id: user.id,
      type: 'xp_milestone',
      title: '⚡ XP 2x ativado por 1 hora!',
      body: 'Todo XP ganho nas próximas 1 hora é dobrado automaticamente.',
      action_url: '/dashboard',
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });
  } else if (item === 'streak_recovery') {
    // Restore streak ao máximo histórico (limitado a 30 dias)
    const longest = (profile.streak_longest as number) ?? 0;
    const current = (profile.streak_current as number) ?? 0;
    const restored = Math.min(longest, 30);
    if (restored > current) {
      await serviceSupabase.from('profiles').update({ streak_current: restored }).eq('id', user.id);
    }
  }

  return NextResponse.json({
    ok: true,
    item,
    xpSpent: shopItem.cost,
    xpRemaining: newXp,
    message: `${shopItem.emoji} ${shopItem.name} adicionado!`,
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_total, streak_freezes')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    xp: profile?.xp_total ?? 0,
    streak_freezes: profile?.streak_freezes ?? 0,
    items: Object.values(SHOP_ITEMS),
  });
}
