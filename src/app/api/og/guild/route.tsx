/**
 * OG Image dinâmica — card de guild compartilhável para recrutamento.
 * GET /api/og/guild?gid={guildId}
 *
 * Gera imagem 1200×630 com nome/tag/lema da guild + membros e XP semanal.
 * Usada pelo ShareGuildButton para convidar novos membros (crescimento).
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gid = searchParams.get('gid');

  let name = 'Sua Guild';
  let tag = 'GUILD';
  let motto: string | null = 'Junte-se e suba de nível em equipe';
  let emoji = '🛡️';
  let memberCount = 0;
  let maxMembers = 20;
  let weeklyXp = 0;

  if (gid && UUID_RE.test(gid)) {
    try {
      const supabase = createServiceClient();
      const [{ data: guild }, { count }] = await Promise.all([
        supabase
          .from('guilds')
          .select('name, tag, motto, avatar_emoji, max_members, weekly_xp')
          .eq('id', gid)
          .single(),
        supabase
          .from('guild_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('guild_id', gid),
      ]);
      if (guild) {
        name = (guild.name as string) ?? name;
        tag = (guild.tag as string) ?? tag;
        motto = (guild.motto as string | null) ?? null;
        emoji = (guild.avatar_emoji as string) ?? emoji;
        maxMembers = (guild.max_members as number) ?? maxMembers;
        weeklyXp = (guild.weekly_xp as number) ?? 0;
        memberCount = count ?? 0;
      }
    } catch {
      /* usa defaults */
    }
  }

  const accent = '#7C3AED';

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
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '440px',
            height: '440px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,77,0,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
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
            ASCENDIA · GUILDS
          </span>
        </div>

        {/* Emoji da guild */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '160px',
            height: '160px',
            borderRadius: '36px',
            background: `radial-gradient(circle, ${accent}22 0%, rgba(13,24,41,0.98) 72%)`,
            border: `4px solid ${accent}`,
            boxShadow: `0 0 70px ${accent}40`,
            fontSize: '84px',
            lineHeight: 1,
            marginBottom: '28px',
          }}
        >
          {emoji}
        </div>

        {/* Tag */}
        <div
          style={{
            display: 'flex',
            color: accent,
            fontSize: '20px',
            fontWeight: 900,
            letterSpacing: '0.25em',
            marginBottom: '8px',
          }}
        >
          [{tag}]
        </div>

        {/* Nome */}
        <div
          style={{
            display: 'flex',
            color: '#ffffff',
            fontSize: '58px',
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1.05,
            marginBottom: motto ? '10px' : '24px',
          }}
        >
          {name}
        </div>

        {motto && (
          <div
            style={{
              display: 'flex',
              color: '#8899BB',
              fontSize: '22px',
              fontStyle: 'italic',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            “{motto}”
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '14px 28px',
              borderRadius: '16px',
              background: `${accent}14`,
              border: `1px solid ${accent}33`,
            }}
          >
            <span style={{ color: '#fff', fontSize: '30px', fontWeight: 900 }}>
              👥 {memberCount}/{maxMembers}
            </span>
            <span style={{ color: '#8899BB', fontSize: '13px', marginTop: '4px' }}>membros</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '14px 28px',
              borderRadius: '16px',
              background: 'rgba(245,200,66,0.1)',
              border: '1px solid rgba(245,200,66,0.25)',
            }}
          >
            <span style={{ color: '#F5C842', fontSize: '30px', fontWeight: 900 }}>
              ⚡ {weeklyXp.toLocaleString('pt-BR')}
            </span>
            <span style={{ color: '#8899BB', fontSize: '13px', marginTop: '4px' }}>XP na semana</span>
          </div>
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
          <span style={{ color: '#556677', fontSize: '15px' }}>Entre na guild e suba de nível em equipe</span>
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
    }
  );
}
