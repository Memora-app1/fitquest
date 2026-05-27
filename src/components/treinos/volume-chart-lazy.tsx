'use client'

import dynamicImport from 'next/dynamic'
import type { WeekData } from './volume-chart'

const VolumeChartInner = dynamicImport(
  () => import('@/components/treinos/volume-chart').then((m) => m.VolumeChart),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
        <div className="h-48 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    ),
  },
)

export function VolumeChartLazy({ data }: { data: WeekData[] }) {
  return <VolumeChartInner data={data} />
}
