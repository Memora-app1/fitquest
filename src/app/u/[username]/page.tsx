import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getLevelInfo, getXpProgressToNextLevel, getLeagueDivision } from '@/lib/xp'
import { Trophy, Flame, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, level, xp_total, streak_current')
    .ilike('name', username.replace(/-/g, ' '))
    .maybeSingle()

  if (!profile) return { title: 'Perfil não encontrado — Ascendia' }

  const levelInfo = getLevelInfo(profile.level as number)
  return {
    title: `${profile.name} — Nível ${profile.level} ${levelInfo.title} | Ascendia`,
    description: `${profile.name} acumulou ${(profile.xp_total as number).toLocaleString('pt-BR')} XP e tem ${profile.streak_current} dias de sequência no Ascendia.`,
    openGraph: {
      title: `${profile.name} no Ascendia`,
      description: `Nível ${profile.level} · ${(profile.xp_total as number).toLocaleString('pt-BR')} XP · ${profile.streak_current} dias de streak`,
      images: [`/api/og?name=${encodeURIComponent(profile.name as string)}&level=${profile.level}&xp=${profile.xp_total}&streak=${profile.streak_current}`],
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = createServiceClient()

  // Busca por nome aproximado (slug de URL)
  const nameQuery = username.replace(/-/g, ' ')
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, level, xp_total, streak_current, streak_longest, perfect_days, avatar_url, equipped_title')
    .ilike('name', nameQuery)
    .maybeSingle()

  if (!profile) notFound()

  const levelInfo = getLevelInfo(profile.level as number)
  const progress  = getXpProgressToNextLevel(profile.xp_total as number)

  // Conquistas desbloqueadas
  const { data: unlockedData } = await supabase
    .from('user_achievements')
    .select('achievement_id, achievements(name, icon, rarity)')
    .eq('user_id', profile.id)
    .order('unlocked_at', { ascending: false })
    .limit(6)

  const achievements = (unlockedData ?? []).map(ua => {
    const ach = (Array.isArray(ua.achievements) ? ua.achievements[0] : ua.achievements) as { name: string; icon: string; rarity: string } | null
    return ach
  }).filter(Boolean)

  // Ranking posição
  const { count: aboveCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('xp_total', profile.xp_total as number)
  const position = (aboveCount ?? 0) + 1

  const { count: totalPlayers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
  const division = getLeagueDivision(position, totalPlayers ?? 1)

  const levelColors: Record<number, string> = {
    1: '#8899BB', 2: '#7C3AED', 3: '#3B82F6', 4: '#00FF88',
    5: '#FF4D00', 6: '#EC4899', 7: '#F5C842', 8: '#F5C842',
  }
  const levelColor = levelColors[profile.level as number] ?? '#F5C842'
  const initials = (profile.name as string).split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="min-h-screen" style={{ background: '#050914' }}>
      {/* Navbar mínima */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(5,9,20,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" className="heading-display text-xl gradient-text">⚡ Ascendia</Link>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #FF4D00)', color: '#fff' }}
        >
          Criar conta grátis
        </Link>
      </nav>

      <div className="pt-20 pb-12 px-4 max-w-xl mx-auto space-y-6">

        {/* Hero */}
        <div
          className="rounded-2xl p-6 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${levelColor}10 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.06) 100%)`,
            border: `1px solid ${levelColor}25`,
          }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
            style={{ background: `${levelColor}10` }} />
          <div className="relative z-10 space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
                style={{ background: `${levelColor}20`, border: `3px solid ${levelColor}50` }}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url as string}
                    alt={profile.name as string}
                    width={80}
                    height={80}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span style={{ color: levelColor }}>{initials}</span>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black">{profile.name as string}</h1>
              {profile.equipped_title && (
                <p className="text-sm font-bold mt-0.5" style={{ color: levelColor }}>{profile.equipped_title as string}</p>
              )}
              <p className="text-text-secondary text-sm mt-1">
                {levelInfo.emoji} Nível {profile.level} — {levelInfo.title}
              </p>
            </div>

            {/* XP progress */}
            {progress.needed > 0 && (
              <div className="space-y-1">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress.percentage}%`,
                      background: `linear-gradient(90deg, ${levelColor}99, ${levelColor})`,
                    }}
                  />
                </div>
                <p className="text-xs text-text-muted">{progress.percentage}% para o próximo nível</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'XP Total', value: (profile.xp_total as number).toLocaleString('pt-BR'), icon: <Zap size={16} style={{ color: '#F5C842' }} fill="currentColor" />, color: '#F5C842' },
            { label: 'Streak Atual', value: `${profile.streak_current} dias`, icon: <Flame size={16} style={{ color: '#FF4D00' }} fill="currentColor" />, color: '#FF4D00' },
            { label: 'Recorde', value: `${profile.streak_longest} dias`, icon: <Trophy size={16} style={{ color: '#7C3AED' }} />, color: '#7C3AED' },
            { label: 'Dias Perfeitos', value: `${profile.perfect_days}`, icon: <Star size={16} style={{ color: '#00FF88' }} />, color: '#00FF88' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-xl p-4"
              style={{ background: `${stat.color}0D`, border: `1px solid ${stat.color}20` }}
            >
              <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs text-text-muted">{stat.label}</span></div>
              <div className="text-xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Division */}
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: `rgba(${division.rgb},0.08)`, border: `1px solid rgba(${division.rgb},0.2)` }}
        >
          <span className="text-3xl">{division.emoji}</span>
          <div>
            <p className="font-bold" style={{ color: division.color }}>{division.name}</p>
            <p className="text-xs text-text-muted">Posição #{position.toLocaleString('pt-BR')} no ranking global</p>
          </div>
        </div>

        {/* Conquistas recentes */}
        {achievements.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Conquistas recentes</h2>
            <div className="grid grid-cols-3 gap-2">
              {achievements.map((ach, i) => ach && (
                <div
                  key={i}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <div className="text-[10px] text-text-secondary line-clamp-2">{ach.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="rounded-2xl p-6 text-center space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.08) 100%)',
            border: '1px solid rgba(124,58,237,0.3)',
          }}
        >
          <div>
            <p className="font-black text-lg">Quer chegar onde {(profile.name as string).split(' ')[0]} chegou?</p>
            <p className="text-text-secondary text-sm mt-1">
              Gamifique sua academia, tarefas e finanças. 7 dias grátis.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 rounded-2xl font-black text-base transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #FF4D00)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
            }}
          >
            Criar conta grátis →
          </Link>
          <p className="text-xs text-text-muted">Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </div>
    </div>
  )
}
