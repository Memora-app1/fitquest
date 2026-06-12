'use client';

import { useState } from 'react';

interface FeatureFlag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_pct: number | null;
  segment: string | null;
  updated_at: string;
}

interface Props {
  flag: FeatureFlag;
  canEdit: boolean;
}

export function FeatureFlagToggle({ flag, canEdit }: Props) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!canEdit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag.id, enabled: !enabled }),
      });
      if (res.ok) setEnabled((e) => !e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4"
      style={{
        background: enabled ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${enabled ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)'}`,
        transition: 'all 0.2s',
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#fff' }}>
            {flag.name}
          </span>
          <code
            className="rounded px-1.5 py-0.5 font-mono text-[11px]"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8899BB' }}
          >
            {flag.slug}
          </code>
          {flag.rollout_pct !== null && (
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ background: 'rgba(245,200,66,0.1)', color: '#F5C842' }}
            >
              {flag.rollout_pct}% rollout
            </span>
          )}
          {flag.segment && (
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}
            >
              {flag.segment}
            </span>
          )}
        </div>
        {flag.description && (
          <p className="mt-0.5 truncate text-xs" style={{ color: '#8899BB' }}>
            {flag.description}
          </p>
        )}
        <p className="mt-1 text-[10px]" style={{ color: '#8899BB' }}>
          Atualizado: {new Date(flag.updated_at).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Toggle switch */}
      <button
        onClick={toggle}
        disabled={loading || !canEdit}
        className="relative h-6 w-11 shrink-0 rounded-full transition-all disabled:opacity-50"
        style={{
          background: enabled ? '#00FF88' : 'rgba(255,255,255,0.1)',
          cursor: canEdit ? 'pointer' : 'not-allowed',
        }}
        aria-label={enabled ? 'Desativar' : 'Ativar'}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
          style={{
            background: '#fff',
            left: enabled ? '22px' : '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>

      <div
        className="w-16 shrink-0 text-right text-xs font-bold"
        style={{ color: enabled ? '#00FF88' : '#8899BB' }}
      >
        {loading ? '...' : enabled ? 'Ativo' : 'Inativo'}
      </div>
    </div>
  );
}
