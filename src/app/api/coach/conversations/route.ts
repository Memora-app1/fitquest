import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  title: z.string().min(1).max(200).default('Nova conversa'),
})

// POST /api/coach/conversations — cria nova conversa
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  const title = parsed.success ? parsed.data.title : 'Nova conversa'

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: user.id, title })
    .select('id, title, last_message_at, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'creation_failed' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/coach/conversations?id=UUID — deleta conversa e mensagens
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  // Verificar que a conversa pertence ao usuário
  const { data: convo } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!convo) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Deletar mensagens primeiro (FK constraint)
  await supabase.from('ai_messages').delete().eq('conversation_id', id)

  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 })

  return NextResponse.json({ success: true })
}

// PATCH /api/coach/conversations — renomeia conversa
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { id?: string; title?: string }
  if (!body.id || !body.title?.trim()) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .update({ title: body.title.trim().slice(0, 200) })
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select('id, title, last_message_at')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 })

  return NextResponse.json(data)
}
