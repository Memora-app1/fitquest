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

function EventRow({ accent }: { accent: string }) {
  const widths = ['65%', '80%', '55%', '75%', '60%', '70%'];
  const w = widths[Math.floor(Math.random() * widths.length)];
  return (
    <div className="flex animate-pulse items-center gap-3 px-4 py-3.5">
      <div
        className="w-1 shrink-0 self-stretch rounded-full"
        style={{ background: accent, opacity: 0.6 }}
      />
      <div className="h-10 w-10 shrink-0 rounded-xl" style={{ background: `${accent}12` }} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div
          className="h-3.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)', width: w }}
        />
        <div className="flex gap-2">
          <div
            className="h-2.5 w-20 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
          <div className="h-2.5 w-14 rounded-full" style={{ background: `${accent}15` }} />
        </div>
      </div>
      <div
        className="h-6 w-14 shrink-0 rounded-full"
        style={{ background: `${accent}10`, border: `1px solid ${accent}18` }}
      />
    </div>
  );
}

export default function CalendarioLoading() {
  const eventAccents = ['#7C3AED', '#FF4D00', '#00FF88', '#F5C842', '#3B82F6', '#7C3AED'];
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      {/* Hero header */}
      <div
        className="relative animate-pulse overflow-hidden rounded-2xl p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div
              className="h-10 w-36 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            <div
              className="h-3 w-48 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div className="flex gap-2">
            <div
              className="h-9 w-28 rounded-xl"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.22)',
              }}
            />
            <div
              className="h-9 w-24 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Month/week nav */}
      <div
        className="animate-pulse rounded-2xl p-4"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div
              className="h-5 w-32 rounded-full"
              style={{ background: 'rgba(255,255,255,0.09)' }}
            />
            <div className="h-8 w-8 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="flex gap-1.5">
            <div
              className="h-8 w-16 rounded-xl"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            />
            <div className="h-8 w-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="h-8 w-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayLabels.map((d) => (
            <div key={d} className="text-center">
              <div
                className="mx-auto h-2.5 w-6 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>
          ))}
        </div>

        {/* Calendar grid — 5 weeks */}
        {Array.from({ length: 5 }).map((_, week) => (
          <div key={week} className="mb-1 grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, day) => {
              const cellNum = week * 7 + day;
              const isToday = cellNum === 17;
              const hasEvent = [3, 7, 10, 14, 17, 21, 24, 26, 30].includes(cellNum);
              const isOtherMonth = cellNum < 2 || cellNum > 31;

              return (
                <div
                  key={day}
                  className="relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl"
                  style={{
                    background: isToday ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                    border: isToday
                      ? '2px solid rgba(59,130,246,0.5)'
                      : '1px solid rgba(255,255,255,0.03)',
                    opacity: isOtherMonth ? 0.3 : 1,
                  }}
                >
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{
                      background: isToday ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                    }}
                  />
                  {hasEvent && (
                    <div className="flex gap-0.5">
                      <div
                        className="h-1 w-1 rounded-full"
                        style={{ background: 'rgba(124,58,237,0.6)' }}
                      />
                      {cellNum === 17 && (
                        <div
                          className="h-1 w-1 rounded-full"
                          style={{ background: 'rgba(255,77,0,0.6)' }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <div className="space-y-3">
        <div className="flex animate-pulse items-center justify-between">
          <ShimmerRow widths={['1rem', '8rem']} />
          <div className="h-5 w-14 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div
          className="animate-pulse overflow-hidden rounded-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {eventAccents.map((accent, i) => (
            <div
              key={i}
              style={{
                borderBottom:
                  i < eventAccents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <EventRow accent={accent} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
