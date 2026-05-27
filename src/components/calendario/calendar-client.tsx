'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckSquare,
  Clock,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  AlignLeft,
  X,
  Loader2,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalEvent {
  id: string
  title: string
  start_at: string
  end_at: string | null
  source: string | null
  color: string | null
  description?: string | null
  location?: string | null
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

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const EVENT_COLORS: Array<{ label: string; hex: string; rgb: string }> = [
  { label: 'Azul', hex: '#3B82F6', rgb: '59,130,246' },
  { label: 'Roxo', hex: '#7C3AED', rgb: '124,58,237' },
  { label: 'Verde', hex: '#00FF88', rgb: '0,255,136' },
  { label: 'Laranja', hex: '#FF4D00', rgb: '255,77,0' },
  { label: 'Dourado', hex: '#F5C842', rgb: '245,200,66' },
  { label: 'Rosa', hex: '#EC4899', rgb: '236,72,153' },
  { label: 'Ciano', hex: '#06B6D4', rgb: '6,182,212' },
  { label: 'Vermelho', hex: '#EF4444', rgb: '239,68,68' },
]

// ── Helper functions ───────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function toLocalInputValue(isoString: string): string {
  // Convert ISO datetime to "YYYY-MM-DDTHH:mm" for datetime-local input
  const d = new Date(isoString)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day}T${h}:${min}`
}

function buildDatetimeISO(dateStr: string, timeStr: string): string {
  // dateStr = "YYYY-MM-DD", timeStr = "HH:mm"
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

function colorRgb(hex: string): string {
  const found = EVENT_COLORS.find((c) => c.hex === hex)
  return found?.rgb ?? '59,130,246'
}

// ── Create / Edit Event Modal ──────────────────────────────────────────────────

interface EventModalProps {
  prefillDate: string
  prefillEvent?: CalEvent | null
  onClose: () => void
  onSaved: (event: CalEvent) => void
}

function EventModal({ prefillDate, prefillEvent, onClose, onSaved }: EventModalProps) {
  const isEdit = !!prefillEvent
  const defaultHour = String(new Date().getHours()).padStart(2, '0')
  const defaultStart = `${prefillDate}T${defaultHour}:00`
  const defaultEnd = `${prefillDate}T${String(Math.min(new Date().getHours() + 1, 23)).padStart(2, '0')}:00`

  const [title, setTitle] = useState(prefillEvent?.title ?? '')
  const [startAt, setStartAt] = useState(
    prefillEvent ? toLocalInputValue(prefillEvent.start_at) : defaultStart
  )
  const [endAt, setEndAt] = useState(
    prefillEvent?.end_at ? toLocalInputValue(prefillEvent.end_at) : defaultEnd
  )
  const [hasEnd, setHasEnd] = useState<boolean>(!!prefillEvent?.end_at || true)
  const [color, setColor] = useState(prefillEvent?.color ?? '#3B82F6')
  const [description, setDescription] = useState(prefillEvent?.description ?? '')
  const [location, setLocation] = useState(prefillEvent?.location ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Informe o título do evento.'); return }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...(isEdit && { id: prefillEvent!.id }),
        title: title.trim(),
        start_at: new Date(startAt).toISOString(),
        end_at: hasEnd ? new Date(endAt).toISOString() : null,
        color,
        description: description.trim() || null,
        location: location.trim() || null,
      }

      const res = await fetch('/api/calendario', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erro ao salvar evento')
      }

      const data = await res.json() as { event: CalEvent }
      onSaved(data.event)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar evento')
    } finally {
      setLoading(false)
    }
  }

  const selectedColor = EVENT_COLORS.find((c) => c.hex === color) ?? EVENT_COLORS[0]!

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full md:max-w-lg rounded-t-3xl md:rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: `linear-gradient(135deg, rgba(${colorRgb(color)},0.08) 0%, rgba(13,24,41,0.99) 50%, rgba(13,24,41,0.99) 100%)`,
          border: `1px solid rgba(${colorRgb(color)},0.25)`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(${colorRgb(color)},0.08)`,
        }}
      >
        {/* Glow corner */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none blur-2xl"
          style={{ background: `rgba(${colorRgb(color)},0.18)` }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `rgba(${colorRgb(color)},0.15)`,
                border: `1px solid rgba(${colorRgb(color)},0.3)`,
              }}
            >
              <Calendar size={16} style={{ color }} />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {isEdit ? 'Editar evento' : 'Novo evento'}
              </h2>
              <p className="text-xs text-text-muted capitalize">
                {formatDayLabel(prefillDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative z-10 p-5 space-y-4">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Título *
            </label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento..."
              maxLength={200}
              className="input w-full"
              style={{ fontSize: '15px', fontWeight: 600 }}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Início
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Término
                </label>
                <button
                  type="button"
                  onClick={() => setHasEnd(!hasEnd)}
                  className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                >
                  {hasEnd ? 'Remover' : 'Adicionar'}
                </button>
              </div>
              {hasEnd ? (
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  min={startAt}
                  className="input w-full text-sm"
                />
              ) : (
                <div
                  className="input w-full text-sm text-text-muted flex items-center cursor-pointer"
                  onClick={() => setHasEnd(true)}
                >
                  Sem término
                </div>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-text-muted" />
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Cor — {selectedColor.label}
              </label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all border-2',
                    color === c.hex ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                  )}
                  style={{ background: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <MapPin size={11} /> Local (opcional)
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Endereço ou link da reunião..."
              maxLength={300}
              className="input w-full text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <AlignLeft size={11} /> Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do evento..."
              maxLength={1000}
              rows={2}
              className="input w-full text-sm resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${color}, rgba(${colorRgb(color)},0.7))`,
                color: color === '#F5C842' || color === '#00FF88' ? '#050914' : '#fff',
                boxShadow: `0 4px 16px rgba(${colorRgb(color)},0.3)`,
              }}
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <Calendar size={14} />
                  {isEdit ? 'Salvar alterações' : 'Criar evento'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-all border border-border"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

interface DeleteConfirmProps {
  event: CalEvent
  onClose: () => void
  onDeleted: (id: string) => void
}

function DeleteConfirm({ event, onClose, onDeleted }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendario?id=${event.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted(event.id)
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-6 space-y-5 animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(239,68,68,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <Trash2 size={18} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h3 className="font-bold text-base">Excluir evento?</h3>
            <p className="text-sm text-text-secondary mt-1">
              "<span className="text-white font-medium">{event.title}</span>" será removido permanentemente.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #B91C1C, #EF4444)', color: '#fff', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Excluir
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-all border border-border"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CalendarClient Props ───────────────────────────────────────────────────────

interface CalendarClientProps {
  initialYear: number
  initialMonth: number
  initialEvents: CalEvent[]
  initialTasks: CalTask[]
}

// ── Main Component ─────────────────────────────────────────────────────────────

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

  // Modal state
  const [createModalDate, setCreateModalDate] = useState<string | null>(null)
  const [editEvent, setEditEvent] = useState<CalEvent | null>(null)
  const [deleteEvent, setDeleteEvent] = useState<CalEvent | null>(null)

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

  // ── Event CRUD handlers ──────────────────────────────────────────────────────

  function handleEventSaved(savedEvent: CalEvent) {
    setEvents((prev) => {
      const exists = prev.findIndex((e) => e.id === savedEvent.id)
      if (exists >= 0) {
        const next = [...prev]
        next[exists] = savedEvent
        return next.sort((a, b) => a.start_at.localeCompare(b.start_at))
      }
      return [...prev, savedEvent].sort((a, b) => a.start_at.localeCompare(b.start_at))
    })
  }

  function handleEventDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  // ── Calendar grid computation ──────────────────────────────────────────────

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startPadding = firstDay.getDay()
  const totalDays = lastDay.getDate()
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

  // Build grid cells (always 42 cells = 6 rows × 7 cols)
  const cells: Array<{ day: number; currentMonth: boolean; dateStr: string }> = []

  for (let i = startPadding - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const prevYear_ = month === 1 ? year - 1 : year
    const prevMonth_ = month === 1 ? 12 : month - 1
    const dateStr = `${prevYear_}-${String(prevMonth_).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, currentMonth: false, dateStr })
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, currentMonth: true, dateStr })
  }

  const remainingCells = 42 - cells.length
  const nextMonthYear_ = month === 12 ? year + 1 : year
  const nextMonth__ = month === 12 ? 1 : month + 1
  for (let d = 1; d <= remainingCells; d++) {
    const dateStr = `${nextMonthYear_}-${String(nextMonth__).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, currentMonth: false, dateStr })
  }

  // ── Focus day panel ──────────────────────────────────────────────────────────
  const focusDay = selectedDay ?? todayStr
  const focusData = byDate[focusDay]
  const focusDayLabel = formatDayLabel(focusDay)
  const totalItems = events.length + tasks.length
  const isToday_ = focusDay === todayStr

  // Upcoming items (next 7 days from today) for the "Em breve" strip
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]!
  })
  const upcomingItems = upcomingDates
    .flatMap((d) => {
      const dd = byDate[d]
      if (!dd) return []
      return [...dd.tasks.map((t) => ({ type: 'task' as const, item: t, date: d })),
              ...dd.events.map((e) => ({ type: 'event' as const, item: e, date: d }))]
    })
    .slice(0, 5)

  // ── Month stats ──────────────────────────────────────────────────────────────
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length
  const criticalTasks = tasks.filter((t) => t.urgent && t.important && t.status !== 'done').length
  const eventsCount = events.filter((e) => e.source === 'manual').length

  return (
    <>
      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {createModalDate && (
        <EventModal
          prefillDate={createModalDate}
          onClose={() => setCreateModalDate(null)}
          onSaved={handleEventSaved}
        />
      )}
      {editEvent && (
        <EventModal
          prefillDate={editEvent.start_at.split('T')[0]!}
          prefillEvent={editEvent}
          onClose={() => setEditEvent(null)}
          onSaved={(saved) => {
            handleEventSaved(saved)
            setEditEvent(null)
          }}
        />
      )}
      {deleteEvent && (
        <DeleteConfirm
          event={deleteEvent}
          onClose={() => setDeleteEvent(null)}
          onDeleted={handleEventDeleted}
        />
      )}

      <div className="space-y-6">

        {/* ── Month stats strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Eventos', value: totalItems, icon: '📅', color: '59,130,246', accent: '#3B82F6' },
            { label: 'Tarefas pendentes', value: pendingTasks, icon: '⏳', color: '124,58,237', accent: '#7C3AED' },
            { label: 'Concluídas', value: doneTasks, icon: '✅', color: '0,255,136', accent: '#00FF88' },
            { label: 'Críticas', value: criticalTasks, icon: '🔴', color: criticalTasks > 0 ? '239,68,68' : '136,153,187', accent: criticalTasks > 0 ? '#EF4444' : '#8899BB' },
          ].map(({ label, value, icon, color, accent }) => (
            <div
              key={label}
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, rgba(${color},0.08) 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid rgba(${color},0.2)`,
              }}
            >
              <div
                className="absolute -top-3 -right-3 w-12 h-12 rounded-full pointer-events-none blur-xl"
                style={{ background: `rgba(${color},0.25)` }}
              />
              <div className="relative z-10">
                <div className="text-base mb-1">{icon}</div>
                <div className="heading-display text-2xl" style={{ color: accent }}>{value}</div>
                <div className="text-xs text-text-muted mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Header controls ─────────────────────────────────────────────── */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalDate(todayStr)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, rgba(59,130,246,0.7))',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
              }}
            >
              <Plus size={14} />
              Evento
            </button>
            <button onClick={goToToday} className="btn-ghost text-sm px-4 py-2">
              Hoje
            </button>
          </div>
        </div>

        {/* ── Calendar grid ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
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
                <div
                  key={idx}
                  className={cn(
                    'relative min-h-[60px] md:min-h-[76px] p-1.5 border-b border-r border-border transition-colors group',
                    !isCurrentMonth && 'opacity-30',
                    isToday && 'bg-brand-orange/8',
                    isSelected && 'bg-brand-purple/10',
                    !isToday && !isSelected && isCurrentMonth && 'hover:bg-bg-elevated',
                    idx % 7 === 6 && 'border-r-0',
                    idx >= cells.length - 7 && 'border-b-0',
                  )}
                >
                  {/* Day number + click to select */}
                  <button
                    onClick={() => setSelectedDay(cell.dateStr === selectedDay ? null : cell.dateStr)}
                    className="w-full text-left"
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
                  </button>

                  {/* Quick add button (visible on hover, desktop) */}
                  {isCurrentMonth && (
                    <button
                      onClick={() => setCreateModalDate(cell.dateStr)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 hover:bg-brand-blue/20 hover:text-brand-blue transition-all"
                      title={`Criar evento em ${cell.dateStr}`}
                    >
                      <Plus size={11} />
                    </button>
                  )}

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
                              ? 'bg-red-500'
                              : t.urgent || t.important
                              ? 'bg-brand-gold'
                              : 'bg-brand-purple'
                          )}
                        />
                      ))}
                      {dayData!.events.slice(0, 2).map((ev) => (
                        <span
                          key={ev.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: ev.color ?? '#3B82F6' }}
                        />
                      ))}
                      {dotCount > 4 && (
                        <span className="text-[9px] text-text-muted leading-none self-center">+{dotCount - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Desktop: show first item title */}
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
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-brand-purple/20 text-brand-purple'
                          )}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayData!.events.slice(0, 1).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                          style={{
                            background: `rgba(${colorRgb(ev.color ?? '#3B82F6')},0.15)`,
                            color: ev.color ?? '#3B82F6',
                          }}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Urgente + Importante
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

        {/* ── Main two-column layout: day detail + upcoming ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Day detail panel */}
          <div
            className="lg:col-span-2 rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: isToday_
                ? 'linear-gradient(135deg, rgba(255,77,0,0.06) 0%, rgba(13,24,41,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: isToday_
                ? '1px solid rgba(255,77,0,0.18)'
                : '1px solid rgba(124,58,237,0.18)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
              style={{ background: isToday_ ? 'rgba(255,77,0,0.15)' : 'rgba(124,58,237,0.15)' }}
            />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="font-bold text-base capitalize">{focusDayLabel}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {(focusData?.events.length ?? 0) + (focusData?.tasks.length ?? 0)} item(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {focusDay === todayStr && (
                  <span className="text-xs bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full font-medium">
                    Hoje
                  </span>
                )}
                <button
                  onClick={() => setCreateModalDate(focusDay)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{
                    background: 'rgba(59,130,246,0.15)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  <Plus size={11} />
                  Evento
                </button>
              </div>
            </div>

            {!focusData || (focusData.events.length === 0 && focusData.tasks.length === 0) ? (
              <div className="text-center py-10 relative z-10">
                <div className="text-5xl mb-3">🗓️</div>
                <p className="text-text-muted text-sm">Nada agendado para este dia.</p>
                <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                  <button
                    onClick={() => setCreateModalDate(focusDay)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{
                      background: 'rgba(59,130,246,0.15)',
                      color: '#3B82F6',
                      border: '1px solid rgba(59,130,246,0.25)',
                    }}
                  >
                    <Plus size={13} />
                    Criar evento
                  </button>
                  <Link
                    href="/tarefas"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary hover:text-white transition-colors border border-border"
                  >
                    <CheckSquare size={13} />
                    Criar tarefa
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2 relative z-10">
                {/* Tasks */}
                {focusData.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/tarefas"
                    className="flex items-center gap-3 p-3 bg-bg-elevated border border-border rounded-xl hover:border-brand-purple/40 transition-colors group"
                  >
                    <CheckSquare
                      size={18}
                      className={cn(
                        'shrink-0',
                        task.status === 'done'
                          ? 'text-brand-green'
                          : task.urgent && task.important
                          ? 'text-red-400'
                          : 'text-brand-purple'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={cn('font-medium text-sm truncate', task.status === 'done' && 'line-through text-text-muted')}>
                        {task.title}
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5 flex-wrap">
                        <Clock size={10} />
                        <span>
                          {new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {task.urgent && task.important && (
                          <span className="text-red-400 font-medium">· Urgente & Importante</span>
                        )}
                        {task.urgent && !task.important && (
                          <span className="text-brand-gold font-medium">· Urgente</span>
                        )}
                        {!task.urgent && task.important && (
                          <span className="text-brand-gold font-medium">· Importante</span>
                        )}
                      </div>
                    </div>
                    {task.status === 'done' ? (
                      <span className="text-xs bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full">Feito</span>
                    ) : (task.urgent && task.important) ? (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Crítico</span>
                    ) : null}
                  </Link>
                ))}

                {/* Events */}
                {focusData.events.map((ev) => {
                  const evColor = ev.color ?? '#3B82F6'
                  const evRgb = colorRgb(evColor)
                  return (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 p-3 rounded-xl border transition-colors"
                      style={{
                        background: `rgba(${evRgb},0.07)`,
                        borderColor: `rgba(${evRgb},0.22)`,
                      }}
                    >
                      {/* Color dot */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `rgba(${evRgb},0.15)`, border: `1px solid rgba(${evRgb},0.3)` }}
                      >
                        <Calendar size={15} style={{ color: evColor }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate" style={{ color: evColor === '#F5C842' ? '#F5C842' : undefined }}>
                          {ev.title}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5 flex-wrap">
                          <Clock size={10} />
                          <span>
                            {formatTime(ev.start_at)}
                            {ev.end_at && <> — {formatTime(ev.end_at)}</>}
                          </span>
                          {ev.source && ev.source !== 'manual' && <> · {ev.source}</>}
                        </div>
                        {ev.location && (
                          <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                            <MapPin size={9} /> {ev.location}
                          </div>
                        )}
                        {ev.description && (
                          <div className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {ev.description}
                          </div>
                        )}
                      </div>

                      {/* Actions (only manual events can be edited/deleted) */}
                      {(!ev.source || ev.source === 'manual') && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditEvent(ev)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all"
                            title="Editar"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteEvent(ev)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Upcoming items panel */}
          <div className="space-y-3">
            <div
              className="rounded-2xl p-5 relative overflow-hidden h-full"
              style={{
                background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(245,200,66,0.15)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                style={{ background: 'rgba(245,200,66,0.15)' }}
              />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-bold text-sm">Próximos 7 dias</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(245,200,66,0.12)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.2)' }}
                >
                  {upcomingItems.length} item{upcomingItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              {upcomingItems.length === 0 ? (
                <div className="text-center py-8 relative z-10">
                  <div className="text-3xl mb-2">🌟</div>
                  <p className="text-text-muted text-xs">Agenda limpa para os próximos dias!</p>
                </div>
              ) : (
                <div className="space-y-2 relative z-10">
                  {upcomingItems.map(({ type, item, date }, i) => {
                    const isTask = type === 'task'
                    const task = isTask ? item as CalTask : null
                    const ev = !isTask ? item as CalEvent : null
                    const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })

                    return (
                      <div
                        key={`${type}-${item.id}`}
                        className="flex items-start gap-2.5 py-2 border-b border-border last:border-0"
                      >
                        <div className="shrink-0 mt-0.5">
                          {isTask ? (
                            <CheckSquare
                              size={14}
                              className={cn(
                                task!.status === 'done' ? 'text-brand-green' :
                                task!.urgent && task!.important ? 'text-red-400' : 'text-brand-purple'
                              )}
                            />
                          ) : (
                            <div
                              className="w-3.5 h-3.5 rounded-full border-2"
                              style={{ borderColor: ev!.color ?? '#3B82F6', background: `rgba(${colorRgb(ev!.color ?? '#3B82F6')},0.2)` }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'text-xs font-medium truncate',
                            isTask && task!.status === 'done' && 'line-through text-text-muted'
                          )}>
                            {item.title}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5 capitalize">{dayLabel}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Quick create for upcoming */}
              <div className="relative z-10 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setCreateModalDate(upcomingDates[0] ?? todayStr)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-brand-blue hover:bg-brand-blue/10 transition-all border border-dashed border-border hover:border-brand-blue/30"
                >
                  <Plus size={12} />
                  Agendar para amanhã
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
