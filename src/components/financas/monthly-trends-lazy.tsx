'use client';

import dynamicImport from 'next/dynamic';
import type { MonthData } from './monthly-trends';

const MonthlyTrendsInner = dynamicImport(
  () => import('@/components/financas/monthly-trends').then((m) => m.MonthlyTrendsChart),
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

export function MonthlyTrendsLazy({ data }: { data: MonthData[] }) {
  return <MonthlyTrendsInner data={data} />;
}
