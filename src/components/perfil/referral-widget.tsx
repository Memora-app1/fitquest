'use client'

import { useState, useEffect } from 'react'
import { Users, Copy, Check, Zap, ChevronDown, ChevronUp, Gift } from 'lucide-react'

export function ReferralWidget() {
  const [code, setCode] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [referralInput, setReferralInput] = useState('')
  const [referralStatus, setReferralStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [referralMsg, setReferralMsg] = useState('')

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(data => {
        if (data.code) { setCode(data.code); setCount(data.count ?? 0) }
      })
      .catch(() => null)
  }, [])

  async function handleCopy() {
    if (!code) return
    const text = `Entre no Ascendia com meu código ${code} e ganhe +200 XP de bônus! 🚀 ascendia.app`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ascendia — Life OS Gamificado', text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch { /* silencioso */ }
  }

  async function handleRedeem() {
    if (!referralInput.trim()) return
    setReferralStatus('loading')
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msgs: Record<string, string> = {
          already_referred: 'Você já usou um código de indicação.',
          own_code: 'Não é possível usar o seu próprio código.',
          code_not_found: 'Código não encontrado.',
          invalid_code: 'Código inválido.',
        }
        setReferralStatus('error')
        setReferralMsg(msgs[data.error] ?? 'Erro ao aplicar código.')
      } else {
        setReferralStatus('success')
        setReferralMsg(`+${data.xpEarned} XP adicionados ao seu perfil!`)
        if (navigator.vibrate) navigator.vibrate([30, 20, 80])
      }
    } catch {
      setReferralStatus('error')
      setReferralMsg('Erro de conexão.')
    }
  }

  if (!code) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,217,255,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(0,217,255,0.18)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-5 flex items-center gap-3 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.25)' }}
        >
          <Gift size={18} style={{ color: '#00D9FF' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Programa de Indicação</div>
          <div className="text-xs text-text-muted mt-0.5">
            Indique amigos e ambos ganham{' '}
            <span className="font-bold" style={{ color: '#F5C842' }}>+200 XP</span>
            {count > 0 && (
              <span className="ml-1 text-text-muted">· {count} indicado{count !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-text-muted shrink-0" /> : <ChevronDown size={16} className="text-text-muted shrink-0" />}
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">

          {/* Your code */}
          <div>
            <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">Seu código</div>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 px-4 py-3 rounded-xl font-black text-xl tracking-[0.2em] text-center"
                style={{
                  background: 'rgba(0,217,255,0.08)',
                  border: '1px solid rgba(0,217,255,0.25)',
                  color: '#00D9FF',
                  letterSpacing: '0.25em',
                }}
              >
                {code}
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
                style={{
                  background: copied ? 'rgba(0,255,136,0.12)' : 'rgba(0,217,255,0.12)',
                  border: copied ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(0,217,255,0.3)',
                  color: copied ? '#00FF88' : '#00D9FF',
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copiado!' : 'Compartilhar'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-center gap-1 text-xl font-black" style={{ color: '#00D9FF' }}>
                <Users size={16} />
                {count}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">Indicados</div>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-center gap-1 text-xl font-black" style={{ color: '#F5C842' }}>
                <Zap size={16} fill="currentColor" />
                {(count * 200).toLocaleString('pt-BR')}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">XP ganho</div>
            </div>
          </div>

          {/* Redeem someone else's code */}
          {referralStatus !== 'success' && (
            <div>
              <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">Tem um código de amigo?</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralInput}
                  onChange={e => setReferralInput(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={12}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold tracking-widest outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                />
                <button
                  onClick={handleRedeem}
                  disabled={referralStatus === 'loading' || !referralInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: '#FF4D00', color: '#fff' }}
                >
                  {referralStatus === 'loading' ? '...' : 'Aplicar'}
                </button>
              </div>
              {referralStatus === 'error' && (
                <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>{referralMsg}</p>
              )}
            </div>
          )}

          {referralStatus === 'success' && (
            <div
              className="p-3 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
            >
              <Check size={14} style={{ color: '#00FF88' }} />
              <span className="text-sm font-bold" style={{ color: '#00FF88' }}>{referralMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
