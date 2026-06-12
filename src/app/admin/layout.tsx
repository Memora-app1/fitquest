import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/admin';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = { title: 'Admin — Ascendia' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const session = await getAdminSession(user);
  if (!session) redirect('/dashboard');

  return (
    <AdminShell adminEmail={session.email} adminRole={session.role}>
      {children}
    </AdminShell>
  );
}
