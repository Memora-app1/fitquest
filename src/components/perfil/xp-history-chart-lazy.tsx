'use client';

import dynamicImport from 'next/dynamic';
import type { DayXP } from './xp-history-chart';

const XpHistoryChartInner = dynamicImport(
  () => import('@/components/perfil/xp-history-chart').then((m) => m.XpHistoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
        <div
          className="h-48 animate-pulse rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>
    ),
  }
);

export function XpHistoryChartLazy({ data }: { data: DayXP[] }) {
  return <XpHistoryChartInner data={data} />;
}
