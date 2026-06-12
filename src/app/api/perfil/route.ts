import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(300).trim().optional(),
  weekly_target: z.number().int().min(1).max(7).optional(),
  equipped_title: z.string().max(100).nullable().optional(),
  equipped_frame: z.string().max(100).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = updateProfileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.avatar_url !== undefined) updates.avatar_url = parsed.data.avatar_url;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.weekly_target !== undefined) updates.weekly_target = parsed.data.weekly_target;
  if (parsed.data.equipped_title !== undefined) updates.equipped_title = parsed.data.equipped_title;
  if (parsed.data.equipped_frame !== undefined) updates.equipped_frame = parsed.data.equipped_frame;

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

  if (error) {
    console.error('perfil: falha ao atualizar', error);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json()) as { action?: string; password?: string };

  if (body.action === 'change_password') {
    const passwordSchema = z.string().min(6).max(72);
    const parsed = passwordSchema.safeParse(body.password);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_password' }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) {
      console.error('perfil: falha ao trocar senha', error);
      return NextResponse.json({ error: 'password_change_failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
