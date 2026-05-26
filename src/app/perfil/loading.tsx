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

function SettingRow() {
  return (
    <div className="flex items-center gap-4 py-4 animate-pulse" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-36 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-2.5 w-52 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div className="w-5 h-5 rounded shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

function StorageBar({ pct, accent }: { pct: number; accent: string }) {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: accent }} />
      <div className="flex-1 space-y-1">
        <div className="flex justify-between">
          <div className="h-2.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-2.5 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent, opacity: 0.4 }} />
        </div>
      </div>
    </div>
  )
}

export default function PerfilLoading() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">

      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.18)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl shrink-0 relative"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(255,77,0,0.15))',
              border: '2px solid rgba(124,58,237,0.3)',
            }}
          >
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="h-3 w-36 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="flex gap-2 mt-1">
              <div className="h-6 w-16 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }} />
              <div className="h-6 w-16 rounded-lg" style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.2)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile card */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="h-4 w-28 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="space-y-4">
          {[{ label: 'Nome', w: '60%' }, { label: 'Email', w: '70%' }].map(({ w }, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div
                className="h-11 w-full rounded-xl"
                style={{ background: 'rgba(21,34,56,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          ))}
          <div className="h-10 w-full rounded-xl mt-2" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }} />
        </div>
      </div>

      {/* Storage breakdown */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <ShimmerRow widths={['1rem', '6rem']} />
          <div className="h-5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        {/* Overall bar */}
        <div className="h-3 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full w-2/5 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.5), rgba(255,77,0,0.4))' }} />
        </div>
        <div className="space-y-3">
          <StorageBar pct={45} accent="#7C3AED" />
          <StorageBar pct={30} accent="#FF4D00" />
          <StorageBar pct={15} accent="#F5C842" />
        </div>
      </div>

      {/* Settings sections */}
      <div
        className="rounded-2xl px-5 animate-pulse"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="h-4 w-32 rounded-full py-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <SettingRow />
        <SettingRow />
        <SettingRow />
        <div className="h-px" />
      </div>

      {/* Subscription card */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="h-6 w-32 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)' }} />
            <div className="h-2.5 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="h-10 w-28 rounded-xl" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)' }} />
        </div>
      </div>

      {/* Danger zone */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}
      >
        <ShimmerRow widths={['5rem']} />
        <div className="mt-3 h-10 w-40 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }} />
      </div>
    </div>
  )
}
