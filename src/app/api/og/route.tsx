/**
 * OG Image dinâmica — card de score compartilhável por usuário.
 * GET /api/og?uid={userId}
 *
 * Gera uma imagem 1200×630 com nível, XP, streak e conquistas.
 * Usada pelo ShareScoreButton para sharing social real (não só texto).
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getLevelInfo } from '@/lib/xp';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  // Dados default para quando não tem uid (landing page sharing)
  let name = 'Ascendia';
  let level = 1;
  let xpTotal = 0;
  let streak = 0;
  let achievements = 0;
  let levelTitle = 'Iniciante';
  let levelEmoji = '🌱';

  if (uid) {
    try {
      const supabase = createServiceClient();
      const [profileRes, achievementsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, level, xp_total, streak_current')
          .eq('id', uid)
          .single(),
        supabase
          .from('user_achievements')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid),
      ]);

      if (profileRes.data) {
        name = (profileRes.data.name as string).split(' ')[0] ?? 'Ascendia';
        level = profileRes.data.level as number;
        xpTotal = profileRes.data.xp_total as number;
        streak = profileRes.data.streak_current as number;
        achievements = achievementsRes.count ?? 0;
        const info = getLevelInfo(level);
        levelTitle = info.title;
        levelEmoji = info.emoji;
      }
    } catch {
      /* usa defaults */
    }
  } else {
    // Overrides via query params (ex.: meta OG do perfil público /u/username,
    // que passa name/level/xp/streak sem fazer round-trip ao banco).
    const nameParam = searchParams.get('name');
    const levelParam = Number(searchParams.get('level'));
    const xpParam = Number(searchParams.get('xp'));
    const streakParam = Number(searchParams.get('streak'));
    const achParam = Number(searchParams.get('achievements'));

    if (nameParam) name = nameParam.split(' ')[0] ?? nameParam;
    if (Number.isFinite(levelParam) && levelParam > 0) level = levelParam;
    if (Number.isFinite(xpParam) && xpParam >= 0) xpTotal = xpParam;
    if (Number.isFinite(streakParam) && streakParam >= 0) streak = streakParam;
    if (Number.isFinite(achParam) && achParam >= 0) achievements = achParam;

    const info = getLevelInfo(level);
    levelTitle = info.title;
    levelEmoji = info.emoji;
  }

  const levelColors: Record<number, string> = {
    1: '#8899BB',
    2: '#7C3AED',
    3: '#3B82F6',
    4: '#00FF88',
    5: '#FF4D00',
    6: '#EC4899',
    7: '#F5C842',
    8: '#F5C842',
  };
  const accentColor = levelColors[level] ?? '#F5C842';

  return new ImageResponse(
    <div
      style={{
        background: '#050914',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 80px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7C3AED, #FF4D00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
          }}
        >
          ⚡
        </div>
        <span
          style={{ color: '#8899BB', fontSize: '18px', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          ASCENDIA
        </span>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '60px', flex: 1 }}>
        {/* Left: user info */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '24px' }}>
          <div>
            <div style={{ color: '#8899BB', fontSize: '16px', marginBottom: '8px' }}>
              Score de {name}
            </div>
            <div style={{ color: '#ffffff', fontSize: '52px', fontWeight: 900, lineHeight: 1.1 }}>
              {levelEmoji} {levelTitle}
            </div>
            <div
              style={{
                color: accentColor,
                fontSize: '18px',
                fontWeight: 700,
                marginTop: '8px',
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}40`,
                borderRadius: '8px',
                padding: '4px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Nível {level} de 8
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'rgba(245,200,66,0.08)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            >
              <span style={{ color: '#F5C842', fontSize: '28px', fontWeight: 900 }}>
                ⚡ {xpTotal.toLocaleString('pt-BR')}
              </span>
              <span style={{ color: '#8899BB', fontSize: '13px', marginTop: '4px' }}>XP Total</span>
            </div>

            {streak > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  background: 'rgba(255,77,0,0.08)',
                  border: '1px solid rgba(255,77,0,0.2)',
                }}
              >
                <span style={{ color: '#FF4D00', fontSize: '28px', fontWeight: 900 }}>
                  🔥 {streak}
                </span>
                <span style={{ color: '#8899BB', fontSize: '13px', marginTop: '4px' }}>
                  dias de streak
                </span>
              </div>
            )}

            {achievements > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                <span style={{ color: '#7C3AED', fontSize: '28px', fontWeight: 900 }}>
                  🏆 {achievements}
                </span>
                <span style={{ color: '#8899BB', fontSize: '13px', marginTop: '4px' }}>
                  conquistas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: big level display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accentColor}15 0%, rgba(13,24,41,0.98) 70%)`,
            border: `3px solid ${accentColor}50`,
            boxShadow: `0 0 60px ${accentColor}20`,
          }}
        >
          <div style={{ fontSize: '64px', lineHeight: 1 }}>{levelEmoji}</div>
          <div
            style={{
              color: accentColor,
              fontSize: '42px',
              fontWeight: 900,
              marginTop: '8px',
              lineHeight: 1,
            }}
          >
            {level}
          </div>
          <div style={{ color: '#8899BB', fontSize: '13px', marginTop: '4px' }}>nível</div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ color: '#556677', fontSize: '14px' }}>
          Gamifique sua academia, produtividade e finanças
        </span>
        <span
          style={{
            color: accentColor,
            fontSize: '16px',
            fontWeight: 700,
            background: `${accentColor}15`,
            padding: '6px 16px',
            borderRadius: '8px',
          }}
        >
          ascendia.app
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
