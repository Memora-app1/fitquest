function ShimmerRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {widths.map((w, i) => (
        <div key={i} className="shimmer h-3 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}

function SettingRow() {
  return (
    <div
      className="flex items-center gap-4 py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="shimmer h-9 w-9 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <div className="shimmer h-3.5 w-36 rounded-full" />
        <div className="shimmer h-2.5 w-52 rounded-full" />
      </div>
      <div className="shimmer h-5 w-5 shrink-0 rounded" />
    </div>
  );
}

function StorageBar({ pct, accent }: { pct: number; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: accent }} />
      <div className="flex-1 space-y-1">
        <div className="flex justify-between">
          <div className="shimmer h-2.5 w-16 rounded-full" />
          <div className="shimmer h-2.5 w-12 rounded-full" />
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: accent, opacity: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PerfilLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
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
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar */}
          <div
            className="relative h-20 w-20 shrink-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(255,77,0,0.15))',
              border: '2px solid rgba(124,58,237,0.3)',
            }}
          >
            <div className="shimmer absolute bottom-1 right-1 h-5 w-5 rounded-full" />
          </div>
          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="shimmer h-6 w-40 rounded-xl" />
            <div className="shimmer h-3 w-36 rounded-full" />
            <div className="mt-1 flex gap-2">
              <div
                className="shimmer h-6 w-16 rounded-lg"
                style={{ border: '1px solid rgba(124,58,237,0.25)' }}
              />
              <div
                className="shimmer h-6 w-16 rounded-lg"
                style={{ border: '1px solid rgba(255,77,0,0.2)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="shimmer mb-4 h-4 w-28 rounded-full" />
        <div className="space-y-4">
          {[{ w: '60%' }, { w: '70%' }].map(({ w }, i) => (
            <div key={i} className="space-y-1.5">
              <div className="shimmer h-2.5 w-16 rounded-full" />
              <div
                className="h-11 w-full rounded-xl"
                style={{
                  background: 'rgba(21,34,56,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>
          ))}
          <div
            className="shimmer mt-2 h-10 w-full rounded-xl"
            style={{ border: '1px solid rgba(124,58,237,0.25)' }}
          />
        </div>
      </div>

      {/* Storage breakdown */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <ShimmerRow widths={['1rem', '6rem']} />
          <div className="shimmer h-5 w-24 rounded-full" />
        </div>
        {/* Overall bar */}
        <div
          className="mb-4 h-3 overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full w-2/5 rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(124,58,237,0.5), rgba(255,77,0,0.4))',
            }}
          />
        </div>
        <div className="space-y-3">
          <StorageBar pct={45} accent="#7C3AED" />
          <StorageBar pct={30} accent="#FF4D00" />
          <StorageBar pct={15} accent="#F5C842" />
        </div>
      </div>

      {/* Settings sections */}
      <div
        className="rounded-2xl px-5"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="shimmer my-4 h-4 w-32 rounded-full" />
        <SettingRow />
        <SettingRow />
        <SettingRow />
        <div className="h-px" />
      </div>

      {/* Subscription card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="shimmer h-3.5 w-24 rounded-full" />
            <div className="shimmer h-6 w-32 rounded-xl" />
            <div className="shimmer h-2.5 w-40 rounded-full" />
          </div>
          <div
            className="shimmer h-10 w-28 rounded-xl"
            style={{ border: '1px solid rgba(124,58,237,0.35)' }}
          />
        </div>
      </div>

      {/* Danger zone */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}
      >
        <ShimmerRow widths={['5rem']} />
        <div
          className="shimmer mt-3 h-10 w-40 rounded-xl"
          style={{ border: '1px solid rgba(239,68,68,0.2)' }}
        />
      </div>
    </div>
  );
}
