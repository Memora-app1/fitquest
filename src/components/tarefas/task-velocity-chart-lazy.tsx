'use client';

import dynamicImport from 'next/dynamic';
import type { TaskWeekData } from './task-velocity-chart';

const TaskVelocityChartInner = dynamicImport(
  () => import('@/components/tarefas/task-velocity-chart').then((m) => m.TaskVelocityChart),
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

export function TaskVelocityChartLazy({ data }: { data: TaskWeekData[] }) {
  return <TaskVelocityChartInner data={data} />;
}
