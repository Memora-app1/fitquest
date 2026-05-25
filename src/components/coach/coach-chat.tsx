'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw, Copy, Check } from 'lucide-react'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

const SUGGESTIONS = [
  { label: 'Resumo do mês', prompt: 'Como tá meu progresso este mês? Hábitos, treinos e finanças.' },
  { label: 'Foco da semana', prompt: 'O que devo priorizar essa semana para evoluir mais rápido?' },
  { label: 'Análise de gastos', prompt: 'Em que estou gastando mais? Tem como economizar?' },
  { label: 'Me motiva!', prompt: 'Me dá um boost de motivação baseado no meu progresso!' },
  { label: 'Próxima meta', prompt: 'Baseado no meu histórico, qual meta devo criar agora?' },
  { label: 'Treino ideal', prompt: 'Que tipo de treino combina com meu perfil e histórico?' },
]

const MAX_CHARS = 2000

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-bg-elevated px-1 rounded text-brand-orange font-mono text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-1 text-brand-orange">$2</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/(<li.*<\/li>)+/g, (match) => `<ul class="space-y-1 my-2">${match}</ul>`)
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br />')
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-bg-elevated transition-all"
      title="Copiar mensagem"
    >
      {copied ? <Check size={13} className="text-brand-green" /> : <Copy size={13} />}
    </button>
  )
}

export function CoachChat({
  conversationId,
  initialMessages,
}: {
  conversationId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const charsLeft = MAX_CHARS - input.length
  const charsLow = charsLeft < 200

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function send(messageText?: string) {
    const text = (messageText ?? input).trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      })

      const data = await res.json() as {
        reply?: string
        error?: string
        limit?: number
      }

      if (!res.ok) {
        const errorContent =
          res.status === 429 && data.error === 'daily_limit_reached'
            ? `⚠️ Você atingiu o limite de ${data.limit} mensagens por dia. O limite é renovado à meia-noite.`
            : '❌ Desculpe, deu erro. Tenta novamente?'
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: errorContent, created_at: new Date().toISOString() },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: data.reply ?? '', created_at: new Date().toISOString() },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: '❌ Erro de conexão. Verifique sua internet.', created_at: new Date().toISOString() },
      ])
    }

    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {isEmpty && (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,77,0,0.3)]">
              <Sparkles size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">Seu Coach IA está pronto</h3>
            <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">
              Tenho contexto completo da sua vida — hábitos, treinos, tarefas, finanças e XP.
              Pergunte qualquer coisa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="p-3 bg-bg-card border border-border rounded-xl hover:border-brand-orange/40 hover:bg-bg-elevated transition-all text-sm text-left group"
                >
                  <div className="font-medium group-hover:text-brand-orange transition-colors">{s.label}</div>
                  <div className="text-xs text-text-muted mt-0.5 line-clamp-2">{s.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          const isLast = idx === messages.length - 1
          return (
            <div
              key={msg.id}
              className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isLast ? 'pb-2' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                  isUser ? 'bg-brand-purple' : 'bg-gradient-brand'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm relative ${
                  isUser
                    ? 'bg-brand-purple/20 border border-brand-purple/30 rounded-tr-sm'
                    : 'bg-bg-card border border-border rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                )}
                <div className="flex items-center justify-between gap-4 mt-1.5">
                  <div className="text-[10px] text-text-muted">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <CopyButton text={msg.content} />
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="bg-bg-card border border-border rounded-2xl rounded-tl-sm p-3.5">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 md:p-4 border-t border-border bg-bg-card shrink-0">
        {/* Quick suggestion chips — só quando já tem mensagens */}
        {!isEmpty && (
          <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-hide">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s.label}
                onClick={() => send(s.prompt)}
                disabled={loading}
                className="shrink-0 text-xs bg-bg-elevated border border-border px-3 py-1.5 rounded-full hover:border-brand-orange/50 hover:text-brand-orange transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send() }}
          className="flex gap-2 items-end"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa… (Enter para enviar)"
              disabled={loading}
              rows={1}
              className="input w-full resize-none min-h-[42px] max-h-36 py-2.5 pr-14 text-sm leading-relaxed"
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 144) + 'px'
              }}
            />
            {/* Character counter */}
            {input.length > 0 && (
              <span
                className={`absolute right-3 bottom-2.5 text-[10px] transition-colors ${
                  charsLow ? 'text-brand-red' : 'text-text-muted'
                }`}
              >
                {charsLeft}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary p-3 disabled:opacity-40 shrink-0 self-end"
            aria-label="Enviar"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>

        <p className="text-[11px] text-text-muted mt-1.5 text-center">
          Shift+Enter para nova linha · Enter para enviar
        </p>
      </div>
    </>
  )
}
