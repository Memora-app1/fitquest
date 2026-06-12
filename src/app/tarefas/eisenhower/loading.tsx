function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded-full"
          style={{ background: 'rgba(21,34,56,0.9)', width: w }}
        />
      ))}
    </div>
  );
}

function TaskItem({ index }: { index: number }) {
  const widths = ['90%', '70%', '80%', '55%', '75%'];
  const w = widths[index % widths.length]!;
  return (
    <div
      className="flex animate-pulse items-start gap-2.5 rounded-xl p-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div
        className="mt-0.5 h-4 w-4 shrink-0 rounded"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
      <div className="flex-1 space-y-1.5">
        <div
          className="h-3 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)', width: w }}
        />
        {index % 3 === 0 && (
          <div
            className="h-2.5 w-3/5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        )}
      </div>
    </div>
  );
}

function QuadrantCard({
  urgent,
  important,
  taskCount,
  startIndex,
}: {
  urgent: boolean;
  important: boolean;
  taskCount: number;
  startIndex: number;
}) {
  const accent =
    urgent && important
      ? '#EF4444'
      : !urgent && important
        ? '#F5C842'
        : urgent && !important
          ? '#F97316'
          : '#8899BB';

  const label =
    urgent && important
      ? 'Fazer Agora'
      : !urgent && important
        ? 'Agendar'
        : urgent && !important
          ? 'Delegar'
          : 'Eliminar';

  const quadrantLabel =
    urgent && important ? 'I' : !urgent && important ? 'II' : urgent && !important ? 'III' : 'IV';

  return (
    <div
      className="animate-pulse space-y-3 rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${accent}07 0%, rgba(13,24,41,0.95) 100%)`,
        border: `1px solid ${accent}20`,
        minHeight: 240,
      }}
    >
      {/* Quadrant header */}
      <div
        className="flex items-center justify-between pb-2"
        style={{ borderBottom: `1px solid ${accent}15` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black"
            style={{ background: `${accent}20`, color: accent }}
          >
            {quadrantLabel}
          </div>
          <div className="h-3.5 w-24 rounded-full" style={{ background: `${accent}18` }} />
        </div>
        <div className="h-5 w-5 rounded-full" style={{ background: `${accent}12` }} />
      </div>

      {/* Badge row */}
      <div className="flex gap-1.5">
        {urgent && (
          <div
            className="h-5 w-16 rounded-full"
            style={{
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          />
        )}
        {important && (
          <div
            className="w-18 h-5 rounded-full"
            style={{
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          />
        )}
      </div>

      {/* Task items */}
      <div className="space-y-2">
        {Array.from({ length: taskCount }).map((_, i) => (
          <TaskItem key={i} index={startIndex + i} />
        ))}
      </div>

      {/* Add placeholder */}
      <div
        className="h-8 rounded-xl"
        style={{ background: `${accent}05`, border: `1px dashed ${accent}15` }}
      />
    </div>
  );
}

export default function EisenhowerLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Hero header */}
      <div
        className="relative animate-pulse overflow-hidden rounded-2xl p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(239,68,68,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div
              className="h-10 w-56 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            <div
              className="h-3 w-64 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div className="flex gap-2">
            <div
              className="h-9 w-24 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <div
              className="h-9 w-32 rounded-xl"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.22)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Axis labels */}
      <div className="relative animate-pulse" style={{ paddingLeft: 16, paddingTop: 16 }}>
        {/* X-axis label */}
        <div className="mb-2 text-center">
          <ShimmerRow widths={['5rem', '8rem', '5rem']} />
        </div>

        <div className="flex gap-4">
          {/* Y-axis label */}
          <div
            className="flex items-center justify-center"
            style={{ writingMode: 'vertical-rl', width: 24 }}
          >
            <div
              className="h-3 w-24 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          {/* 2x2 Quadrant grid */}
          <div className="grid flex-1 grid-cols-2 gap-4">
            <QuadrantCard urgent important taskCount={3} startIndex={0} />
            <QuadrantCard urgent={false} important taskCount={2} startIndex={3} />
            <QuadrantCard urgent important={false} taskCount={2} startIndex={5} />
            <QuadrantCard urgent={false} important={false} taskCount={1} startIndex={7} />
          </div>
        </div>
      </div>
    </div>
  );
}
