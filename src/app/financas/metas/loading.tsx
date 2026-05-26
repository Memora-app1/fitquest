function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex gap-2 items-center">
      {widths.map((w, i) => (
        <div
          key={i}
          className="animate-pulse rounded-full h-3"
          style={{ background: 'rgba(21,34,56,0.9)', width: w }}
        />
      ))}
    </div>
  )
}

function GoalCard({ accent, progress }: { accent: string; progress: number }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden animate-pulse"
      style={{
        background: `linear-gradient(135deg, ${accent}09 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}20`,
      }}
    >
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none blur-xl"
        style={{ background: `${accent}20` }}
      />
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl shrink-0"
            style={{ background: `${accent}15`, border: `1px solid ${accent}20` }}
          />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3.5 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.09)' }} />
            <div className="h-2.5 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="h-6 w-12 rounded-full shrink-0" style={{ background: `${accent}12` }} />
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'Atual', big: true }, { label: 'Meta', big: false }, { label: 'Faltam', big: false }].map(({ label, big }, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div
                className={`rounded-lg ${big ? 'h-7 w-24' : 'h-5 w-20'}`}
                style={{ background: i === 0 ? `${accent}15` : 'rgba(255,255,255,0.06)' }}
              />
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="h-2.5 w-10 rounded-full" style={{ background: `${accent}15` }} />
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${accent}80, ${accent}40)`,
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <div className="h-9 flex-1 rounded-xl" style={{ background: `${accent}10`, border: `1px solid ${accent}18` }} />
          <div className="h-9 w-9 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      </div>
    </div>
  )
}

export default function MetasLoading() {
  const goals = [
    { accent: '#00FF88', progress: 68 },
    { accent: '#F5C842', progress: 35 },
    { accent: '#7C3AED', progress: 85 },
    { accent: '#3B82F6', progress: 20 },
  ]

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)',
          border: '1px solid rgba(0,255,136,0.18)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-10 w-44 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-56 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="h-10 w-36 rounded-xl" style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.22)' }} />
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="rounded-2xl p-4 animate-pulse"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          {[{ accent: '#00FF88', label: 'Ativas' }, { accent: '#F5C842', label: 'Progresso médio' }, { accent: '#3B82F6', label: 'Concluídas' }].map(({ accent }, i) => (
            <div key={i} className="space-y-1">
              <div className="h-7 w-12 rounded-lg mx-auto" style={{ background: `${accent}12` }} />
              <div className="h-2.5 w-20 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Goals list */}
      <div className="space-y-4">
        <ShimmerRow widths={['6rem']} />
        {goals.map(({ accent, progress }, i) => (
          <GoalCard key={i} accent={accent} progress={progress} />
        ))}
      </div>
    </div>
  )
}
