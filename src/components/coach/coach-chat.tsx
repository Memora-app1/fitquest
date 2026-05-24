'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message: input }),
    })

    const data = await res.json()

    if (!res.ok) {
      const errorContent =
        res.status === 429 && data.error === 'daily_limit_reached'
          ? `⚠️ Você atingiu o limite de ${data.limit} mensagens por dia. O limite é renovado à meia-noite.`
          : '❌ Desculpe, deu erro. Tenta novamente?'
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: errorContent,
          created_at: new Date().toISOString(),
        },
      ])
      setLoading(false)
      return
    }
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      },
    ])
    setLoading(false)
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🤖</div>
            <h3 className="text-xl font-bold mb-2">Oi, sou seu Coach</h3>
            <p className="text-text-secondary max-w-md mx-auto">
              Me pergunte qualquer coisa sobre sua rotina, treinos, finanças ou produtividade.
              Tenho contexto completo da sua vida.
            </p>
            <div className="mt-6 flex flex-col gap-2 max-w-md mx-auto">
              {[
                'Como tá meu mês até agora?',
                'O que eu deveria focar essa semana?',
                'Tô gastando demais com o quê?',
                'Me ajuda a montar minha meta de Q4',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left p-3 bg-bg-card border border-border rounded-xl hover:border-brand-orange/40 text-sm"
                >
                  💬 {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-brand-purple' : 'bg-gradient-brand'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-brand-purple/20 border border-brand-purple/30'
                  : 'bg-bg-card border border-border'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-bg-card border border-border rounded-2xl p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={send} className="p-4 border-t border-border flex gap-2 bg-bg-card">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte qualquer coisa..."
          disabled={loading}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary p-3 disabled:opacity-50"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </form>
    </>
  )
}
