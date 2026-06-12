import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { MobileHeader } from './mobile-header';
import { PushPrompt } from '@/components/push-prompt';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { PullToRefresh } from '@/components/pull-to-refresh';
import { ScrollRestoration } from '@/components/scroll-restoration';
import { MiniCoachFab } from './mini-coach-fab';
import { MobileFab } from './mobile-fab';
import { LevelUpCelebration } from '@/components/level-up-celebration';
import { PerfectDayOverlay } from '@/components/perfect-day-overlay';
import { AchievementToast } from '@/components/achievement-toast';
import { DailyLoginReward } from '@/components/dashboard/daily-login-reward';
import { AppShellRealtimeProvider } from '@/hooks/use-realtime-context';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, notifRes, criticalRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, xp_total, level, streak_current, onboarding_completed, perfect_days')
      .eq('id', user.id)
      .single(),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
    // Tarefas críticas (urgente + importante) pendentes — badge na tab Tarefas
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('urgent', true)
      .eq('important', true)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'archived'),
  ]);

  const profile = profileRes.data;
  if (!profile) redirect('/onboarding');
  if (!profile.onboarding_completed) redirect('/onboarding');

  const unreadCount = notifRes.count ?? 0;
  const criticalTaskCount = criticalRes.count ?? 0;

  return (
    <AppShellRealtimeProvider
      id={profile.id}
      initial={{
        xp_total: profile.xp_total,
        level: profile.level,
        streak_current: profile.streak_current,
      }}
    >
      <div className="flex min-h-[100dvh] min-h-screen">
        <Sidebar profile={profile} unreadNotifications={unreadCount} />
        <div className="flex min-h-[100dvh] min-h-screen flex-1 flex-col">
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
        <BottomNav criticalTasks={criticalTaskCount} />
        <MobileFab />
        <PushPrompt />
        <PwaInstallPrompt />
        <MiniCoachFab />
        <LevelUpCelebration />
        <PerfectDayOverlay />
        <AchievementToast />
        <DailyLoginReward />
        <ScrollRestoration />
      </div>
    </AppShellRealtimeProvider>
  );
}
