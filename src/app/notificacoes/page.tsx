import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { NotificacoesClient } from '@/components/notificacoes/notificacoes-client';

export const metadata: Metadata = {
  title: 'Notificações',
  description: 'Gerencie suas notificações e preferências de push no Ascendia.',
};

export const dynamic = 'force-dynamic';

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Notificações recentes (últimas 30)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, icon, action_url, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  // Subscriptions ativas
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, created_at')
    .eq('user_id', user.id)
    .limit(50);

  return (
    <AppShell>
      <NotificacoesClient
        notifications={(notifications ?? []).map((n) => ({
          id: n.id as string,
          type: n.type as string,
          title: n.title as string,
          body: n.body as string | null,
          icon: n.icon as string | null,
          action_url: n.action_url as string | null,
          read_at: n.read_at as string | null,
          created_at: n.created_at as string,
        }))}
        pushEnabled={(subs ?? []).length > 0}
        deviceCount={(subs ?? []).length}
      />
    </AppShell>
  );
}
