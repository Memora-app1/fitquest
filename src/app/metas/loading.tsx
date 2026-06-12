function GoalCard({
  accent,
  progress,
  index,
}: {
  accent: string;
  progress: number;
  index: number;
}) {
  return (
    <div
      className="relative animate-pulse overflow-hidden rounded-2xl p-5"
      style={{
        background: `linear-gradient(135deg, ${accent}08 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}1E`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-xl"
        style={{ background: `${accent}18` }}
      />
      <div className="relative z-10 space-y-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-xl"
            style={{ background: `${accent}14`, border: `1px solid ${accent}1E` }}
          />
          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <div
              className="h-3.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.09)',
                width: index % 2 === 0 ? '70%' : '55%',
              }}
            />
            <div
              className="h-2.5 w-32 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div
            className="h-6 w-16 shrink-0 rounded-full"
            style={{ background: `${accent}12`, border: `1px solid ${accent}18` }}
          />
        </div>

        {/* Category badge + deadline */}
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-20 rounded-full"
            style={{ background: `${accent}0E`, border: `1px solid ${accent}16` }}
          />
          <div className="h-5 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div
              className="h-3 w-16 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <div className="h-3 w-12 rounded-full" style={{ background: `${accent}14` }} />
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${accent}80, ${accent}40)`,
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {['Atual', 'Meta', 'Faltam'].map((label, i) => (
              <div key={label} className="space-y-1">
                <div
                  className="mx-auto h-2.5 w-10 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
                <div
                  className="mx-auto h-6 rounded-lg"
                  style={{
                    width: i === 0 ? '80%' : '70%',
                    background: i === 0 ? `${accent}14` : 'rgba(255,255,255,0.06)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <div
            className="h-9 flex-1 rounded-xl"
            style={{ background: `${accent}0E`, border: `1px solid ${accent}16` }}
          />
          <div
            className="h-9 w-9 shrink-0 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          />
          <div
            className="h-9 w-9 shrink-0 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ accent }: { accent: string }) {
  return (
    <div className="animate-pulse space-y-1.5 text-center">
      <div
        className="mx-auto h-8 w-14 rounded-xl"
        style={{ background: `${accent}12`, border: `1px solid ${accent}18` }}
      />
      <div
        className="mx-auto h-2.5 w-20 rounded-full"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
    </div>
  );
}

export default function MetasLoading() {
  const goals = [
    { accent: '#00FF88', progress: 72, index: 0 },
    { accent: '#F5C842', progress: 38, index: 1 },
    { accent: '#7C3AED', progress: 88, index: 2 },
    { accent: '#3B82F6', progress: 24, index: 3 },
    { accent: '#FF4D00', progress: 55, index: 4 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Hero header */}
      <div
        className="relative animate-pulse overflow-hidden rounded-2xl p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)',
          border: '1px solid rgba(0,255,136,0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div
              className="h-10 w-32 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            <div
              className="h-3 w-52 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div
            className="h-10 w-36 rounded-xl"
            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
          />
        </div>
      </div>

      {/* Summary stats bar */}
      <div
        className="animate-pulse rounded-2xl p-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
          <SummaryCard accent="#00FF88" />
          <SummaryCard accent="#F5C842" />
          <SummaryCard accent="#7C3AED" />
          <SummaryCard accent="#FF4D00" />
          <SummaryCard accent="#3B82F6" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex animate-pulse gap-2">
        {['Todas', 'Ativas', 'Concluídas'].map((tab, i) => (
          <div
            key={tab}
            className="h-9 rounded-xl"
            style={{
              width: i === 0 ? '4.5rem' : i === 1 ? '4rem' : '5.5rem',
              background: i === 0 ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)',
              border:
                i === 0 ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}
          />
        ))}
        <div
          className="ml-auto h-9 w-9 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
      </div>

      {/* Goals grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {goals.map(({ accent, progress, index }) => (
          <GoalCard key={index} accent={accent} progress={progress} index={index} />
        ))}
      </div>

      {/* Empty state teaser — shows for the last odd card on desktop */}
      <div
        className="animate-pulse rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(255,255,255,0.01)',
          border: '2px dashed rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="mx-auto mb-3 h-10 w-10 rounded-xl"
          style={{ background: 'rgba(0,255,136,0.08)' }}
        />
        <div
          className="mx-auto mb-2 h-3 w-40 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
        <div
          className="mx-auto h-2.5 w-56 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>
    </div>
  );
}
