function MessageBubble({ side, widths }: { side: 'left' | 'right'; widths: string[] }) {
  const isRight = side === 'right';
  return (
    <div className={`flex items-end gap-3 ${isRight ? 'flex-row-reverse' : ''}`}>
      {!isRight && (
        <div
          className="mb-1 h-8 w-8 shrink-0 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.3)' }}
        />
      )}
      <div
        className={`max-w-[72%] space-y-1.5 ${isRight ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {widths.map((w, i) => (
          <div
            key={i}
            className="shimmer h-10 rounded-2xl"
            style={{
              width: w,
              borderBottomRightRadius: isRight ? 4 : undefined,
              borderBottomLeftRadius: !isRight ? 4 : undefined,
            }}
          />
        ))}
        <div
          className="shimmer h-2.5 w-16 rounded-full"
          style={{ alignSelf: isRight ? 'flex-end' : 'flex-start' }}
        />
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-end gap-3">
      <div
        className="mb-1 h-8 w-8 shrink-0 rounded-xl"
        style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.3)' }}
      />
      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-3"
        style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full"
            style={{
              background: 'rgba(124,58,237,0.5)',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CoachLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
      {/* Header */}
      <div
        className="shrink-0 p-4 md:p-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'rgba(124,58,237,0.2)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <div className="h-6 w-6 rounded-lg" style={{ background: 'rgba(124,58,237,0.4)' }} />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="shimmer h-4 w-28 rounded-full" />
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: 'rgba(0,255,136,0.5)' }}
                />
                <div className="shimmer h-2.5 w-24 rounded-full" />
              </div>
            </div>
            <div
              className="shimmer h-8 w-24 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-5 overflow-hidden p-4 md:p-6">
        <MessageBubble side="left" widths={['280px', '220px', '180px']} />
        <MessageBubble side="right" widths={['200px']} />
        <MessageBubble side="left" widths={['260px', '240px', '200px', '160px']} />
        <MessageBubble side="right" widths={['160px']} />
        <MessageBubble side="left" widths={['240px', '210px', '190px']} />
        <ThinkingDots />
      </div>

      {/* Quick suggestions */}
      <div
        className="shrink-0 px-4 pb-3 md:px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex gap-2 overflow-hidden pt-3">
          {[120, 100, 140, 110].map((w, i) => (
            <div key={i} className="shimmer h-8 shrink-0 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 p-4 md:p-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,24,41,0.8)' }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(21,34,56,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="shimmer h-5 flex-1 rounded-full" />
          <div
            className="shimmer h-9 w-9 shrink-0 rounded-xl"
            style={{ border: '1px solid rgba(124,58,237,0.2)' }}
          />
        </div>
        <div className="mt-2 text-center">
          <div className="shimmer mx-auto h-2.5 w-48 rounded-full" />
        </div>
      </div>
    </div>
  );
}
