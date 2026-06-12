import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  theme_emoji: z.string().max(4).optional(),
  tagline: z.string().max(200).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'admin')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const form = await request.formData();
  const parsed = CreateSchema.safeParse({
    name: form.get('name'),
    theme_emoji: form.get('theme_emoji') || undefined,
    tagline: form.get('tagline') || undefined,
    start_date: form.get('start_date'),
    end_date: form.get('end_date'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL('/admin/gamificacao/temporadas?error=invalid', request.url)
    );
  }

  const db = createServiceClient();

  await db.from('seasons').insert({
    name: parsed.data.name,
    theme_emoji: parsed.data.theme_emoji ?? '⚡',
    tagline: parsed.data.tagline ?? null,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    is_active: false,
    tiers: [],
  });

  await auditLog({
    adminId: session.userId,
    adminRole: session.role,
    action: 'season.create',
    targetType: 'season',
    payload: { name: parsed.data.name, start: parsed.data.start_date, end: parsed.data.end_date },
  });

  return NextResponse.redirect(new URL('/admin/gamificacao/temporadas', request.url));
}
