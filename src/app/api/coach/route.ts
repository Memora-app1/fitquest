import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { WATER_GOAL_ML, DAILY_COACH_MESSAGE_LIMIT } from '@/lib/constants';

export const maxDuration = 60;

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

// DAILY_COACH_MESSAGE_LIMIT agora vem de @/lib/constants como DAILY_COACH_MESSAGE_LIMIT

// ════════ SYSTEM PROMPT ESTÁTICO ════════
// Definido como constante de módulo — NUNCA contém dados do usuário.
// Isso garante que o conteúdo seja IDÊNTICO entre requests e o
// prompt caching da Anthropic funcione corretamente (~70% de economia).
const STATIC_COACH_PROMPT = `Você é o Coach do Ascendia — o assistente pessoal mais contextualizado do Brasil. Você conhece o usuário melhor do que qualquer app de fitness, produtividade ou finanças separado — porque você vê TUDO.

## SEU PERFIL COMO COACH
Você é uma mistura de:
- Personal trainer brasileiro (direto, sem papas na língua, celebra cada PR)
- Terapeuta financeiro (analisa padrões, não julga, sugere ajustes concretos)
- Coach de produtividade (prioriza, elimina ruído, foca no que move a agulha)
- Amigo que acompanha a jornada (usa o nome, lembra do histórico, celebra vitórias)

## COMO ANALISAR (CRUZAMENTOS OBRIGATÓRIOS)
Antes de responder, mentalmente cruze os dados do contexto:

**Fitness × Saúde:**
- Recovery baixo + treino pesado ontem → sugira descanso ativo, não mais treino
- Qualidade do sono < 3 + energia < 3 → não é dia de máxima intensidade
- Streak de hábitos alto → celebre E sugira expansão

**Finanças × Metas:**
- Gastos acima da média + meta financeira em andamento → foque no gargalo
- Conta negativada + parcelas futuras → plano de ação, não diagnóstico
- Economia positiva → reconheça e sugira próximo passo

**Produtividade × Energia:**
- Estresse alto (4-5) + muitas tarefas críticas → priorize 1, não 5
- Sem tarefas criadas + hábitos em dia → ótimo momento para planejar a semana
- Tarefas atrasadas + sono ruim → não é falha de caráter, é biologia

**Gamificação × Motivação:**
- Próximo de subir de nível → mencione quanto falta, crie urgência positiva
- Streak em risco (>20h sem atividade) → use perda aversiva com empatia, não pressão
- Conquista próxima de desbloquear → mencione como easter egg

## SEU ESTILO
- **Tom:** amigo coach, não bot corporativo. Use "você", "cara", "mano" quando natural.
- **Comprimento:** curto por padrão. 2-3 parágrafos MAX. Se a pergunta for simples, 1 parágrafo.
- **Sem clichês:** nunca diga "ótima pergunta!", "como posso ajudar?", "lembre-se de se hidratar".
- **Ação obrigatória:** sempre feche com UMA ação específica e imediata. Não duas.
- **Números reais:** use os dados do contexto, nunca genéricos.
- **Celebre wins:** se o usuário fez algo positivo nos dados, reconheça antes de sugerir.

Responda SEMPRE em português brasileiro. Nunca em inglês.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Rate limit: máx 50 mensagens/usuário/dia (custo Anthropic)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', todayStart.toISOString());
  if ((count ?? 0) >= DAILY_COACH_MESSAGE_LIMIT) {
    return NextResponse.json(
      { error: 'daily_limit_reached', limit: DAILY_COACH_MESSAGE_LIMIT },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { conversationId, message } = parsed.data;

  // Verificar que a conversa pertence ao user autenticado
  const { data: convo } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!convo) return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 });

  // Buscar contexto completo do usuário em paralelo
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today!.substring(0, 7) + '-01';

  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return d.toISOString().split('T')[0]!;
  })();

  const [
    profileRes,
    habitsRes,
    todayLogsRes,
    lastWorkoutRes,
    pendingTasksRes,
    monthTxRes,
    activeGoalsRes,
    historyRes,
    waterTodayRes,
    sleepLastNightRes,
    moodTodayRes,
    recentAchievementsRes,
    weekXpRes,
    financeGoalsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'name, level, xp_total, streak_current, streak_longest, primary_goal, perfect_days, streak_freezes'
      )
      .eq('id', user.id)
      .single(),
    supabase.from('habits').select('id, name').eq('user_id', user.id).eq('is_active', true).limit(50),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('logged_date', today!).limit(50),
    supabase
      .from('workouts')
      .select('title, started_at, total_sets, total_volume_kg, xp_earned')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('title, urgent, important, due_date')
      .eq('user_id', user.id)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'archived')
      .order('urgent', { ascending: false })
      .limit(10),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('transaction_date', monthStart)
      .eq('is_paid', true)
      .limit(200),
    supabase
      .from('goals')
      .select('title, current_value, target_value, unit, deadline')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(20),
    supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at')
      .limit(20),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('date', today!),
    supabase
      .from('sleep_logs')
      .select('duration_hours, quality')
      .eq('user_id', user.id)
      .gte('date', new Date(Date.now() - 86400000).toISOString().split('T')[0]!)
      .maybeSingle(),
    supabase
      .from('mood_logs')
      .select('mood, energy, stress')
      .eq('user_id', user.id)
      .eq('date', today!)
      .maybeSingle(),
    supabase
      .from('user_achievements')
      .select('unlocked_at, achievement_id, achievements(name, xp_reward)')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
      .limit(3),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', weekStart + 'T00:00:00')
      .limit(500),
    supabase
      .from('finance_goals')
      .select('title, current_amount, target_amount, deadline')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(3),
  ]);

  const profile = profileRes.data;
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 });

  const monthIncome = (monthTxRes.data ?? [])
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = (monthTxRes.data ?? [])
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const habits = habitsRes.data ?? [];
  const loggedToday = new Set((todayLogsRes.data ?? []).map((l) => l.habit_id));
  const habitsMissing = habits.filter((h) => !loggedToday.has(h.id)).map((h) => h.name);
  const waterToday = (waterTodayRes.data ?? []).reduce(
    (s, l) => s + ((l.amount_ml as number) ?? 0),
    0
  );
  const xpThisWeek = (weekXpRes.data ?? []).reduce((s, t) => s + ((t.amount as number) ?? 0), 0);

  const recentAchievements = (recentAchievementsRes.data ?? []).map((ua) => {
    const raw = ua.achievements as unknown;
    const ach =
      (Array.isArray(raw)
        ? (raw as { name: string; xp_reward: number }[])[0]
        : (raw as { name: string; xp_reward: number } | null)) ?? null;
    return { name: ach?.name ?? '?', xp: ach?.xp_reward ?? 0, date: ua.unlocked_at };
  });

  // ════════ CONTEXTO DINÂMICO ════════
  // Este bloco muda a cada request — NÃO cachear.
  // O bloco estático acima é cacheado pela Anthropic → economia real de tokens.
  const contextSnapshot = {
    user: {
      name: profile.name,
      level: profile.level,
      xp_total: profile.xp_total,
      xp_this_week: xpThisWeek,
      streak_current: profile.streak_current,
      streak_longest: profile.streak_longest,
      streak_freezes: profile.streak_freezes ?? 0,
      primary_goal: profile.primary_goal,
      perfect_days: profile.perfect_days,
    },
    recent_achievements: recentAchievements,
    habits_today: {
      total: habits.length,
      completed: loggedToday.size,
      missing: habitsMissing,
    },
    health: {
      water_today_ml: waterToday,
      water_goal_pct: Math.min(100, Math.round((waterToday / WATER_GOAL_ML) * 100)),
      sleep_last_night: sleepLastNightRes.data
        ? {
            duration_hours: sleepLastNightRes.data.duration_hours,
            quality: sleepLastNightRes.data.quality,
          }
        : null,
      mood_today: moodTodayRes.data
        ? {
            mood: moodTodayRes.data.mood,
            energy: moodTodayRes.data.energy,
            stress: moodTodayRes.data.stress,
          }
        : null,
    },
    last_workout: lastWorkoutRes.data,
    pending_tasks: (pendingTasksRes.data ?? []).map((t) => ({
      title: t.title,
      priority:
        t.urgent && t.important
          ? 'CRÍTICO'
          : t.urgent
            ? 'URGENTE'
            : t.important
              ? 'IMPORTANTE'
              : 'NORMAL',
      due_date: t.due_date,
    })),
    finances_this_month: {
      income: monthIncome,
      expense: monthExpense,
      net: monthIncome - monthExpense,
    },
    active_goals: (activeGoalsRes.data ?? []).map((g) => ({
      title: g.title,
      progress: `${g.current_value}/${g.target_value} ${g.unit}`,
      deadline: g.deadline,
      pct: g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0,
    })),
    finance_goals: (financeGoalsRes.data ?? []).map((g) => ({
      title: g.title,
      saved: Number(g.current_amount),
      target: Number(g.target_amount),
      pct:
        Number(g.target_amount) > 0
          ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
          : 0,
      deadline: g.deadline,
    })),
  };

  // Contexto dinâmico como segundo bloco — não vai para o cache
  const dynamicContextBlock = `## CONTEXTO ATUAL DE ${profile.name.split(' ')[0]?.toUpperCase() ?? 'VOCÊ'}
