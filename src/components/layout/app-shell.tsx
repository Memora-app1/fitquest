/**
 * Layout compartilhado para todas as páginas autenticadas
 *
 * Como NÃO usamos a notação (app) para evitar problemas com Next 15,
 * cada página individualmente importa este componente, OU criamos
 * um group layout em uma pasta com (app)/layout.tsx
 *
 * Vou usar abordagem alternativa: cada página chama <AppShell>
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { MobileHeader } from './mobile-header'
import { PushPrompt } from '@/components/push-prompt'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { ScrollRestoration } from '@/components/scroll-restoration'
import { MiniCoachFab } from './mini-coach-fab'
import { MobileFab } from './mobile-fab'
import { LevelUpCelebration } from '@/components/level-up-celebration'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [profileRes, notifRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, xp_total, level, streak_current, onboarding_completed, perfect_days')
      .eq('id', user.id)
      .single(),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  const profile = profileRes.data

  if (!profile) {
    redirect('/onboarding')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  const unreadCount = notifRes.count ?? 0

  return (
    <div className="flex min-h-screen min-h-[100dvh]">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh]">
        <MobileHeader
          name={profile.name}
          level={profile.level}
          xpTotal={profile.xp_total}
          streakCurrent={profile.streak_current}
          unreadNotifications={unreadCount}
        />
        <main className="flex-1 pb-20 md:pb-0">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
      </div>
      <BottomNav />
      <MobileFab />
      <PushPrompt />
      <PwaInstallPrompt />
      <MiniCoachFab />
      <LevelUpCelebration />
      <ScrollRestoration />
    </div>
  )
}
