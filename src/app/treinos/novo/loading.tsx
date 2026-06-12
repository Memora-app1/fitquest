function FormField({
  labelWidth,
  inputHeight = 'h-11',
}: {
  labelWidth: string;
  inputHeight?: string;
}) {
  return (
    <div className="animate-pulse space-y-1.5">
      <div
        className="h-2.5 rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)', width: labelWidth }}
      />
      <div
        className={`w-full ${inputHeight} rounded-xl`}
        style={{ background: 'rgba(21,34,56,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
      />
    </div>
  );
}

function ExerciseSetRow({ index }: { index: number }) {
  return (
    <div className="flex animate-pulse items-center gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
        style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.14)' }}
      >
        <div className="h-3 w-4 rounded" style={{ background: 'rgba(0,255,136,0.2)' }} />
      </div>
      <div
        className="h-9 flex-1 rounded-xl"
        style={{ background: 'rgba(21,34,56,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
      />
      <div
        className="h-9 w-20 rounded-xl"
        style={{ background: 'rgba(21,34,56,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
      />
      <div
        className="h-9 w-20 rounded-xl"
        style={{ background: 'rgba(21,34,56,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
      />
      <div
        className="h-8 w-8 shrink-0 rounded-lg"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}
      />
    </div>
  );
}

function ExerciseCard({ accent, setCount = 3 }: { accent: string; setCount?: number }) {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${accent}07 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}18`,
      }}
    >
      {/* Exercise header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: `1px solid ${accent}0F` }}
      >
        <div
          className="h-10 w-10 shrink-0 rounded-xl"
          style={{ background: `${accent}12`, border: `1px solid ${accent}1C` }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="mb-1.5 h-3.5 w-40 rounded-full"
            style={{ background: 'rgba(255,255,255,0.09)' }}
          />
          <div
            className="h-2.5 w-24 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
        </div>
        <div className="flex shrink-0 gap-1.5">
          <div className="h-7 w-7 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-7 w-7 rounded-lg" style={{ background: 'rgba(239,68,68,0.07)' }} />
        </div>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
      >
        <div className="w-8 shrink-0" />
        <div className="h-2 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-2 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-2 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="w-8 shrink-0" />
      </div>

      {/* Sets */}
      <div className="space-y-2 px-4 py-2">
        {Array.from({ length: setCount }).map((_, i) => (
          <ExerciseSetRow key={i} index={i} />
        ))}
      </div>

      {/* Add set button */}
      <div className="px-4 pb-3 pt-1">
        <div
          className="h-8 w-full rounded-xl"
          style={{ background: `${accent}07`, border: `1px dashed ${accent}18` }}
        />
      </div>
    </div>
  );
}

export default function NovoTreinoLoading() {
  const exercises = [
    { accent: '#00FF88', setCount: 4 },
    { accent: '#F5C842', setCount: 3 },
    { accent: '#FF4D00', setCount: 3 },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      {/* Back nav */}
      <div className="flex animate-pulse items-center gap-3">
        <div
          className="h-9 w-9 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <div className="h-3 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Page header */}
      <div
        className="relative animate-pulse overflow-hidden rounded-2xl p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
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
            <div className="h-9 w-48 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div
              className="h-3 w-56 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          {/* Timer */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.18)' }}
          >
            <div className="h-3 w-3 rounded-full" style={{ background: 'rgba(0,255,136,0.4)' }} />
            <div className="h-5 w-16 rounded-lg" style={{ background: 'rgba(0,255,136,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Workout name field */}
      <div
        className="animate-pulse rounded-2xl p-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="mb-3 h-3 w-32 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div
          className="h-12 w-full rounded-xl"
          style={{ background: 'rgba(21,34,56,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <div
          className="mt-3 h-2.5 w-48 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>

      {/* Add exercise section */}
      <div
        className="animate-pulse rounded-2xl p-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div
            className="h-9 w-36 rounded-xl"
            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}
          />
        </div>

        {/* Search box */}
        <div className="relative">
          <div
            className="h-11 w-full rounded-xl"
            style={{ background: 'rgba(21,34,56,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* Quick muscle group filters */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps'].map((label, i) => (
            <div
              key={label}
              className="h-7 shrink-0 rounded-full"
              style={{
                width: label.length * 7 + 16,
                background: i === 0 ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)',
                border:
                  i === 0 ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Exercise cards */}
      <div className="space-y-4">
        {exercises.map(({ accent, setCount }, i) => (
          <ExerciseCard key={i} accent={accent} setCount={setCount} />
        ))}
      </div>

      {/* Summary before save */}
      <div
        className="animate-pulse rounded-2xl p-4"
        style={{ background: 'rgba(13,24,41,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-4">
            {[
              { label: 'Exercícios', accent: '#00FF88' },
              { label: 'Séries', accent: '#F5C842' },
              { label: 'Volume estimado', accent: '#FF4D00' },
            ].map(({ label, accent }) => (
              <div key={label} className="space-y-1 text-center">
                <div className="mx-auto h-5 w-8 rounded-lg" style={{ background: `${accent}14` }} />
                <div
                  className="h-2.5 w-16 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              </div>
            ))}
          </div>
          <div
            className="h-11 w-40 rounded-xl"
            style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.22)' }}
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-20 left-4 right-4 animate-pulse md:bottom-6 md:left-auto md:right-8 md:max-w-sm">
        <div
          className="h-14 w-full rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,204,106,0.9), rgba(0,255,136,0.85))',
            boxShadow: '0 8px 32px rgba(0,255,136,0.2)',
          }}
        />
      </div>
    </div>
  );
}
