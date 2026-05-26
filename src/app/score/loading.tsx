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

function StatCard({ accent }: { accent: string }) {
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden animate-pulse"
      style={{
        background: `linear-gradient(135deg, ${accent}0E 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
        style={{ background: `${accent}25` }}
      />
      <div className="relative z-10 space-y-2">
        <ShimmerRow widths={['0.75rem', '4rem']} />
        <div className="h-8 w-16 rounded-xl" style={{ background: `${accent}15` }} />
        <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

function AchievementCard({ unlocked, accent }: { unlocked: boolean; accent?: string }) {
  const bg = accent ?? '#8899BB'
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden animate-pulse"
      style={{
        background: unlocked ? `rgba(${bg === '#F5C842' ? '245,200,66' : bg === '#7C3AED' ? '124,58,237' : bg === '#3B82F6' ? '59,130,246' : '136,153,187'},0.06)` : 'rgba(13,24,41,0.5)',
        border: unlocked ? `1px solid ${bg}20` : '1px solid rgba(255,255,255,0.04)',
        opacity: unlocked ? 1 : 0.6,
      }}
    >
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(5,9,20,0.4)' }}>
          <div className="w-5 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl shrink-0"
          style={{ background: unlocked ? `${bg}18` : 'rgba(255,255,255,0.05)' }}
        />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3 w-3/4 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="h-2.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-2.5 w-4/5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      {unlocked && (
        <div className="mt-3 flex items-center justify-between">
          <div className="h-5 w-16 rounded-full" style={{ background: `${bg}15` }} />
          <div className="h-4 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      )}
    </div>
  )
}

export default function ScoreLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Hero header — level + XP ring */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden animate-pulse"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.09) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.06) 100%)',
          border: '1px solid rgba(245,200,66,0.22)',
          boxShadow: '0 0 40px rgba(245,200,66,0.06)',
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Ring */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(21,34,56,0.7)',
                border: '8px solid rgba(245,200,66,0.15)',
                boxShadow: '0 0 30px rgba(245,200,66,0.08), inset 0 0 20px rgba(245,200,66,0.04)',
              }}
            >
              <div className="text-center space-y-1">
                <div className="h-8 w-12 rounded-xl mx-auto" style={{ background: 'rgba(245,200,66,0.15)' }} />
                <div className="h-2.5 w-16 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
            <div className="h-5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* XP info */}
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <div className="h-10 w-48 rounded-xl" style={{ background: 'rgba(245,200,66,0.1)' }} />
              <div className="h-3 w-56 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-2.5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-2.5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: '65%', background: 'linear-gradient(90deg, rgba(245,200,66,0.4), rgba(245,200,66,0.2))' }}
                />
              </div>
            </div>
            {/* Level milestones */}
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: i < 5 ? 'rgba(245,200,66,0.3)' : 'rgba(255,255,255,0.06)' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard accent="#F5C842" />
        <StatCard accent="#FF4D00" />
        <StatCard accent="#7C3AED" />
        <StatCard accent="#00FF88" />
      </div>

      {/* XP chart */}
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 180 }}
      >
        <div className="flex items-center justify-between mb-4">
          <ShimmerRow widths={['1rem', '7rem']} />
          <div className="h-2.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        {/* Sparkline */}
        <div className="flex items-end gap-3 h-24">
          {[40, 80, 55, 90, 30, 70, 65].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${h}%`,
                  background: 'linear-gradient(180deg, rgba(245,200,66,0.3) 0%, rgba(245,200,66,0.1) 100%)',
                }}
              />
              <div className="h-2 w-5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Activity stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { accent: '#FF4D00', label: 'Treinos' },
          { accent: '#7C3AED', label: 'Tarefas' },
          { accent: '#FF4D00', label: 'Hábitos' },
        ].map(({ accent }, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 relative overflow-hidden animate-pulse text-center"
            style={{
              background: `linear-gradient(135deg, ${accent}09 0%, rgba(13,24,41,0.98) 100%)`,
              border: `1px solid ${accent}18`,
            }}
          >
            <div className="w-9 h-9 rounded-xl mx-auto mb-2" style={{ background: `${accent}15` }} />
            <div className="h-7 w-12 rounded-xl mx-auto mb-1" style={{ background: `${accent}12` }} />
            <div className="h-2.5 w-14 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        ))}
      </div>

      {/* Unlocked achievements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between animate-pulse">
          <ShimmerRow widths={['1.1rem', '9rem']} />
          <div className="h-5 w-16 rounded-full" style={{ background: 'rgba(245,200,66,0.1)' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AchievementCard unlocked accent="#F5C842" />
          <AchievementCard unlocked accent="#7C3AED" />
          <AchievementCard unlocked accent="#3B82F6" />
          <AchievementCard unlocked accent="#8899BB" />
        </div>
      </div>

      {/* Locked achievements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between animate-pulse">
          <ShimmerRow widths={['1.1rem', '8rem']} />
          <div className="h-5 w-14 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <AchievementCard key={i} unlocked={false} />
          ))}
        </div>
      </div>
    </div>
  )
}
