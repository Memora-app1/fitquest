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

function TaskCard({ urgent, important, index }: { urgent?: boolean; important?: boolean; index: number }) {
  const widths = ['85%', '65%', '90%', '70%', '80%', '55%']
  const w = widths[index % widths.length]!
  const accent = urgent && important ? '#EF4444' : urgent ? '#F97316' : important ? '#7C3AED' : undefined

  return (
    <div
      className="rounded-xl p-3.5 animate-pulse space-y-2"
      style={{
        background: accent ? `rgba(${accent === '#EF4444' ? '239,68,68' : accent === '#F97316' ? '249,115,22' : '124,58,237'},0.05)` : 'rgba(21,34,56,0.5)',
        border: `1px solid ${accent ? `${accent}22` : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div className="flex items-start gap-2">
        <div className="w-4 h-4 rounded mt-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', width: w }} />
          {index % 2 === 0 && (
            <div className="h-2.5 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
          )}
        </div>
      </div>
      {(urgent || important) && (
        <div className="flex gap-1">
          {urgent && (
            <div className="h-5 w-14 rounded-full" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }} />
          )}
          {important && (
            <div className="h-5 w-16 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }} />
          )}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ title, accent, count, cardIndexes }: {
  title: string
  accent: string
  count: number
  cardIndexes: { urgent?: boolean; important?: boolean; index: number }[]
}) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3 animate-pulse"
      style={{
        background: 'rgba(13,24,41,0.6)',
        border: `1px solid ${accent}18`,
        minHeight: 320,
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${accent}15` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accent, opacity: 0.7 }} />
          <div className="h-3.5 w-20 rounded-full" style={{ background: `${accent}20` }} />
        </div>
        <div className="h-5 w-6 rounded-full" style={{ background: `${accent}15` }} />
      </div>
      {/* Cards */}
      {cardIndexes.map(({ urgent, important, index }, i) => (
        <TaskCard key={i} urgent={urgent} important={important} index={index} />
      ))}
      {/* Add task placeholder */}
      <div className="h-9 rounded-xl" style={{ background: `${accent}06`, border: `1px dashed ${accent}18` }} />
    </div>
  )
}

export default function TarefasLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.18)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-10 w-32 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-56 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }} />
            <div className="h-9 w-28 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { accent: '#7C3AED', label: 'A fazer' },
          { accent: '#F5C842', label: 'Em progresso' },
          { accent: '#00FF88', label: 'Concluídas' },
          { accent: '#EF4444', label: 'Críticas' },
        ].map(({ accent }, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 relative overflow-hidden animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${accent}0E 0%, rgba(13,24,41,0.98) 100%)`,
              border: `1px solid ${accent}20`,
            }}
          >
            <div className="space-y-2">
              <ShimmerRow widths={['0.75rem', '3.5rem']} />
              <div className="h-8 w-12 rounded-xl" style={{ background: `${accent}15` }} />
              <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* View toggle placeholder */}
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-9 w-28 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }} />
        <div className="h-9 w-28 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div className="ml-auto h-9 w-36 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KanbanColumn
          title="A Fazer"
          accent="#7C3AED"
          count={4}
          cardIndexes={[
            { urgent: true, important: true, index: 0 },
            { urgent: true, index: 1 },
            { important: true, index: 2 },
            { index: 3 },
          ]}
        />
        <KanbanColumn
          title="Em Progresso"
          accent="#F5C842"
          count={2}
          cardIndexes={[
            { urgent: true, important: true, index: 4 },
            { index: 5 },
          ]}
        />
        <KanbanColumn
          title="Concluídas"
          accent="#00FF88"
          count={3}
          cardIndexes={[
            { index: 6 },
            { index: 7 },
            { index: 8 },
          ]}
        />
      </div>
    </div>
  )
}
