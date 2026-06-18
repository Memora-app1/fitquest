/**
 * OG Image dinâmica — card de conquista desbloqueada, compartilhável.
 * GET /api/og/achievement?slug={slug}&uid={userId}
 *
 * Gera uma imagem 1200×630 destacando a conquista (nome, emoji, raridade)
 * + identidade do usuário (nome + nível). Usada pelo AchievementShareModal
 * para sharing social real (não só texto).
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ACHIEVEMENT_MAP, RARITY_STYLE } from '@/lib/achievements';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') ?? '';
  const uid = searchParams.get('uid');

  // Overrides opcionais (página de conquistas passa dados reais do banco).
  // Fallback: lookup pela lib via slug → genérico.
  const fromLib = ACHIEVEMENT_MAP[slug];
  const nameParam = searchParams.get('name');
  const emojiParam = searchParams.get('emoji');
  const rarityParam = searchParams.get('rarity');
  const validRarity =
    rarityParam && rarityParam in RARITY_STYLE
      ? (rarityParam as keyof typeof RARITY_STYLE)
      : undefined;

  const meta = {
    name: nameParam ?? fromLib?.name ?? 'Conquista Desbloqueada',
    emoji: emojiParam ?? fromLib?.emoji ?? '🏆',
    rarity: validRarity ?? fromLib?.rarity ?? ('epic' as const),
  };
  const rarity = RARITY_STYLE[meta.rarity];
  const accent = rarity.color;

  let name = 'Ascendia';
  let level = 1;

  if (uid) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('profiles')
        .select('name, level')
        .eq('id', uid)
        .single();
      if (data) {
        name = (data.name as string)?.split(' ')[0] ?? 'Ascendia';
        level = (data.level as number) ?? 1;
      }
    } catch {
      /* usa defaults */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#050914',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow de fundo na cor da raridade */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)`,
          }}
        />

        {/* Logo topo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'absolute',
            top: '48px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #7C3AED, #FF4D00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ⚡
          </div>
          <span
            style={{ color: '#8899BB', fontSize: '16px', fontWeight: 600, letterSpacing: '0.12em' }}
          >
            ASCENDIA
          </span>
        </div>

        {/* Badge da conquista */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}22 0%, rgba(13,24,41,0.98) 72%)`,
            border: `4px solid ${accent}`,
            boxShadow: `0 0 80px ${accent}40`,
            fontSize: '110px',
            lineHeight: 1,
            marginBottom: '36px',
          }}
        >
          {meta.emoji}
        </div>

        {/* Selo de raridade */}
        <div
          style={{
            display: 'flex',
            color: accent,
            fontSize: '20px',
            fontWeight: 900,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          {rarity.label}
        </div>

        {/* Nome da conquista */}
        <div
          style={{
            display: 'flex',
            color: '#ffffff',
            fontSize: '64px',
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1.05,
            marginBottom: '16px',
          }}
        >
          {meta.name}
        </div>

        {/* Linha do usuário */}
        <div style={{ display: 'flex', color: '#8899BB', fontSize: '22px', fontWeight: 600 }}>
          {name} desbloqueou • Nível {level}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'absolute',
            bottom: '48px',
          }}
        >
          <span style={{ color: '#556677', fontSize: '15px' }}>
            Gamifique sua academia, produtividade e finanças
          </span>
          <span
            style={{
              color: accent,
              fontSize: '15px',
              fontWeight: 700,
              background: `${accent}18`,
              padding: '6px 14px',
              borderRadius: '8px',
            }}
          >
            ascendia.app
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Conquista é imutável após desbloqueio — cache longo no CDN/scrapers.
        'Cache-Control': 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000',
      },
    }
  );
}
