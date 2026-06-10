'use client'

import { useState } from 'react'

interface FeatureFlag {
  id:          string
  slug:        string
  name:        string
  description: string | null
  enabled:     boolean
  rollout_pct: number | null
  segment:     string | null
  updated_at:  string
}

interface Props {
  flag:    FeatureFlag
  canEdit: boolean
}

export function FeatureFlagToggle({ flag, canEdit }: Props) {
  const [enabled, setEnabled] = useState(flag.enabled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!canEdit) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: flag.id, enabled: !enabled }),
      })
      if (res.ok) setEnabled(e => !e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-4"
      style={{
        background: enabled ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${enabled ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)'}`,
        transition: 'all 0.2s',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold" style={{ color: '#fff' }}>{flag.name}</span>
          <code
            className="text-[11px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8899BB' }}
          >
            {flag.slug}
          </code>
          {flag.rollout_pct !== null && (
            <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: 'rgba(245,200,66,0.1)', color: '#F5C842' }}>
              {flag.rollout_pct}% rollout
            </span>
          )}
          {flag.segment && (
            <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
              {flag.segment}
            </span>
          )}
        </div>
        {flag.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: '#8899BB' }}>{flag.description}</p>
        )}
        <p className="text-[10px] mt-1" style={{ color: '#8899BB' }}>
          Atualizado: {new Date(flag.updated_at).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Toggle switch */}
      <button
        onClick={toggle}
        disabled={loading || !canEdit}
        className="relative w-11 h-6 rounded-full transition-all shrink-0 disabled:opacity-50"
        style={{
          background: enabled ? '#00FF88' : 'rgba(255,255,255,0.1)',
          cursor: canEdit ? 'pointer' : 'not-allowed',
        }}
        aria-label={enabled ? 'Desativar' : 'Ativar'}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
          style={{
            background: '#fff',
            left: enabled ? '22px' : '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>

      <div
        className="text-xs font-bold w-16 text-right shrink-0"
        style={{ color: enabled ? '#00FF88' : '#8899BB' }}
      >
        {loading ? '...' : enabled ? 'Ativo' : 'Inativo'}
      </div>
    </div>
  )
}
