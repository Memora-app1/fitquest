'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, CheckSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CalEvent {
  id: string
  title: string
  start_at: string
  end_at: string | null
  source: string | null
  color: string | null
}

interface CalTask {
  id: string
  title: string
  due_date: string
  urgent: boolean | null
  important: boolean | null
  status: string
}

interface DayData {
  events: CalEvent[]
  tasks: CalTask[]
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface CalendarClientProps {
  initialYear: number
  initialMonth: number
  initialEvents: CalEvent[]
  initialTasks: CalTask[]
}

export function CalendarClient({
  initialYear,
  initialMonth,
  initialEvents,
  initialTasks,
}: CalendarClientProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [events, setEvents] = useState<CalEvent[]>(initialEvents)
  const [tasks, setTasks] = useState<CalTask[]>(initialTasks)
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]!

  const fetchMonth = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendario?year=${y}&month=${m}`)
      if (res.ok) {
        const data = await res.json() as { events: CalEvent[]; tasks: CalTask[] }
        setEvents(data.events)
        setTasks(data.tasks)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function prevMonth() {
    const newDate = month === 1
      ? { year: year - 1, month: 12 }
      : { year, month: month - 1 }
    setYear(newDate.year)
    setMonth(newDate.month)
    fetchMonth(newDate.year, newDate.month)
  }

  function nextMonth() {
    const newDate = month === 12
      ? { year: year + 1, month: 1 }
      : { year, month: month + 1 }
    setYear(newDate.year)
    setMonth(newDate.month)
    fetchMonth(newDate.year, newDate.month)
  }

  function goToToday() {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    if (now.getFullYear() !== year || now.getMonth() + 1 !== month) {
      fetchMonth(now.getFullYear(), now.getMonth() + 1)
    }
    setSelectedDay(todayStr)
  }

  // Build calendar days
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startPadding = firstDay.getDay()
  const totalDays = lastDay.getDate()

  // Prev month trailing days
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()

  // Group by date
  const byDate: Record<string, DayData> = {}

  for (const ev of events) {
    const d = ev.start_at.split('T')[0]!
    if (!byDate[d]) byDate[d] = { events: [], tasks: [] }
    byDate[d]!.events.push(ev)
  }

  for (const task of tasks) {
    const d = task.due_date.split('T')[0]!
    if (!byDate[d]) byDate[d] = { events: [], tasks: [] }
    byDate[d]!.tasks.push(task)
  }

  // Build grid cells
  const cells: Array<{ day: number; currentMonth: boolean; dateStr: string }> = []

  for (let i = startPadding - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const prevYear = month === 1 ? year - 1 : year
    const prevMonth_ = month === 1 ? 12 : month - 1
    const dateStr = `${prevYear}-${String(prevMonth_).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, currentMonth: false, dateStr })
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, currentMonth: true, dateStr })
  }

  const remainingCells = 42 - cells.length
  const nextMonthYear = month === 12 ? year + 1 : year
  const nextMonth_ = month === 12 ? 1 : month + 1
  for (let d = 1; d <= remainingCells; d++) {
    const dateStr = `${nextMonthYear}-${String(nextMonth_).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, currentMonth: false, dateStr })
  }

  // Upcoming items list (selected day or today)
  const focusDay = selectedDay ?? todayStr
  const focusData = byDate[focusDay]
  const focusDayLabel = new Date(focusDay + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  // Total count of items in month
  const totalItems = events.length + tasks.length

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-10 h-10 bg-bg-elevated border border-border rounded-xl flex items-center justify-center hover:border-brand-orange/50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="heading-display text-2xl min-w-[180px] text-center">
            {MONTHS_PT[month - 1]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="w-10 h-10 bg-bg-elevated border border-border rounded-xl flex items-center justify-center hover:border-brand-orange/50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'} este mês
          </span>
          <button onClick={goToToday} className="btn-ghost text-sm px-4 py-2">
            Hoje
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs text-text-muted uppercase tracking-wider py-3 font-medium"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className={cn('grid grid-cols-7 transition-opacity', loading && 'opacity-50')}>
          {cells.map((cell, idx) => {
            const dayData = byDate[cell.dateStr]
            const hasItems = dayData && (dayData.events.length > 0 || dayData.tasks.length > 0)
            const isToday = cell.dateStr === todayStr
            const isSelected = cell.dateStr === selectedDay
            const isCurrentMonth = cell.currentMonth

            const dotCount = (dayData?.events.length ?? 0) + (dayData?.tasks.length ?? 0)

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(cell.dateStr === selectedDay ? null : cell.dateStr)}
                className={cn(
                  'relative min-h-[56px] md:min-h-[70px] p-1.5 text-left border-b border-r border-border transition-colors',
                  !isCurrentMonth && 'opacity-30',
                  isToday && 'bg-brand-orange/10',
                  isSelected && 'bg-brand-purple/10',
                  !isToday && !isSelected && 'hover:bg-bg-elevated',
                  idx % 7 === 6 && 'border-r-0',
                  idx >= cells.length - 7 && 'border-b-0',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday && 'bg-brand-orange text-white font-bold',
                    isSelected && !isToday && 'bg-brand-purple text-white',
                    !isToday && !isSelected && isCurrentMonth && 'text-text-primary',
                  )}
                >
                  {cell.day}
                </span>

                {/* Dots / indicators */}
                {hasItems && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {dayData!.tasks.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          t.status === 'done'
                            ? 'bg-brand-green'
                            : t.urgent && t.important
                            ? 'bg-brand-red'
                            : t.urgent || t.important
                            ? 'bg-brand-gold'
                            : 'bg-brand-purple'
                        )}
                      />
                    ))}
                    {dayData!.events.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className="w-1.5 h-1.5 rounded-full bg-brand-blue"
                      />
                    ))}
                    {dotCount > 4 && (
                      <span className="text-[9px] text-text-muted leading-none">+{dotCount - 4}</span>
                    )}
                  </div>
                )}

                {/* Mobile: item titles hidden, desktop: show first item title */}
                {hasItems && (
                  <div className="hidden md:block mt-0.5 space-y-0.5">
                    {dayData!.tasks.slice(0, 1).map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          'text-[10px] leading-tight truncate px-1 py-0.5 rounded',
                          t.status === 'done'
                            ? 'bg-brand-green/20 text-brand-green line-through'
                            : t.urgent && t.important
                            ? 'bg-brand-red/20 text-brand-red'
                            : 'bg-brand-purple/20 text-brand-purple'
                        )}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayData!.events.slice(0, 1).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-brand-blue/20 text-brand-blue"
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-red" /> Urgente + Importante
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-gold" /> Urgente ou Importante
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-purple" /> Tarefa
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" /> Evento
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-green" /> Concluído
        </span>
      </div>

      {/* Day detail panel */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base capitalize">{focusDayLabel}</h3>
          {focusDay === todayStr && (
            <span className="text-xs bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full font-medium">
              Hoje
            </span>
          )}
        </div>

        {!focusData || (focusData.events.length === 0 && focusData.tasks.length === 0) ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🗓️</div>
            <p className="text-text-muted text-sm">Nada agendado para este dia.</p>
            <Link href="/tarefas" className="text-brand-orange text-sm hover:underline mt-2 inline-block">
              Criar tarefa com prazo →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {focusData.tasks.map((task) => (
              <Link
                key={task.id}
                href="/tarefas"
                className="flex items-center gap-3 p-3 bg-bg-elevated border border-border rounded-xl hover:border-brand-purple/40 transition-colors"
              >
                <CheckSquare
                  size={18}
                  className={cn(
                    task.status === 'done'
                      ? 'text-brand-green'
                      : task.urgent && task.important
                      ? 'text-brand-red'
                      : 'text-brand-purple'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className={cn('font-medium text-sm truncate', task.status === 'done' && 'line-through text-text-muted')}>
                    {task.title}
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {task.urgent && task.important && (
                      <span className="text-brand-red font-medium">· Urgente & Importante</span>
                    )}
                    {task.urgent && !task.important && (
                      <span className="text-brand-gold font-medium">· Urgente</span>
                    )}
                    {!task.urgent && task.important && (
                      <span className="text-brand-gold font-medium">· Importante</span>
                    )}
                  </div>
                </div>
                {task.status === 'done' && (
                  <span className="text-xs bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full">
                    Feito
                  </span>
                )}
              </Link>
            ))}

            {focusData.events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-3 bg-bg-elevated border border-border rounded-xl"
              >
                <Calendar size={18} className="text-brand-blue shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{ev.title}</div>
                  <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {ev.end_at && (
                      <> — {new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                    {ev.source && <> · {ev.source}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
