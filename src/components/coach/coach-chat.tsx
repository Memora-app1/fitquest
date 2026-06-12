'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  ChevronDown,
} from 'lucide-react';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  reaction?: 'up' | 'down' | null;
}

const SUGGESTIONS = [
  {
    label: '📊 Resumo do mês',
    prompt: 'Como tá meu progresso este mês? Hábitos, treinos e finanças.',
  },
  {
    label: '🎯 Foco da semana',
    prompt: 'O que devo priorizar essa semana para evoluir mais rápido?',
  },
  { label: '💸 Análise de gastos', prompt: 'Em que estou gastando mais? Tem como economizar?' },
  { label: '⚡ Me motiva!', prompt: 'Me dá um boost de motivação baseado no meu progresso!' },
  { label: '🏆 Próxima meta', prompt: 'Baseado no meu histórico, qual meta devo criar agora?' },
  { label: '💪 Treino ideal', prompt: 'Que tipo de treino combina com meu perfil e histórico?' },
];

const MAX_CHARS = 2000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdown(text: string): string {
  // Escape HTML first to prevent XSS — only markdown patterns become real tags
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code class="bg-bg-elevated px-1.5 py-0.5 rounded text-brand-orange font-mono text-xs">$1</code>'
    )
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1 text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-1 text-brand-orange">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2 text-white">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-text-secondary">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-text-secondary">$2</li>')
    .replace(/(<li.*?<\/li>\n?)+/g, (match) => `<ul class="space-y-1 my-2">${match}</ul>`)
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br />');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-bg-elevated hover:text-white"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      title="Copiar mensagem"
    >
      {copied ? <Check size={13} className="text-brand-green" /> : <Copy size={13} />}
    </button>
  );
}

