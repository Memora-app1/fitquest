import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(2000),
})

const DAILY_MESSAGE_LIMIT = 50

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Rate limit: máx 50 mensagens/usuário/dia (custo Anthropic)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', todayStart.toISOString())
  if ((count ?? 0) >= DAILY_MESSAGE_LIMIT) {
    return NextResponse.json(
      { error: 'daily_limit_reached', limit: DAILY_MESSAGE_LIMIT },
      { status: 429 }
    )
  }

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  const { conversationId, message } = parsed.data

  // Verificar que a conversa pertence ao user autenticado
  const { data: convo } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!convo) return NextResponse.json({ error: 'conversation_not_found' }, { status: 404 })

  // Buscar contexto completo do usuário em paralelo
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today!.substring(0, 7) + '-01'

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
  ] = await Promise.all([
    supabase.from('profiles').select('name, level, xp_total, streak_current, primary_goal, perfect_days').eq('id', user.id).single(),
    supabase.from('habits').select('id, name').eq('user_id', user.id).eq('is_active', true),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('logged_date', today!),
    supabase.from('workouts').select('title, started_at, total_sets, total_volume_kg, xp_earned').eq('user_id', user.id).order('started_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('tasks').select('title, urgent, important, due_date').eq('user_id', user.id).not('status', 'eq', 'done').not('status', 'eq', 'archived').order('urgent', { ascending: false }).limit(10),
    supabase.from('transactions').select('amount, type').eq('user_id', user.id).gte('transaction_date', monthStart).eq('is_paid', true),
    supabase.from('goals').select('title, current_value, target_value, unit, deadline').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('ai_messages').select('role, content').eq('conversation_id', conversationId).order('created_at').limit(20),
    supabase.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('date', today!),
    supabase.from('sleep_logs').select('duration_hours, quality').eq('user_id', user.id).gte('date', new Date(Date.now() - 86400000).toISOString().split('T')[0]!).maybeSingle(),
    supabase.from('mood_logs').select('mood, energy, stress').eq('user_id', user.id).eq('date', today!).maybeSingle(),
  ])

  const profile = profileRes.data
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 404 })

  const monthIncome = (monthTxRes.data ?? []).filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const monthExpense = (monthTxRes.data ?? []).filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const habits = habitsRes.data ?? []
  const loggedToday = new Set((todayLogsRes.data ?? []).map((l) => l.habit_id))
  const habitsTodayMissing = habits.filter((h) => !loggedToday.has(h.id)).map((h) => h.name)

  const waterToday = (waterTodayRes.data ?? []).reduce((s, l) => s + (l.amount_ml as number ?? 0), 0)
  const sleepLast = sleepLastNightRes.data
  const moodToday = moodTodayRes.data

  const contextSnapshot = {
    user: {
      name: profile.name,
      level: profile.level,
      xp: profile.xp_total,
      streak: profile.streak_current,
      primary_goal: profile.primary_goal,
      perfect_days: profile.perfect_days,
    },
    habits_today: {
      total: habits.length,
      completed: loggedToday.size,
      missing: habitsTodayMissing,
    },
    health: {
      water_today_ml: waterToday,
      water_goal_pct: Math.min(100, Math.round((waterToday / 2000) * 100)),
      sleep_last_night: sleepLast ? {
        duration_hours: sleepLast.duration_hours,
        quality: sleepLast.quality,
      } : null,
      mood_today: moodToday ? {
        mood: moodToday.mood,       // 1-5
        energy: moodToday.energy,   // 1-5
        stress: moodToday.stress,   // 1-5
      } : null,
    },
    last_workout: lastWorkoutRes.data,
    pending_tasks: (pendingTasksRes.data ?? []).map((t) => ({
      title: t.title,
      priority: t.urgent && t.important ? 'CRÍTICO' : t.urgent ? 'URGENTE' : t.important ? 'IMPORTANTE' : 'NORMAL',
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
  }

  const systemPrompt = `Você é o Coach do Ascendia — assistente pessoal de um usuário brasileiro. Seu papel é ajudá-lo a evoluir em todas as áreas da vida.

Você tem acesso ao contexto completo dele: fitness, produtividade, finanças, saúde e metas. Cruze esses dados para dar conselhos relevantes — não seja genérico.

Exemplos de cruzamentos:
- Estresse alto + pouco sono → não é hora de treino pesado, sugira recuperação
- Gastos acima do esperado + meta financeira próxima → ajuste de prioridade
- Streak em risco + nenhum hábito hoje → urgência calculada

Você é:
- Direto e objetivo (resposta curta, máximo 4 parágrafos)
- Motivacional mas realista (sem clichê, sem piegas)
- Brasileiro autêntico (use linguagem natural, gírias quando natural)
- Sempre fecha com UMA ação concreta e específica

Dados atuais do usuário:
${JSON.stringify(contextSnapshot, null, 2)}

Responda SEMPRE em português brasileiro. Seja conciso — max 4 parágrafos. Se a pergunta for simples, responda simples.`

  // Salvar mensagem do usuário
  await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: 'user',
    content: message,
    context_snapshot: contextSnapshot,
  })

  // Montar histórico
  const history = (historyRes.data ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Chamar Anthropic
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  try {
    const response = await anthropic.beta.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [...history, { role: 'user', content: message }],
      betas: ['prompt-caching-2024-07-31'],
    })

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')

    // Salvar resposta
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'assistant',
      content: reply,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    })

    // Auto-title: se for o primeiro reply, gera título baseado na mensagem do usuário
    const isFirstReply = history.length === 0
    const titleUpdates: Record<string, unknown> = { last_message_at: new Date().toISOString() }
    if (isFirstReply) {
      // Título: primeiros ~60 chars da mensagem do usuário, capitalizado
      const rawTitle = message.replace(/\s+/g, ' ').trim().slice(0, 60)
      titleUpdates.title = rawTitle.length < message.trim().length ? rawTitle + '…' : rawTitle
    }

    await supabase
      .from('ai_conversations')
      .update(titleUpdates)
      .eq('id', conversationId)

    return NextResponse.json({ reply, tokens: response.usage })
  } catch (err) {
    console.error('coach error', err)
    return NextResponse.json({ error: 'ai_error' }, { status: 500 })
  }
}
