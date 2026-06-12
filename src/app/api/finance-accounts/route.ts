import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: z.enum(['checking', 'savings', 'credit_card', 'cash', 'investment']),
  icon: z.string().optional(),
  color: z.string().default('#7C3AED'),
  current_balance: z.number().default(0),
  credit_limit: z.number().positive().nullable().optional(),
  closing_day: z.number().int().min(1).max(31).nullable().optional(),
  due_day: z.number().int().min(1).max(31).nullable().optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).trim().optional(),
  color: z.string().optional(),
  current_balance: z.number().optional(),
  credit_limit: z.number().positive().nullable().optional(),
  closing_day: z.number().int().min(1).max(31).nullable().optional(),
  due_day: z.number().int().min(1).max(31).nullable().optional(),
  is_active: z.boolean().optional(),
});

const TYPE_ICONS: Record<string, string> = {
  checking: '🏦',
  savings: '🐷',
  credit_card: '💳',
  cash: '💵',
  investment: '📈',
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('finance_accounts')
    .select(
      'id, name, type, icon, color, current_balance, credit_limit, closing_day, due_day, is_active, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at');

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  return NextResponse.json({ accounts: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, icon, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from('finance_accounts')
    .insert({
      ...rest,
      type,
      icon: icon ?? TYPE_ICONS[type] ?? '🏦',
      user_id: user.id,
    })
    .select(
      'id, name, type, icon, color, current_balance, credit_limit, closing_day, due_day, is_active, created_at'
    )
    .single();

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  return NextResponse.json({ account: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...updates } = parsed.data;

  const { data, error } = await supabase
    .from('finance_accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(
      'id, name, type, icon, color, current_balance, credit_limit, closing_day, due_day, is_active, created_at'
    )
    .single();

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  return NextResponse.json({ account: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const { error } = await supabase
    .from('finance_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  return NextResponse.json({ success: true });
}
