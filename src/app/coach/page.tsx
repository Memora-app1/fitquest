import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { CoachChat } from '@/components/coach/coach-chat'

export const dynamic = 'force-dynamic'

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar ou criar conversa ativa (a mais recente)
  let { data: conversation } = await supabase
    .from('ai_conversations')
    .select('id, title')
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conversation) {
    const { data: newConv } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title: 'Nova conversa' })
      .select('id, title')
      .single()
    conversation = newConv
  }

  if (!conversation) redirect('/dashboard')

  const { data: messages } = await supabase
    .from('ai_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at')

  return (
    <AppShell>
      <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col">
        <div className="p-4 md:p-6 border-b border-border">
          <h1 className="heading-display text-2xl md:text-3xl">🤖 Coach IA</h1>
          <p className="text-sm text-text-secondary">
            Seu assistente pessoal — sabe tudo sobre seus hábitos, treinos, tarefas e finanças.
          </p>
        </div>

        <CoachChat conversationId={conversation.id} initialMessages={messages ?? []} />
      </div>
    </AppShell>
  )
}
