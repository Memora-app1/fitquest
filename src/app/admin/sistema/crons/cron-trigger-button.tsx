'use client'

import { useState } from 'react'
import { Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Props {
  path: string
}

export function CronTriggerButton({ path }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [detail, setDetail] = useState('')

  async function trigger() {
    setStatus('loading')
    setDetail('')
    try {
      const res = await fetch('/api/admin/sistema/trigger-cron', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ path }),
      })
      const data = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (!res.ok || !data.ok) {
        setStatus('error')
        setDetail(data.message ?? data.error ?? 'Falhou')
      } else {
        setStatus('ok')
        setDetail(data.message ?? 'Executado')
      }
    } catch (e) {
      setStatus('error')
      setDetail(e instanceof Error ? e.message : 'Erro de rede')
    }
    setTimeout(() => { setStatus('idle'); setDetail('') }, 4000)
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold opacity-60"
        style={{ background: 'rgba(255,255,255,0.04)', color: '#8899BB' }}>
        <Loader2 size={11} className="animate-spin" /> Executando…
      </div>
    )
  }

  if (status === 'ok') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(0,255,136,0.08)', color: '#00FF88' }}>
        <CheckCircle2 size={11} /> {detail}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(255,77,0,0.08)', color: '#FF4D00' }}>
        <XCircle size={11} /> {detail}
      </div>
    )
  }

  return (
    <button
      onClick={trigger}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
      style={{ background: 'rgba(245,200,66,0.08)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.2)' }}
    >
      <Play size={11} fill="currentColor" /> Executar
    </button>
  )
}
