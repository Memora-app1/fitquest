/**
 * CosmeticsLoader — Server Component que busca cosméticos do usuário
 * e renderiza o CosmeticsPanel (client).
 */

import { createClient } from '@/lib/supabase/server';
import { CosmeticsPanel } from './cosmetics-panel';
import type { OwnedCosmetic } from './cosmetics-panel';

type CosmeticType = 'title' | 'frame' | 'badge' | 'theme';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

interface CosmeticsLoaderProps {
  userId: string;
  equippedTitle: string | null;
  equippedFrame: string | null;
}

export async function CosmeticsLoader({
  userId,
  equippedTitle,
  equippedFrame,
}: CosmeticsLoaderProps) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('user_cosmetics')
    .select(
      `
      cosmetic_id,
      cosmetics!inner(slug, name, type, rarity, preview)
    `
    )
    .eq('user_id', userId)
    .limit(100);

  if (!data || data.length === 0) return null;

  type JoinRow = {
    cosmetic_id: string;
    cosmetics:
      | { slug: string; name: string; type: string; rarity: string; preview: string | null }
      | { slug: string; name: string; type: string; rarity: string; preview: string | null }[];
  };

  const cosmetics: OwnedCosmetic[] = (data as JoinRow[])
    .map((row) => {
      const raw = Array.isArray(row.cosmetics) ? row.cosmetics[0] : row.cosmetics;
      if (!raw) return null;
      return {
        cosmetic_id: row.cosmetic_id,
        slug: raw.slug,
        name: raw.name,
        type: raw.type as CosmeticType,
        rarity: raw.rarity as Rarity,
        preview: raw.preview,
      };
    })
    .filter((c): c is OwnedCosmetic => c !== null)
    .filter((c) => c.type === 'title' || c.type === 'frame');

  if (cosmetics.length === 0) return null;

  return (
    <CosmeticsPanel
      cosmetics={cosmetics}
      equippedTitle={equippedTitle}
      equippedFrame={equippedFrame}
    />
  );
}