function ReactionButton({
  icon: Icon,
  active,
  onClick,
  title,
}: {
  icon: typeof ThumbsUp;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
        active
          ? 'bg-brand-orange/10 text-brand-orange'
          : 'text-text-muted hover:bg-bg-elevated hover:text-white'
      }`}
    >
      <Icon size={13} />
    </button>
  );
}

export function CoachChat({
  conversationId,
  initialMessages,
  apiConfigured = false,
  initialPrompt,
}: {
  conversationId: string;
  initialMessages: Message[];
  apiConfigured?: boolean;
  initialPrompt?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const didAutoSend = useRef(false);

  const charsLeft = MAX_CHARS - input.length;
  const charsLow = charsLeft < 200;
  const charsPct = Math.min((input.length / MAX_CHARS) * 100, 100);

  const scrollToBottom = useCallback((smooth = true) => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-send prompt from MiniCoachFab (?q=...) — fires once, only on empty conversation
  useEffect(() => {
    if (initialPrompt && !didAutoSend.current && initialMessages.length === 0 && apiConfigured) {
      didAutoSend.current = true;
      const timer = setTimeout(() => send(initialPrompt), 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      const distFromBottom = el!.scrollHeight - el!.scrollTop - el!.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    }
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  async function send(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;

    if (navigator.vibrate) navigator.vibrate([10, 5, 20]);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const assistantMsgId = crypto.randomUUID();

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      });

      if (!res.ok) {
        // Erros retornam JSON (429, 401, 500)
        const data = (await res.json()) as { error?: string; limit?: number };
        const errorContent =
          res.status === 429 && data.error === 'daily_limit_reached'
            ? `⚠️ Você atingiu o limite de ${data.limit} mensagens por dia. O limite é renovado à meia-noite.`
            : '❌ Desculpe, deu um erro. Tenta novamente em alguns segundos.';
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: errorContent,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      // Resposta é SSE — adiciona mensagem vazia e vai preenchendo com chunks
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        },
      ]);

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            reader.cancel();
            break outer;
          }
          try {
            const parsed = JSON.parse(raw) as { text?: string; error?: string };
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: m.content + parsed.text } : m
                )
              );
              // Auto-scroll para o fim a cada chunk
              if (scrollRef.current) {
                const el = scrollRef.current;
                const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
                if (isNearBottom) el.scrollTop = el.scrollHeight;
              }
            }
          } catch {
            /* ignora SSE malformado */
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '❌ Erro de conexão. Verifique sua internet e tente novamente.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function setReaction(id: string, reaction: 'up' | 'down') {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, reaction: m.reaction === reaction ? null : reaction } : m
      )
    );
  }

  function clearChat() {
    setMessages([]);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const isEmpty = messages.length === 0;
  const msgCount = messages.filter((m) => m.role === 'user').length;

  if (!apiConfigured) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        {/* Icon */}
        <div className="relative mx-auto mb-6 h-24 w-24">
          <div
            className="absolute inset-0 animate-pulse rounded-3xl opacity-20"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #7C3AED)' }}
          />
          <div
            className="absolute inset-0 scale-110 animate-pulse rounded-3xl opacity-10"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
              animationDelay: '0.3s',
            }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,0,0.15), rgba(124,58,237,0.15))',
              border: '1px solid rgba(255,77,0,0.3)',
            }}
          >
            <Bot size={38} className="text-brand-orange opacity-60" />
          </div>
        </div>

        {/* Badge */}
        <div
          className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{
            background: 'rgba(245,200,66,0.12)',
            border: '1px solid rgba(245,200,66,0.3)',
            color: '#F5C842',
          }}
        >
          <Sparkles size={11} />
          EM BREVE
        </div>

        <h3 className="mb-3 text-2xl font-black">Coach IA</h3>
        <p className="mx-auto mb-6 max-w-xs text-sm leading-relaxed text-text-secondary">
          Seu assistente pessoal de IA está quase aqui. Ele vai ter acesso completo aos seus
          hábitos, treinos, tarefas e finanças para te dar conselhos ultra-personalizados.
        </p>

        {/* Feature chips */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {[
            { icon: '💪', label: 'Análise de treinos' },
            { icon: '✅', label: 'Gestão de tarefas' },
            { icon: '💰', label: 'Dicas financeiras' },
            { icon: '🔥', label: 'Motivação de streak' },
            { icon: '⚡', label: 'Estratégia de XP' },
            { icon: '🎯', label: 'Planos de meta' },
          ].map((chip) => (
            <span
              key={chip.label}
              className="rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text-muted"
            >
              {chip.icon} {chip.label}
            </span>
          ))}
        </div>

        {/* Disabled input preview */}
        <div className="w-full max-w-lg">
          <div
            className="flex cursor-not-allowed items-center gap-3 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex-1 text-sm italic text-text-muted">
              Coach IA disponível em breve…
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl opacity-25"
              style={{ background: 'rgba(255,77,0,0.3)' }}
            >
              <Send size={15} className="text-white" />
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            O módulo de IA será ativado em breve. Fique de olho nas novidades!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Messages area */}
      <div ref={scrollRef} className="relative flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
        {isEmpty && (
          <div className="px-4 py-8 text-center">
            {/* Animated bot icon */}
            <div className="relative mx-auto mb-5 h-20 w-20">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-brand opacity-20" />
              <div
                className="absolute inset-0 scale-110 animate-pulse rounded-2xl bg-gradient-brand opacity-10"
                style={{ animationDelay: '0.2s' }}
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-brand shadow-[0_0_40px_rgba(255,77,0,0.3)]">
                <Sparkles size={32} className="text-white" />
              </div>
            </div>

            <h3 className="mb-2 text-xl font-bold">Seu Coach IA está pronto</h3>
            <p className="mx-auto mb-7 max-w-sm text-sm leading-relaxed text-text-secondary">
              Tenho contexto completo da sua vida — hábitos, treinos, tarefas, finanças e XP.
              Pergunte qualquer coisa.
            </p>

            {/* Context chips */}
            <div className="mb-7 flex flex-wrap justify-center gap-2">
              {['💪 Treinos', '✅ Tarefas', '💰 Finanças', '🔥 Streak', '⚡ XP & Level'].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-xs text-text-muted"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>

            <div className="mx-auto grid max-w-lg grid-cols-1 gap-2 text-left sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="group rounded-xl border border-border bg-bg-card p-3.5 text-left text-sm transition-all hover:border-brand-orange/40 hover:bg-bg-elevated"
                >
                  <div className="font-semibold transition-colors group-hover:text-brand-orange">
                    {s.label}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-text-muted">{s.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isAi = msg.role === 'assistant';
          const isLast = idx === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isLast ? 'pb-1' : ''}`}
              style={{ animation: 'fadeSlideIn 0.28s cubic-bezier(0.34, 1.2, 0.64, 1) both' }}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isUser
                    ? 'bg-brand-purple'
                    : 'bg-gradient-brand shadow-[0_0_12px_rgba(255,77,0,0.25)]'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Bubble */}
              <div className={`flex max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-tr-sm border border-brand-purple/30 bg-brand-purple/20'
                      : 'rounded-tl-sm border border-border bg-bg-card'
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
                <div
                  className={`mt-1 flex items-center gap-0.5 px-1 opacity-0 transition-opacity group-hover:opacity-100 ${isUser ? 'flex-row-reverse' : ''}`}
                  style={{ opacity: 1 }} // always visible for reactions
                >
                  <span className="px-1.5 text-[10px] text-text-muted">
                    {formatTime(msg.created_at)}
                  </span>
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
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div
            className="flex gap-3"
            style={{ animation: 'fadeSlideIn 0.28s cubic-bezier(0.34, 1.2, 0.64, 1) both' }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand shadow-[0_0_12px_rgba(255,77,0,0.25)]">
              <Bot size={15} />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-card p-3.5">
              <div className="flex h-4 items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="h-2 w-2 rounded-full bg-brand-orange"
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-card text-text-muted shadow-lg transition-all hover:border-brand-orange/40 hover:text-white"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-bg-card p-3 md:p-4">
        {/* Stats bar */}
        {!isEmpty && (
          <div className="mb-2 flex items-center justify-between">
            {/* Quick chips */}
            <div
              className="scrollbar-hide flex gap-1.5 overflow-x-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  disabled={loading}
                  className="shrink-0 whitespace-nowrap rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs transition-colors hover:border-brand-orange/50 hover:text-brand-orange disabled:opacity-40"
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
              className="ml-2 shrink-0 rounded-lg p-1.5 text-text-muted transition-all hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa… (Enter para enviar)"
              disabled={loading}
              rows={1}
              className="input max-h-36 min-h-[48px] w-full resize-none py-2.5 pr-14 text-sm leading-relaxed"
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 144) + 'px';
              }}
            />
            {/* Character counter arc */}
            {input.length > 0 && (
              <div className="absolute bottom-2.5 right-3 flex items-center gap-1">
                {/* Mini arc indicator */}
                <svg width="18" height="18" className="shrink-0">
                  <circle
                    cx="9"
                    cy="9"
                    r="7"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="9"
                    cy="9"
                    r="7"
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
                  <span
                    className={`font-mono text-[10px] ${charsPct > 90 ? 'text-brand-red' : 'text-brand-gold'}`}
                  >
                    {charsLeft}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary shrink-0 self-end p-3 transition-transform active:scale-90 disabled:opacity-40"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Enviar"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>

        <div className="mt-1.5 flex items-center justify-between">
          <p className="hidden text-[11px] text-text-muted md:block">
            Shift+Enter para nova linha · Enter para enviar
          </p>
          <span className="md:hidden" />
          {msgCount > 0 && (
            <p className="text-[11px] text-text-muted">
              {msgCount} mensagem{msgCount !== 1 ? 'ns' : ''}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes typingDot {
          0%,
          60%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          30% {
            transform: scale(1.3);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
