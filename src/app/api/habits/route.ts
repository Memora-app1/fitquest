import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).trim().optional(),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
  frequency_per_week: z.number().int().min(1).max(7).optional(),
  reminder_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .nullable()
    .optional(),
});

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  // Soft-delete: marca como inativo em vez de deletar
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('habits DELETE: falha', error);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const { id, name, icon, color, frequency_per_week, reminder_time } = parsed.data;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;
  if (frequency_per_week !== undefined) {
    updates.frequency_per_week = frequency_per_week;
    updates.target_value = frequency_per_week;
  }
  if (reminder_time !== undefined) {
    // Converte 'HH:MM' para 'HH:MM:00' (formato TIME do PG), ou null para desativar
    updates.reminder_time = reminder_time
      ? reminder_time.length === 5
        ? reminder_time + ':00'
        : reminder_time
      : null;
  }

  const { error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('habits PATCH: falha', error);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
