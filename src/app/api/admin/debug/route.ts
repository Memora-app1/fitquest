import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/admin';

// Rota de diagnóstico — restrita a admins autenticados
// Acessível em /api/admin/debug
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'not_authenticated' }, { status: 401 });
  }

  const adminSession = await getAdminSession(user);
  if (!adminSession) {
    return NextResponse.json({ ok: false, error: 'not_authorized' }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({
      ok: false,
      user_id: user.id,
      email: user.email,
      error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel',
      fix: 'Adicione SUPABASE_SERVICE_ROLE_KEY nas Environment Variables do Vercel',
    });
  }

  const db = createServiceClient();

  // Verifica se a tabela admin_roles existe e tem a entrada do usuário
  const { data: role, error: roleError } = await db
    .from('admin_roles')
    .select('role, granted_at, notes')
    .eq('user_id', user.id)
    .maybeSingle();

  // Conta quantas linhas existem na tabela
  const { count } = await db.from('admin_roles').select('id', { count: 'exact', head: true });

  if (roleError) {
    return NextResponse.json({
      ok: false,
      user_id: user.id,
      email: user.email,
      error: roleError.message,
      hint: roleError.hint,
      fix: 'Verifique se a migration 010-admin-platform.sql foi executada no Supabase',
      total_rows: count,
    });
  }

  if (!role) {
    return NextResponse.json({
      ok: false,
      user_id: user.id,
      email: user.email,
      error: 'Usuário não encontrado na tabela admin_roles',
      total_rows: count,
      fix: 'Execute o SQL abaixo no Supabase SQL Editor',
      sql: `INSERT INTO admin_roles (user_id, role, notes)
VALUES ('${user.id}', 'super_admin', 'Bootstrap manual')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';`,
    });
  }

  return NextResponse.json({
    ok: true,
    user_id: user.id,
    email: user.email,
    role: role.role,
    granted_at: role.granted_at,
    notes: role.notes,
    total_rows: count,
    message: 'Admin configurado corretamente! Se o painel não abre, aguarde o redeploy.',
  });
}
