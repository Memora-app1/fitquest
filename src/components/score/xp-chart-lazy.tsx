'use client';

import dynamicImport from 'next/dynamic';

const XpChartInner = dynamicImport(
  () => import('@/components/score/xp-chart').then((m) => m.XpChart),
  {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse rounded-xl bg-bg-elevated" />,
  }
);

interface DayXP {
  day: string;
  xp: number;
}

export function XpChartLazy({ data }: { data: DayXP[] }) {
  return <XpChartInner data={data} />;
}
