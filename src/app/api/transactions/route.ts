import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { XP_REWARDS } from '@/lib/xp';
import { grantXP, tryUnlockAchievement } from '@/lib/xp-server';
import { randomUUID } from 'crypto';

const createSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  type: z.enum(['expense', 'income', 'transfer']),
  description: z.string().min(1).max(200),
  notes: z.string().optional(),
  transaction_date: z.string(),
  is_paid: z.boolean().default(true),
  installments: z.number().int().min(1).max(60).default(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { installments, ...base } = parsed.data;
  const installmentAmount = base.amount / installments;
  const groupId = installments > 1 ? randomUUID() : null;

  // Gerar todas as parcelas
  const startDate = new Date(base.transaction_date);
  const rows = Array.from({ length: installments }, (_, i) => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    return {
      ...base,
      user_id: user.id,
      amount: installmentAmount,
      transaction_date: d.toISOString().split('T')[0]!,
      is_installment: installments > 1,
      installment_current: installments > 1 ? i + 1 : null,
      installment_total: installments > 1 ? installments : null,
      installment_group_id: groupId,
      is_paid: i === 0 ? base.is_paid : false, // só a primeira como paga (se aplicável)
    };
  });

  const { data, error } = await supabase.from('transactions').insert(rows).select();
  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });

  // Atualizar saldo da conta (só primeira parcela paga)
  if (base.is_paid) {
    const delta = base.type === 'expense' ? -installmentAmount : installmentAmount;
    const { data: acc } = await supabase
      .from('finance_accounts')
      .select('current_balance')
      .eq('id', base.account_id)
      .eq('user_id', user.id)
      .single();
    if (acc) {
      await supabase
        .from('finance_accounts')
        .update({ current_balance: Number(acc.current_balance) + delta })
        .eq('id', base.account_id);
    }
  }

  // XP
  await grantXP(
    user.id,
    XP_REWARDS.TRANSACTION_LOGGED,
    `Transação: ${base.description}`,
    'transaction',
    data?.[0]?.id
  );

  // Finance streak — atualiza consecutividade de dias com transações
  const todayStr = new Date().toISOString().split('T')[0]!;
  const { data: prof } = await supabase
    .from('profiles')
    .select('finance_streak, last_finance_date')
    .eq('id', user.id)
    .single();
  if (prof) {
    const lastDate = prof.last_finance_date as string | null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;
    if (lastDate !== todayStr) {
      const newStreak = lastDate === yesterday ? ((prof.finance_streak as number) ?? 0) + 1 : 1;
      await supabase
        .from('profiles')
        .update({ finance_streak: newStreak, last_finance_date: todayStr })
        .eq('id', user.id);
      if (newStreak === 7)
        await grantXP(user.id, XP_REWARDS.FINANCE_STREAK_7, 'Finance Streak 7 dias', 'bonus');
      if (newStreak === 30)
        await grantXP(user.id, XP_REWARDS.FINANCE_STREAK_30, 'Finance Streak 30 dias', 'bonus');
    }
  }

  // Conquistas de transação
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const achievementsUnlocked: string[] = [];
  for (const [n, slug] of [
    [installments, 'first_transaction'],
    [50, 'transactions_50'],
    [200, 'transactions_200'],
  ] as [number, string][]) {
    if (count === n && (await tryUnlockAchievement(user.id, slug))) {
      achievementsUnlocked.push(slug);
    }
  }

  return NextResponse.json({ transactions: data, success: true, achievementsUnlocked });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('transactions')
    .select(
      '*, account:finance_accounts(name, icon), category:finance_categories(name, icon, color)'
    )
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  return NextResponse.json({ transactions: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    id?: string;
    is_paid?: boolean;
    description?: string;
    amount?: number;
  };
  if (!body.id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  // Fetch current state to detect is_paid change
  const { data: current } = await supabase
    .from('transactions')
    .select('is_paid, transaction_date')
    .eq('id', body.id)
    .eq('user_id', user.id)
    .single();

  const allowed: Record<string, unknown> = {};
  if (body.is_paid !== undefined) {
    allowed.is_paid = body.is_paid;
    if (body.is_paid) allowed.paid_at = new Date().toISOString();
  }
  if (body.description !== undefined) allowed.description = String(body.description).slice(0, 200);
  if (body.amount !== undefined) {
    const amt = Number(body.amount);
    if (isNaN(amt)) return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
    allowed.amount = amt;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(allowed)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });

  // Grant XP when marking as paid (first time)
  let xpEarned = 0;
  if (body.is_paid && current && !current.is_paid) {
    // Check if paid on time (transaction_date >= today or within past 3 days grace period)
    const txDate = new Date(current.transaction_date);
    const today = new Date();
    const graceDays = 3;
    const isOnTime = (today.getTime() - txDate.getTime()) / 86400000 <= graceDays;

    if (isOnTime) {
      const result = await grantXP(
        user.id,
        XP_REWARDS.BILL_PAID_ON_TIME,
        'Conta paga em dia 💳',
        'transaction',
        body.id
      );
      xpEarned = result.xpEarned;
    }

    // zero_debt: verifica se não há mais despesas não pagas
    const { count: unpaidCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_paid', false);

    if ((unpaidCount ?? 0) === 0) {
      await tryUnlockAchievement(user.id, 'zero_debt');
    }
  }

  return NextResponse.json({ transaction: data, xpEarned });
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
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  return NextResponse.json({ success: true });
}
