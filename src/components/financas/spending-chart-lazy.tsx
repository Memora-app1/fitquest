'use client'

import dynamicImport from 'next/dynamic'

const SpendingChartInner = dynamicImport(
  () => import('@/components/financas/spending-chart').then((m) => m.SpendingChart),
  {
    ssr: false,
    loading: () => <div className="h-32 bg-bg-elevated rounded-xl animate-pulse" />,
  }
)

interface CategorySpend {
  name: string
  icon: string
  amount: number
  color: string
}

export function SpendingChartLazy({ data }: { data: CategorySpend[] }) {
  return <SpendingChartInner data={data} />
}
