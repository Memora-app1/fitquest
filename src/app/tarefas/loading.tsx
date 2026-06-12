function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {widths.map((w, i) => (
        <div key={i} className="shimmer h-3 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}

function TaskCard({
  urgent,
  important,
  index,
}: {
  urgent?: boolean;
  important?: boolean;
  index: number;
}) {
  const widths = ['85%', '65%', '90%', '70%', '80%', '55%'];
  const w = widths[index % widths.length]!;

  return (
    <div
      className="space-y-2 rounded-xl p-3.5"
      style={{
        background:
          urgent && important
            ? 'rgba(239,68,68,0.05)'
            : urgent
              ? 'rgba(249,115,22,0.04)'
              : important
                ? 'rgba(124,58,237,0.04)'
                : 'rgba(21,34,56,0.5)',
        border: `1px solid ${urgent && important ? 'rgba(239,68,68,0.13)' : urgent ? 'rgba(249,115,22,0.1)' : important ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div className="flex items-start gap-2">
        <div className="shimmer mt-0.5 h-4 w-4 shrink-0 rounded" />
        <div className="flex-1 space-y-1.5">
          <div className="shimmer h-3 rounded-full" style={{ width: w }} />
          {index % 2 === 0 && <div className="shimmer h-2.5 w-3/4 rounded-full" />}
        </div>
      </div>
      {(urgent || important) && (
        <div className="flex gap-1">
          {urgent && (
            <div
              className="shimmer h-5 w-14 rounded-full"
              style={{ border: '1px solid rgba(249,115,22,0.2)' }}
            />
          )}
          {important && (
            <div
              className="shimmer h-5 w-16 rounded-full"
              style={{ border: '1px solid rgba(124,58,237,0.2)' }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  accent,
  cardIndexes,
}: {
  title: string;
  accent: string;
  count: number;
  cardIndexes: { urgent?: boolean; important?: boolean; index: number }[];
}) {
  return (
    <div
      className="space-y-3 rounded-2xl p-4"
      style={{
        background: 'rgba(13,24,41,0.6)',
        border: `1px solid ${accent}18`,
        minHeight: 320,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between pb-2"
        style={{ borderBottom: `1px solid ${accent}15` }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: accent, opacity: 0.7 }} />
          <div className="shimmer h-3.5 w-20 rounded-full" />
        </div>
        <div className="shimmer h-5 w-6 rounded-full" />
      </div>
      {/* Cards */}
      {cardIndexes.map(({ urgent, important, index }, i) => (
        <TaskCard key={i} urgent={urgent} important={important} index={index} />
      ))}
      {/* Add task placeholder */}
      <div className="shimmer h-9 rounded-xl" style={{ border: `1px dashed ${accent}18` }} />
    </div>
  );
}

export default function TarefasLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="shimmer h-10 w-32 rounded-xl" />
            <div className="shimmer h-3 w-56 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div
              className="shimmer h-9 w-24 rounded-xl"
              style={{ border: '1px solid rgba(124,58,237,0.25)' }}
            />
            <div
              className="shimmer h-9 w-28 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { accent: '#7C3AED' },
          { accent: '#F5C842' },
          { accent: '#00FF88' },
          { accent: '#EF4444' },
        ].map(({ accent }, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${accent}0E 0%, rgba(13,24,41,0.98) 100%)`,
              border: `1px solid ${accent}20`,
            }}
          >
            <div className="space-y-2">
              <ShimmerRow widths={['0.75rem', '3.5rem']} />
              <div className="shimmer h-8 w-12 rounded-xl" />
              <div className="shimmer h-2.5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* View toggle placeholder */}
      <div className="flex items-center gap-2">
        <div
          className="shimmer h-9 w-28 rounded-xl"
          style={{ border: '1px solid rgba(124,58,237,0.25)' }}
        />
        <div
          className="shimmer h-9 w-28 rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <div
          className="shimmer ml-auto h-9 w-36 rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          cardIndexes={[{ urgent: true, important: true, index: 4 }, { index: 5 }]}
        />
        <KanbanColumn
          title="Concluídas"
          accent="#00FF88"
          count={3}
          cardIndexes={[{ index: 6 }, { index: 7 }, { index: 8 }]}
        />
      </div>
    </div>
  );
}
