import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface SearchResult {
  id: string;
  type: 'task' | 'habit' | 'workout' | 'transaction' | 'goal' | 'finance_goal';
  title: string;
  subtitle?: string;
  href: string;
  icon: string;
  color: string;
  meta?: string;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Run all searches in parallel
  const [tasksRes, habitsRes, workoutsRes, transactionsRes, goalsRes, financeGoalsRes] =
    await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, urgent, important, status, due_date')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .ilike('title', `%${q}%`)
        .order('updated_at', { ascending: false })
        .limit(5),

      supabase
        .from('habits')
        .select('id, name, icon, color, xp_per_completion')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .ilike('name', `%${q}%`)
        .limit(4),

      supabase
        .from('workouts')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .ilike('title', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(4),

      supabase
        .from('transactions')
        .select('id, description, amount, type, transaction_date')
        .eq('user_id', user.id)
        .ilike('description', `%${q}%`)
        .order('transaction_date', { ascending: false })
        .limit(4),

      supabase
        .from('goals')
        .select('id, title, target_value, current_value, unit')
        .eq('user_id', user.id)
        .ilike('title', `%${q}%`)
        .limit(3),

      supabase
        .from('finance_goals')
        .select('id, title, icon, target_amount, current_amount, status')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .ilike('title', `%${q}%`)
        .limit(3),
    ]);

  const results: SearchResult[] = [];

  // Tasks
  for (const t of tasksRes.data ?? []) {
    const priority =
      t.urgent && t.important
        ? 'Urgente & Importante'
        : t.urgent
          ? 'Urgente'
          : t.important
            ? 'Importante'
            : null;
    results.push({
      id: t.id,
      type: 'task',
      title: t.title,
      subtitle:
        priority ??
        (t.due_date ? `Prazo: ${new Date(t.due_date).toLocaleDateString('pt-BR')}` : 'Tarefa'),
      href: '/tarefas',
      icon: t.status === 'done' ? '✅' : t.urgent && t.important ? '🔴' : '✓',
      color: t.status === 'done' ? '#00FF88' : t.urgent && t.important ? '#EF4444' : '#7C3AED',
      meta: t.status === 'done' ? 'Feita' : t.status === 'doing' ? 'Em andamento' : 'Pendente',
    });
  }

  // Habits
  for (const h of habitsRes.data ?? []) {
    results.push({
      id: h.id,
      type: 'habit',
      title: h.name,
      subtitle: `+${h.xp_per_completion} XP por registro`,
      href: '/habitos',
      icon: h.icon ?? '🎯',
      color: h.color ?? '#FF4D00',
      meta: 'Hábito',
    });
  }

  // Workouts
  for (const w of workoutsRes.data ?? []) {
    results.push({
      id: w.id,
      type: 'workout',
      title: w.title,
      subtitle: new Date(w.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      href: `/treinos/${w.id}`,
      icon: '💪',
      color: '#00FF88',
      meta: 'Treino',
    });
  }

  // Transactions
  for (const t of transactionsRes.data ?? []) {
    const isIncome = t.type === 'income';
    results.push({
      id: t.id,
      type: 'transaction',
      title: t.description,
      subtitle: new Date(t.transaction_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      }),
      href: '/financas/transacoes',
      icon: isIncome ? '💰' : '💳',
      color: isIncome ? '#00FF88' : '#3B82F6',
      meta: `${isIncome ? '+' : '-'}R$ ${Math.abs(t.amount ?? 0)
        .toFixed(2)
        .replace('.', ',')}`,
    });
  }

  // Goals
  for (const g of goalsRes.data ?? []) {
    const pct =
      g.target_value > 0 ? Math.min(Math.round((g.current_value / g.target_value) * 100), 100) : 0;
    results.push({
      id: g.id,
      type: 'goal',
      title: g.title,
      subtitle: `${g.current_value} / ${g.target_value} ${g.unit ?? ''}`.trim(),
      href: '/metas',
      icon: '🎯',
      color: pct >= 100 ? '#00FF88' : '#F5C842',
      meta: `${pct}%`,
    });
  }

  // Finance Goals
  for (const g of financeGoalsRes.data ?? []) {
    const pct =
      g.target_amount > 0
        ? Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100)
        : 0;
    results.push({
      id: g.id,
      type: 'finance_goal',
      title: `${g.icon ?? '💰'} ${g.title}`,
      subtitle: `R$ ${Number(g.current_amount).toLocaleString('pt-BR')} / R$ ${Number(g.target_amount).toLocaleString('pt-BR')}`,
      href: '/financas/metas',
      icon: g.icon ?? '💰',
      color: pct >= 100 ? '#00FF88' : '#F5C842',
      meta: `${pct}%`,
    });
  }

  return NextResponse.json({ results });
}
