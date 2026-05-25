'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw, Copy, Check, ThumbsUp, ThumbsDown, Trash2, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
  reaction?: 'up' | 'down' | null
}

const SUGGESTIONS = [
  { label: '📊 Resumo do mês', prompt: 'Como tá meu progresso este mês? Hábitos, treinos e finanças.' },
  { label: '🎯 Foco da semana', prompt: 'O que devo priorizar essa semana para evoluir mais rápido?' },
  { label: '💸 Análise de gastos', prompt: 'Em que estou gastando mais? Tem como economizar?' },
  { label: '⚡ Me motiva!', prompt: 'Me dá um boost de motivação baseado no meu progresso!' },
  { label: '🏆 Próxima meta', prompt: 'Baseado no meu histórico, qual meta devo criar agora?' },
  { label: '💪 Treino ideal', prompt: 'Que tipo de treino combina com meu perfil e histórico?' },
]

const MAX_CHARS = 2000

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-bg-elevated px-1.5 py-0.5 rounded text-brand-orange font-mono text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1 text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-1 text-brand-orange">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2 text-white">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-text-secondary">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-text-secondary">$2</li>')
    .replace(/(<li.*?<\/li>\n?)+/g, (match) => `<ul class="space-y-1 my-2">${match}</ul>`)
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
      className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-bg-elevated transition-all"
      title="Copiar mensagem"
    >
      {copied ? <Check size={13} className="text-brand-green" /> : <Copy size={13} />}
    </button>
  )
}

function ReactionButton({
  icon: Icon,
  active,
  onClick,
  title,
}: {
  icon: typeof ThumbsUp
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${
        active
          ? 'text-brand-orange bg-brand-orange/10'
          : 'text-text-muted hover:text-white hover:bg-bg-elevated'
      }`}
    >
      <Icon size={13} />
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
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const charsLeft = MAX_CHARS - input.length
  const charsLow = charsLeft < 200
  const charsPct = Math.min((input.length / MAX_CHARS) * 100, 100)

  const scrollToBottom = useCallback((smooth = true) => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onScroll() {
      const distFromBottom = el!.scrollHeight - el!.scrollTop - el!.clientHeight
      setShowScrollBtn(distFromBottom > 120)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
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
            : '❌ Desculpe, deu um erro. Tenta novamente em alguns segundos.'
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
        { id: crypto.randomUUID(), role: 'assistant', content: '❌ Erro de conexão. Verifique sua internet e tente novamente.', created_at: new Date().toISOString() },
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

  function setReaction(id: string, reaction: 'up' | 'down') {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, reaction: m.reaction === reaction ? null : reaction } : m
      )
    )
  }

  function clearChat() {
    setMessages([])
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const isEmpty = messages.length === 0
  const msgCount = messages.filter((m) => m.role === 'user').length

  return (
    <>
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 relative">

        {isEmpty && (
          <div className="text-center py-8 px-4">
            {/* Animated bot icon */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-gradient-brand opacity-20 animate-pulse" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-brand opacity-10 scale-110 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="relative w-20 h-20 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,77,0,0.3)]">
                <Sparkles size={32} className="text-white" />
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">Seu Coach IA está pronto</h3>
            <p className="text-text-secondary text-sm max-w-sm mx-auto mb-7 leading-relaxed">
              Tenho contexto completo da sua vida — hábitos, treinos, tarefas, finanças e XP.
              Pergunte qualquer coisa.
            </p>

            {/* Context chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-7">
              {['💪 Treinos', '✅ Tarefas', '💰 Finanças', '🔥 Streak', '⚡ XP & Level'].map((chip) => (
                <span
                  key={chip}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-text-muted bg-bg-elevated"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="p-3.5 bg-bg-card border border-border rounded-xl hover:border-brand-orange/40 hover:bg-bg-elevated transition-all text-sm text-left group"
                >
                  <div className="font-semibold group-hover:text-brand-orange transition-colors">{s.label}</div>
                  <div className="text-xs text-text-muted mt-1 line-clamp-2">{s.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          const isAi = msg.role === 'assistant'
          const isLast = idx === messages.length - 1

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isLast ? 'pb-1' : ''}`}
              style={{ animation: 'fadeIn 0.2s ease-out' }}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                  isUser ? 'bg-brand-purple' : 'bg-gradient-brand shadow-[0_0_12px_rgba(255,77,0,0.25)]'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-brand-purple/20 border border-brand-purple/30 rounded-tr-sm'
                      : 'bg-bg-card border border-border rounded-tl-sm'
                  }`}
                >
                  {isAi ? (
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {/* Message actions row */}
                <div className={`flex items-center gap-0.5 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}
                  style={{ opacity: 1 }} // always visible for reactions
                >
                  <span className="text-[10px] text-text-muted px-1.5">{formatTime(msg.created_at)}</span>
                  <CopyButton text={msg.content} />
                  {isAi && (
                    <>
                      <ReactionButton
                        icon={ThumbsUp}
                        active={msg.reaction === 'up'}
                        onClick={() => setReaction(msg.id, 'up')}
                        title="Boa resposta"
                      />
                      <ReactionButton
                        icon={ThumbsDown}
                        active={msg.reaction === 'down'}
                        onClick={() => setReaction(msg.id, 'down')}
                        title="Resposta ruim"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,77,0,0.25)]">
              <Bot size={15} />
            </div>
            <div className="bg-bg-card border border-border rounded-2xl rounded-tl-sm p-3.5">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-brand-orange rounded-full"
                    style={{
                      animation: 'typingDot 1.2s ease-in-out infinite',
                      animationDelay: `${delay}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="absolute bottom-28 right-4 z-10">
          <button
            onClick={() => scrollToBottom()}
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-white hover:border-brand-orange/40 transition-all shadow-lg"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 md:p-4 border-t border-border bg-bg-card shrink-0">
        {/* Stats bar */}
        {!isEmpty && (
          <div className="flex items-center justify-between mb-2">
            {/* Quick chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {SUGGESTIONS.slice(0, 3).map((s) => (
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
            {/* Clear button */}
            <button
              onClick={clearChat}
              disabled={loading}
              title="Limpar conversa"
              className="shrink-0 ml-2 p-1.5 rounded-lg text-text-muted hover:text-brand-red hover:bg-brand-red/10 transition-all disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
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
            {/* Character counter arc */}
            {input.length > 0 && (
              <div className="absolute right-3 bottom-2.5 flex items-center gap-1">
                {/* Mini arc indicator */}
                <svg width="18" height="18" className="shrink-0">
                  <circle cx="9" cy="9" r="7" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <circle
                    cx="9" cy="9" r="7"
                    fill="none"
                    stroke={charsPct > 90 ? '#EF4444' : charsPct > 70 ? '#F5C842' : '#FF4D00'}
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 7}`}
                    strokeDashoffset={`${2 * Math.PI * 7 * (1 - charsPct / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 9 9)"
                    className="transition-all duration-200"
                  />
                </svg>
                {charsLow && (
                  <span className={`text-[10px] font-mono ${charsPct > 90 ? 'text-brand-red' : 'text-brand-gold'}`}>
                    {charsLeft}
                  </span>
                )}
              </div>
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

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-text-muted">
            Shift+Enter para nova linha · Enter para enviar
          </p>
          {msgCount > 0 && (
            <p className="text-[11px] text-text-muted">
              {msgCount} mensagem{msgCount !== 1 ? 'ns' : ''}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
          30% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </>
  )
}
