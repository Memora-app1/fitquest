import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { CoachLayout } from '@/components/coach/coach-layout';

export const metadata: Metadata = {
  title: 'Coach IA',
  description:
    'Seu assistente de IA que conhece toda sua vida — fitness, tarefas e finanças em um só lugar.',
};

export const dynamic = 'force-dynamic';

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string; q?: string }>;
}) {
  const { conv, q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Buscar todas as conversas do usuário
  const { data: allConversations } = await supabase
    .from('ai_conversations')
    .select('id, title, last_message_at, created_at')
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(30);

  const conversations = allConversations ?? [];

  // Determinar conversa ativa
  let activeConversationId: string | null = null;

  if (conv) {
    // Verificar que a conversa pedida pertence ao usuário
    const found = conversations.find((c) => c.id === conv);
    if (found) activeConversationId = found.id;
  }

  // Fallback para a mais recente
  if (!activeConversationId && conversations.length > 0) {
    activeConversationId = conversations[0]!.id;
  }

  // Se ainda não tem nenhuma, criar uma
  if (!activeConversationId) {
    const { data: newConv } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title: 'Nova conversa' })
      .select('id, title, last_message_at, created_at')
      .single();

    if (newConv) {
      conversations.unshift(newConv);
      activeConversationId = newConv.id;
    }
  }

  if (!activeConversationId) redirect('/dashboard');

  // Buscar mensagens da conversa ativa
  const { data: messages } = await supabase
    .from('ai_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', activeConversationId)
    .order('created_at');

  const apiConfigured = !!process.env.ANTHROPIC_API_KEY;

  return (
    <AppShell>
      <CoachLayout
        conversations={conversations}
        activeConversationId={activeConversationId}
        initialMessages={messages ?? []}
        apiConfigured={apiConfigured}
        initialPrompt={q}
      />
    </AppShell>
  );
}
