'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, MessageSquare, X, Edit3, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CoachChat } from '@/components/coach/coach-chat'

interface Conversation {
  id: string
  title: string
  last_message_at: string | null
  created_at: string
}

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d atrás`
  if (hours > 0) return `${hours}h atrás`
  if (mins > 0) return `${mins}min atrás`
  return 'agora'
}

export function CoachLayout({
  conversations: serverConversations,
  activeConversationId,
  initialMessages,
  apiConfigured = false,
  initialPrompt,
}: {
  conversations: Conversation[]
  activeConversationId: string
  initialMessages: Message[]
  apiConfigured?: boolean
  initialPrompt?: string
}) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>(serverConversations)
  const [showSidebar, setShowSidebar] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Sync conversations list when server re-renders after navigation
  useEffect(() => {
    setConversations(serverConversations)
  }, [serverConversations])

  async function createNewConversation() {
    if (creatingNew) return
    setCreatingNew(true)
    try {
      const res = await fetch('/api/coach/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nova conversa' }),
      })
      const data = await res.json() as Conversation & { error?: string }
      if (res.ok && data.id) {
        setConversations((prev) => [data, ...prev])
        router.push(`/coach?conv=${data.id}`)
        setShowSidebar(false)
      }
    } finally {
      setCreatingNew(false)
    }
  }

  async function deleteConversation(id: string) {
    if (deletingId) return
    setDeletingId(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))

    await fetch(`/api/coach/conversations?id=${id}`, { method: 'DELETE' })

    if (id === activeConversationId) {
      const remaining = conversations.filter((c) => c.id !== id)
      if (remaining.length > 0 && remaining[0]) {
        router.push(`/coach?conv=${remaining[0].id}`)
      } else {
        await createNewConversation()
      }
    }
    setDeletingId(null)
  }

  async function saveTitle(id: string) {
    if (!editTitle.trim()) { setEditingId(null); return }
    const title = editTitle.trim()
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title } : c))
    setEditingId(null)

    await fetch('/api/coach/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title }),
    })
  }

  function startEdit(conv: Conversation, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  const activeConv = conversations.find((c) => c.id === activeConversationId)

  return (
    <div className="h-[calc(100vh-80px)] md:h-screen flex overflow-hidden">

      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          'flex flex-col bg-bg-card border-r border-border z-30 transition-all duration-300',
          // Mobile: absolute overlay
          'fixed inset-y-0 left-0 w-72',
          'md:relative md:w-64 md:translate-x-0 md:flex',
          showSidebar ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'
        )}
      >
        {/* Sidebar header */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <button
            onClick={createNewConversation}
            disabled={creatingNew}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-60"
          >
            <Plus size={15} />
            {creatingNew ? 'Criando…' : 'Nova conversa'}
          </button>
          <button
            onClick={() => setShowSidebar(false)}
            className="md:hidden p-2 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-xs text-text-muted text-center py-6">Nenhuma conversa ainda</p>
          )}
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId
            const isEditing = editingId === conv.id

            return (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all',
                  isActive
                    ? 'bg-brand-orange/10 border border-brand-orange/25'
                    : 'hover:bg-bg-elevated border border-transparent'
                )}
                onClick={() => {
                  if (!isEditing) {
                    router.push(`/coach?conv=${conv.id}`)
                    setShowSidebar(false)
                  }
                }}
              >
                <MessageSquare
                  size={14}
                  className={cn('shrink-0', isActive ? 'text-brand-orange' : 'text-text-muted')}
                />

                {isEditing ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle(conv.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => saveTitle(conv.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-sm border-b border-brand-orange/50 outline-none text-white"
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-sm font-medium truncate', isActive && 'text-brand-orange')}>
                      {conv.title}
                    </div>
                    {conv.last_message_at && (
                      <div className="text-[10px] text-text-muted">{timeAgo(conv.last_message_at)}</div>
                    )}
                  </div>
                )}

                {/* Action buttons — visible on hover */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEdit(conv, e)}
                      className="p-1 text-text-muted hover:text-white rounded transition-colors"
                      title="Renomear"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                      disabled={deletingId === conv.id}
                      className="p-1 text-text-muted hover:text-brand-red rounded transition-colors disabled:opacity-40"
                      title="Excluir"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); saveTitle(conv.id) }}
                    className="p-1 text-brand-green"
                  >
                    <Check size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-text-muted text-center">
            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''} · Limite 50 msgs/dia
          </p>
        </div>
      </aside>

      {/* Overlay para fechar sidebar no mobile */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* ─── Main chat area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:px-6 md:py-4 border-b border-border flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden p-2 rounded-lg hover:bg-bg-elevated transition-colors"
            title="Conversas"
          >
            <MessageSquare size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="heading-display text-xl md:text-2xl flex items-center gap-2">
              🤖 Coach IA
              {activeConv && (
                <span className="text-sm font-sans font-normal text-text-muted truncate hidden sm:inline">
                  · {activeConv.title}
                </span>
              )}
            </h1>
            <p className="text-xs text-text-secondary hidden sm:block">
              Contexto completo: hábitos · treinos · tarefas · finanças
            </p>
          </div>
          {/* Desktop: botão nova conversa no header */}
          <button
            onClick={createNewConversation}
            disabled={creatingNew}
            className="hidden md:flex btn-ghost text-sm items-center gap-1.5 py-1.5 px-3 disabled:opacity-50"
          >
            <Plus size={14} />
            Nova
          </button>
        </div>

        {/* Chat — key força remount quando muda de conversa */}
        <CoachChat
          key={activeConversationId}
          conversationId={activeConversationId}
          initialMessages={initialMessages}
          apiConfigured={apiConfigured}
          initialPrompt={initialPrompt}
        />
      </div>
    </div>
  )
}