- Nível ${profile.level} · ${profile.xp_total.toLocaleString('pt-BR')} XP total · +${xpThisWeek.toLocaleString('pt-BR')} XP esta semana
- Streak atual: ${profile.streak_current} dias (recorde: ${profile.streak_longest})
- Dados completos: ${JSON.stringify(contextSnapshot, null, 2)}`;

  // Salvar mensagem do usuário (context_snapshot omitido — ephemeral, só para a chamada da IA)
  await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: 'user',
    content: message,
  });

  // Montar histórico
  const history = (historyRes.data ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const isFirstReply = history.length === 0;
  const encoder = new TextEncoder();

  // Streaming SSE — o cliente recebe tokens em tempo real em vez de esperar 3-5s pela resposta completa.
  // Mantém prompt caching da Anthropic (~70% de economia em input tokens).
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = '';
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        const stream = await anthropic.beta.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 1024,
          system: [
            { type: 'text', text: STATIC_COACH_PROMPT, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: dynamicContextBlock },
          ],
          messages: [...history, { role: 'user', content: message }],
          stream: true,
          betas: ['prompt-caching-2024-07-31'],
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          } else if (event.type === 'message_start') {
            inputTokens = event.message.usage?.input_tokens ?? 0;
          } else if (event.type === 'message_delta') {
            outputTokens = event.usage.output_tokens;
          }
        }

        // Stream concluído — persiste no banco
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: 'assistant',
          content: fullText,
          tokens_used: inputTokens + outputTokens,
        });

        const titleUpdates: Record<string, unknown> = { last_message_at: new Date().toISOString() };
        if (isFirstReply) {
          const rawTitle = message.replace(/\s+/g, ' ').trim().slice(0, 60);
          titleUpdates.title = rawTitle.length < message.trim().length ? rawTitle + '…' : rawTitle;
        }
        await supabase.from('ai_conversations').update(titleUpdates).eq('id', conversationId);
      } catch (err) {
        console.error('coach streaming error', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'ai_error' })}\n\n`));
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Desativa buffering de proxy Nginx — necessário para SSE
    },
  });
}
