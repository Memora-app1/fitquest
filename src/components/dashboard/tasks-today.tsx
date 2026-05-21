import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  urgent: boolean
  important: boolean
  due_date: string | null
}

function getPriorityBadge(urgent: boolean, important: boolean) {
  if (urgent && important)
    return { label: 'FAZER AGORA', class: 'bg-brand-red/20 text-brand-red border-brand-red/40' }
  if (important)
    return { label: 'AGENDAR', class: 'bg-brand-green/20 text-brand-green border-brand-green/40' }
  if (urgent)
    return { label: 'DELEGAR', class: 'bg-brand-gold/20 text-brand-gold border-brand-gold/40' }
  return null
}

export function TasksToday({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-2">Tarefas Pra Hoje</h2>
        <p className="text-text-secondary text-sm">Nenhuma tarefa pendente. ✨</p>
        <Link
          href="/tarefas"
          className="text-brand-orange hover:underline text-sm font-medium mt-2 inline-block"
        >
          Adicionar tarefa →
        </Link>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Tarefas Pra Hoje</h2>
        <Link
          href="/tarefas"
          className="text-sm text-text-secondary hover:text-brand-orange"
        >
          Ver todas →
        </Link>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const badge = getPriorityBadge(task.urgent, task.important)
          return (
            <Link
              key={task.id}
              href={`/tarefas?task=${task.id}`}
              className="block p-3 bg-bg-elevated rounded-xl border border-border hover:border-brand-orange/40 transition-all"
            >
              <div className="flex items-start gap-3">
                {(task.urgent || task.important) && (
                  <AlertCircle
                    size={16}
                    className={task.urgent ? 'text-brand-red mt-0.5' : 'text-brand-gold mt-0.5'}
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  {badge && (
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1 border ${badge.class}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
