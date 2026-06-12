function PlanCard({
  accent,
  accentRgb,
  highlight = false,
}: {
  accent: string;
  accentRgb: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="relative flex animate-pulse flex-col overflow-hidden rounded-2xl p-8"
      style={{
        background: highlight
          ? `linear-gradient(135deg, rgba(${accentRgb},0.1) 0%, rgba(13,24,41,0.99) 100%)`
          : `linear-gradient(135deg, rgba(${accentRgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
        border: highlight
          ? `2px solid rgba(${accentRgb},0.45)`
          : `1px solid rgba(${accentRgb},0.22)`,
        boxShadow: highlight
          ? `0 24px 60px rgba(0,0,0,0.4), 0 0 50px rgba(${accentRgb},0.1)`
          : 'none',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(${accentRgb},0.15) 0%, transparent 70%)`,
        }}
      />

      {/* Popular badge slot */}
      {highlight && (
        <div
          className="absolute -top-3.5 left-1/2 h-6 w-32 -translate-x-1/2 rounded-full"
          style={{ background: `rgba(${accentRgb},0.3)` }}
        />
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        {/* Plan icon + name */}
        <div className="mb-7 space-y-3 text-center">
          <div
            className="mx-auto h-12 w-12 rounded-2xl"
            style={{ background: `rgba(${accentRgb},0.12)` }}
          />
          <div
            className="mx-auto h-6 w-24 rounded-xl"
            style={{ background: `rgba(${accentRgb},0.18)` }}
          />
          {/* Price */}
          <div className="space-y-1">
            <div
              className="mx-auto h-12 w-32 rounded-xl"
              style={{ background: `rgba(${accentRgb},0.15)` }}
            />
            <div
              className="mx-auto h-3 w-28 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            {highlight && (
              <div
                className="mx-auto mt-2 h-5 w-44 rounded-full"
                style={{
                  background: 'rgba(0,255,136,0.1)',
                  border: '1px solid rgba(0,255,136,0.14)',
                }}
              />
            )}
          </div>
        </div>

        {/* Feature list */}
        <div className="mb-8 flex-1 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: 'rgba(0,255,136,0.15)' }}
              />
              <div
                className="h-3 flex-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  width: `${60 + (i % 3) * 15}%`,
                  maxWidth: '100%',
                }}
              />
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div
          className="h-12 w-full rounded-xl"
          style={{
            background: highlight ? `rgba(${accentRgb},0.7)` : `rgba(${accentRgb},0.12)`,
            border: highlight ? 'none' : `1px solid rgba(${accentRgb},0.3)`,
          }}
        />
      </div>
    </div>
  );
}

function FeatureRow({ alternate }: { alternate: boolean }) {
  return (
    <tr
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: alternate ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}
    >
      <td className="p-4">
        <div
          className="h-3 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.07)',
            width: `${50 + Math.floor(Math.random() * 30)}%`,
          }}
        />
      </td>
      {[0, 1, 2].map((i) => (
        <td
          key={i}
          className="p-4 text-center"
          style={{ background: i === 1 ? 'rgba(255,77,0,0.04)' : 'transparent' }}
        >
          <div
            className="mx-auto h-4 w-4 rounded-full"
            style={{ background: 'rgba(0,255,136,0.15)' }}
          />
        </td>
      ))}
    </tr>
  );
}

function TestimonialCard({ accentRgb }: { accentRgb: string }) {
  return (
    <div
      className="relative animate-pulse space-y-4 overflow-hidden rounded-2xl p-6"
      style={{
        background: `linear-gradient(135deg, rgba(${accentRgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid rgba(${accentRgb},0.18)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
        style={{ background: `rgba(${accentRgb},0.12)` }}
      />
      <div className="relative z-10 space-y-3">
        {/* Stars */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-sm"
              style={{ background: 'rgba(245,200,66,0.3)' }}
            />
          ))}
        </div>
        {/* Text */}
        <div className="space-y-1.5">
          <div
            className="h-3 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', width: '90%' }}
          />
          <div
            className="h-3 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', width: '75%' }}
          />
          <div
            className="h-3 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', width: '60%' }}
          />
        </div>
        {/* Author */}
        <div className="space-y-1.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-3 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.09)' }} />
          <div
            className="h-2.5 w-32 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PlanosLoading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-20 px-4 py-12">
        {/* Hero section */}
        <div className="animate-pulse space-y-5 text-center">
          {/* Logo text */}
          <div
            className="mx-auto h-8 w-28 rounded-xl"
            style={{ background: 'rgba(255,77,0,0.2)' }}
          />
          {/* Main headline */}
          <div className="space-y-2">
            <div
              className="mx-auto h-16 w-3/4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
          </div>
          {/* Subtitle */}
          <div
            className="mx-auto h-4 w-96 max-w-full rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
          {/* Trial badge */}
          <div
            className="mx-auto h-9 w-64 rounded-full"
            style={{ background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.2)' }}
          />
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          <PlanCard accent="#3B82F6" accentRgb="59,130,246" />
          <PlanCard accent="#FF4D00" accentRgb="255,77,0" highlight />
          <PlanCard accent="#F5C842" accentRgb="245,200,66" />
        </div>

        {/* Trust signals */}
        <div className="flex animate-pulse flex-wrap justify-center gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div
                className="h-3 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', width: `${80 + i * 20}px` }}
              />
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div
          className="animate-pulse overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.04) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(255,77,0,0.14)',
          }}
        >
          {/* Header */}
          <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="h-7 w-52 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="w-1/2 p-4 text-left">
                  <div
                    className="h-3 w-28 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                </th>
                {['59,130,246', '255,77,0', '245,200,66'].map((rgb, i) => (
                  <th
                    key={i}
                    className="p-4 text-center"
                    style={{ background: i === 1 ? 'rgba(255,77,0,0.05)' : 'transparent' }}
                  >
                    <div
                      className="mx-auto h-4 w-16 rounded-full"
                      style={{ background: `rgba(${rgb},0.2)` }}
                    />
                    {i === 1 && (
                      <div
                        className="mx-auto mt-1 h-2.5 w-20 rounded-full"
                        style={{ background: 'rgba(255,77,0,0.1)' }}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }).map((_, i) => (
                <FeatureRow key={i} alternate={i % 2 !== 0} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Testimonials */}
        <div className="space-y-6">
          <div
            className="mx-auto h-7 w-40 animate-pulse rounded-xl"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TestimonialCard accentRgb="255,77,0" />
            <TestimonialCard accentRgb="124,58,237" />
            <TestimonialCard accentRgb="245,200,66" />
          </div>
        </div>

        {/* FAQ skeleton */}
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div
            className="mx-auto mb-6 h-7 w-48 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl p-5"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(124,58,237,0.12)',
              }}
            >
              <div
                className="h-3 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', width: `${40 + i * 8}%` }}
              />
              <div
                className="ml-4 h-5 w-5 shrink-0 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div
          className="relative animate-pulse space-y-5 overflow-hidden rounded-2xl p-12 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.99) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(255,77,0,0.22)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10 space-y-4">
            <div
              className="mx-auto h-14 w-14 rounded-2xl"
              style={{ background: 'rgba(255,77,0,0.12)' }}
            />
            <div
              className="mx-auto h-12 w-72 max-w-full rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            <div
              className="mx-auto h-4 w-80 max-w-full rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <div
                className="h-12 w-52 rounded-xl"
                style={{
                  background: 'rgba(255,77,0,0.25)',
                  border: '1px solid rgba(255,77,0,0.3)',
                }}
              />
              <div
                className="h-12 w-36 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>
            <div
              className="mx-auto h-3 w-56 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
