'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, Check, Trash2, BookOpen, Target, Pencil, Circle, Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  createPracticeSession, 
  togglePracticeSession, 
  updateWeeklyRoutine, 
  deleteWeeklyRoutine, 
  createWeeklyRoutine,
  clonePreviousWeekRoutines
} from '@/app/actions/routines'
import { cn } from '@/lib/utils'

type Instrument = 'GUITARRA' | 'PIANO' | 'BAJO' | 'BATERIA'

interface Session {
  id: string
  instrument: string
  duration: number
  scheduledAt: Date
  completed: boolean
  book?: string | null
  exerciseType?: string | null
  isRecurring?: boolean
  createdAt?: Date | string
}

interface WeeklyCalendarProps {
  sessions: Session[]
  setSessions?: React.Dispatch<React.SetStateAction<Session[]>>
  currentDate: Date
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>
}

const INSTRUMENT_COLORS: Record<Instrument, { bg: string, text: string, border: string }> = {
  GUITARRA: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  PIANO: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  BAJO: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  BATERIA: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
}

// Preset curados de alta calidad para cada instrumento en caso de poco o nulo historial inicial
const FREQUENT_PRESETS: Record<Instrument, Array<{ book: string, exerciseType: string, duration: number }>> = {
  BAJO: [
    { book: 'Aerobio bass', exerciseType: 'Chapter 2', duration: 20 },
    { book: 'Walking Bass', exerciseType: 'Blues en F', duration: 25 },
    { book: 'Slap & Pop Basics', exerciseType: 'Ejercicio 4', duration: 20 },
    { book: 'Escalas y Arpegios', exerciseType: 'Modos Menores', duration: 15 },
  ],
  BATERIA: [
    { book: 'Stick Control', exerciseType: 'Rudiments single stroke roll', duration: 20 },
    { book: 'The New Breed', exerciseType: 'Coordinación básica', duration: 25 },
    { book: 'Groove Essentials', exerciseType: 'Patrones 4/4 y síncopa', duration: 20 },
    { book: 'Independencia', exerciseType: 'Polirritmias 3 contra 2', duration: 20 },
  ],
  PIANO: [
    { book: 'Hanon', exerciseType: 'El Pianista Virtuoso Ej. 1', duration: 20 },
    { book: 'Czerny Op. 599', exerciseType: 'Ejercicio 15', duration: 20 },
    { book: 'Jazz & Harmony', exerciseType: 'Progresiones ii-V-I en todas las tonalidades', duration: 25 },
    { book: 'Escalas y Técnica', exerciseType: 'Digitación Mayor y Menor', duration: 15 },
  ],
  GUITARRA: [
    { book: 'Modern Guitar Method', exerciseType: 'Lección 5 Acordes y Arpegios', duration: 20 },
    { book: 'Pentatónicas y Licks', exerciseType: 'Posición 1 y 2', duration: 25 },
    { book: 'Técnica de Púa', exerciseType: 'Picking Alternado en cuerdas 1-6', duration: 20 },
    { book: 'Acordes con Cejilla', exerciseType: 'Transiciones de F a Bm', duration: 15 },
  ],
}

interface FormInputsProps {
  formData: {
    instrument: Instrument
    duration: number
    book?: string
    exerciseType?: string
    isRecurring?: boolean
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    instrument: Instrument
    duration: number
    book?: string
    exerciseType?: string
    isRecurring: boolean
  }>>
}

function FormInputs({ formData, setFormData }: FormInputsProps) {
  return (
    <>
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Instrumento</label>
        <select 
          value={formData.instrument} 
          onChange={e => setFormData(prev => ({...prev, instrument: e.target.value as Instrument}))}
          className="w-full text-xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
        >
          <option value="GUITARRA">Guitarra</option>
          <option value="PIANO">Piano</option>
          <option value="BAJO">Bajo</option>
          <option value="BATERIA">Batería</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Duración (min)</label>
        <input 
          type="number" 
          value={formData.duration} 
          onChange={e => setFormData(prev => ({...prev, duration: parseInt(e.target.value) || 0}))}
          className="w-full text-xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Minutos"
        />
      </div>

      <div className="flex flex-col gap-1 w-full">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Libro / Método</label>
        <input 
          type="text" 
          value={formData.book} 
          onChange={e => setFormData(prev => ({...prev, book: e.target.value}))}
          className="w-full text-xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400"
          placeholder="Libro/Método (opcional)"
        />
      </div>

      <div className="flex flex-col gap-1 w-full">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Ejercicio</label>
        <input 
          type="text" 
          value={formData.exerciseType} 
          onChange={e => setFormData(prev => ({...prev, exerciseType: e.target.value}))}
          className="w-full text-xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400"
          placeholder="Ejercicio (opcional)"
        />
      </div>
    </>
  )
}

export function WeeklyCalendar({ sessions, setSessions, currentDate, setCurrentDate }: WeeklyCalendarProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [cloneNotification, setCloneNotification] = useState<string | null>(null)
  const [editingIds, setEditingIds] = useState<string[] | null>(null)
  
  const [formData, setFormData] = useState<{
    instrument: Instrument, 
    duration: number,
    book?: string,
    exerciseType?: string,
    isRecurring: boolean
  }>({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '', isRecurring: true })

  const [activePopover, setActivePopover] = useState<{
    x: number
    y: number
    dayDate: Date
    sessionId?: string
    instrument: string
    defaultDuration: number
    book?: string | null
    exerciseType?: string | null
    currentDuration: number
  } | null>(null)

  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activePopover) return

    const handleScroll = () => {
      setActivePopover(null)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    
    const tableContainer = document.querySelector('.overflow-x-auto')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [activePopover])

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      const fallback = new Date()
      const day = fallback.getDay()
      const diff = fallback.getDate() - day + (day === 0 ? -6 : 1)
      fallback.setDate(diff)
      fallback.setHours(0, 0, 0, 0)
      return fallback
    }
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate])

  const endOfWeek = useMemo(() => {
    const end = new Date(startOfWeek)
    end.setDate(end.getDate() + 7)
    return end
  }, [startOfWeek])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [startOfWeek])

  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
    cancelForm()
  }

  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
    cancelForm()
  }

  // Catálogo Rápido: Top 4 ejercicios más usados basados en el historial y presets del instrumento
  const frequentPresets = useMemo(() => {
    const instrument = formData.instrument
    const counts: Record<string, { book: string, exerciseType: string, duration: number, count: number }> = {}

    // 1. Contar frecuencias históricas en las sesiones registradas
    sessions.forEach(s => {
      if (s.instrument === instrument && (s.book || s.exerciseType)) {
        const book = s.book || ''
        const exerciseType = s.exerciseType || ''
        const key = `${book.trim().toLowerCase()}:::${exerciseType.trim().toLowerCase()}`
        if (!counts[key]) {
          counts[key] = {
            book: s.book || '',
            exerciseType: s.exerciseType || '',
            duration: s.duration,
            count: 0
          }
        }
        counts[key].count += 1
      }
    })

    const historicalSorted = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)

    // 2. Presets por defecto para el instrumento si el historial tiene menos de 4
    const defaults = FREQUENT_PRESETS[instrument] || []
    const combined = [...historicalSorted]

    for (const def of defaults) {
      if (combined.length >= 4) break
      const alreadyPresent = combined.some(item => 
        item.book.trim().toLowerCase() === def.book.trim().toLowerCase() &&
        item.exerciseType.trim().toLowerCase() === def.exerciseType.trim().toLowerCase()
      )
      if (!alreadyPresent) {
        combined.push({
          book: def.book,
          exerciseType: def.exerciseType,
          duration: def.duration,
          count: 0
        })
      }
    }

    return combined.slice(0, 4)
  }, [formData.instrument, sessions])

  const handleCreate = async () => {
    if (!isAdding) return
    const currentStart = new Date(startOfWeek)
    await createWeeklyRoutine({
      instrument: formData.instrument,
      duration: formData.duration,
      startOfWeek: currentStart,
      book: formData.book || undefined,
      exerciseType: formData.exerciseType || undefined,
      isRecurring: formData.isRecurring
    })
    setIsAdding(false)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '', isRecurring: true })
  }

  const handleEditClick = (routine: { instrument: string, duration: number, book: string | null, exerciseType: string | null, isRecurring?: boolean, ids: string[] }) => {
    setFormData({
      instrument: routine.instrument as Instrument,
      duration: routine.duration,
      book: routine.book || '',
      exerciseType: routine.exerciseType || '',
      isRecurring: routine.isRecurring ?? true
    })
    setEditingIds(routine.ids)
    setIsAdding(false)
  }

  const submitEdit = async () => {
    if (!editingIds) return
    await updateWeeklyRoutine(editingIds, {
      instrument: formData.instrument,
      duration: formData.duration,
      book: formData.book || undefined,
      exerciseType: formData.exerciseType || undefined,
      isRecurring: formData.isRecurring
    })
    if (setSessions) {
      setSessions(prev => prev.map(s => editingIds.includes(s.id) ? {
        ...s,
        instrument: formData.instrument,
        duration: s.completed ? s.duration : formData.duration,
        book: formData.book || null,
        exerciseType: formData.exerciseType || null,
        isRecurring: formData.isRecurring
      } : s))
    }
    setEditingIds(null)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '', isRecurring: true })
  }

  const cancelForm = () => {
    setIsAdding(false)
    setEditingIds(null)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '', isRecurring: true })
  }

  const handleDeleteRoutine = async (ids: string[]) => {
    if (setSessions) {
      const idSet = new Set(ids)
      setSessions(prev => prev.filter(s => !idSet.has(s.id)))
    }
    await deleteWeeklyRoutine(ids)
  }

  // Botón Inteligente: "Copiar Rutinas de la Semana Anterior" (1 Clic)
  const handleClonePreviousWeek = async () => {
    try {
      setIsCloning(true)
      setCloneNotification(null)

      let result: any
      try {
        result = await clonePreviousWeekRoutines(startOfWeek)
      } catch (actionErr) {
        console.warn('Server Action falló, usando API route fallback:', actionErr)
        const res = await fetch('/api/routines/clone-previous-week', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetWeekStart: startOfWeek.toISOString() })
        })
        result = await res.json()
      }

      if (result.success && result.newSessions && result.newSessions.length > 0) {
        if (setSessions) {
          setSessions(prev => {
            const newIds = new Set(result.newSessions.map((s: any) => s.id))
            const filtered = prev.filter(s => !newIds.has(s.id))
            return [...filtered, ...result.newSessions.map((s: any) => ({
              ...s,
              scheduledAt: new Date(s.scheduledAt),
              createdAt: s.createdAt ? new Date(s.createdAt) : undefined
            }))]
          })
        }
        setCloneNotification(result.message)
      } else {
        setCloneNotification(result.message || 'No se encontraron rutinas previas para clonar.')
      }

      setTimeout(() => setCloneNotification(null), 5000)
    } catch (error: any) {
      console.error('Error clonando rutinas:', error)
      setCloneNotification(error?.message || 'Error al clonar las rutinas')
      setTimeout(() => setCloneNotification(null), 5000)
    } finally {
      setIsCloning(false)
    }
  }

  const handleCellClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    dayDate: Date, 
    existingSession?: Session & { dayIndex: number }, 
    routineDetails?: { instrument: Instrument, duration: number, book?: string, exerciseType?: string }
  ) => {
    if (existingSession?.completed) {
      if (setSessions) {
        setSessions(prev => prev.map(s => s.id === existingSession.id ? { ...s, completed: false } : s))
      }
      await togglePracticeSession(existingSession.id, false)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top

    setActivePopover({
      x,
      y,
      dayDate,
      sessionId: existingSession?.id,
      instrument: existingSession?.instrument || routineDetails?.instrument || 'GUITARRA',
      defaultDuration: existingSession?.duration || routineDetails?.duration || 20,
      book: existingSession?.book || routineDetails?.book || null,
      exerciseType: existingSession?.exerciseType || routineDetails?.exerciseType || null,
      currentDuration: existingSession?.duration || routineDetails?.duration || 20
    })
  }

  // Filter and group sessions for current active week
  const activeWeekSessions = useMemo(() => {
    return sessions.filter(s => {
      const d = new Date(s.scheduledAt)
      return d >= startOfWeek && d < endOfWeek
    })
  }, [sessions, startOfWeek, endOfWeek])

  const groupedRoutines = useMemo(() => {
    const groups: Record<string, {
      key: string
      instrument: string
      duration: number
      book: string | null
      exerciseType: string | null
      isRecurring: boolean
      sessions: (Session & { dayIndex: number })[]
      ids: string[]
    }> = {}

    activeWeekSessions.forEach(s => {
      const sDate = new Date(s.scheduledAt)
      const day = sDate.getDay()
      const dayIndex = day === 0 ? 6 : day - 1

      const createdTime = s.createdAt ? new Date(s.createdAt).getTime() : 0
      const key = `${s.instrument}-${s.book || ''}-${s.exerciseType || ''}-${createdTime}`
      
      if (!groups[key]) {
        groups[key] = {
          key,
          instrument: s.instrument,
          duration: s.duration,
          book: s.book || null,
          exerciseType: s.exerciseType || null,
          isRecurring: s.isRecurring ?? true,
          sessions: [],
          ids: []
        }
      }
      groups[key].sessions.push({ ...s, dayIndex })
      groups[key].ids.push(s.id)
    })

    // Refine group duration to be the planned duration (duration of uncompleted session, or first session if all completed)
    Object.values(groups).forEach(g => {
      const uncompletedSession = g.sessions.find(s => !s.completed)
      if (uncompletedSession) {
        g.duration = uncompletedSession.duration
      } else if (g.sessions.length > 0) {
        g.duration = g.sessions[0].duration
      }
    })

    return Object.values(groups)
  }, [activeWeekSessions])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm mb-8">
      {/* Card Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
            Matriz de Rutinas Semanales
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Paginador de Semanas */}
            <div className="flex items-center justify-between sm:justify-center border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-900 shadow-sm w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={prevWeek} aria-label="Semana anterior">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold px-2 min-w-[120px] text-center text-slate-800 dark:text-slate-200 capitalize">
                {startOfWeek.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={nextWeek} aria-label="Semana siguiente">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Botón de Cabecera: Clonar Rutinas de la Semana Anterior */}
            {groupedRoutines.length === 0 && (
              <Button
                size="sm"
                onClick={handleClonePreviousWeek}
                disabled={isCloning}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 sm:px-4 h-9 shadow-md flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 transition-all active:scale-95"
              >
                {isCloning ? (
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{isCloning ? 'Clonando...' : 'Clonar Semana Anterior'}</span>
              </Button>
            )}

            {/* Botón Añadir Rutina */}
            <Button 
              size="sm" 
              onClick={() => {
                cancelForm()
                setIsAdding(true)
              }}
              className="flex items-center justify-center gap-2 shadow-sm font-semibold h-9 w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Rutina</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {cloneNotification && (
        <div className="mx-4 mt-3 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center justify-between text-xs text-purple-800 dark:text-purple-300 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>{cloneNotification}</span>
          </div>
          <button 
            onClick={() => setCloneNotification(null)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-bold ml-2 text-sm leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Form Section */}
      {isAdding && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>➕</span> Nueva Rutina Base Semanal
            </h4>
            <span className="text-xs text-slate-400">Selecciona o escribe el método de estudio</span>
          </div>

          {/* Catálogo Rápido: ⭐ Ejercicios Frecuentes filtrados por instrumento */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 mb-3 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5 uppercase tracking-wide">
                <span>⭐</span> Ejercicios Frecuentes ({formData.instrument.toLowerCase()})
              </span>
              <span className="text-[11px] text-slate-400">1 clic para autocompletar</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {frequentPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      book: preset.book,
                      exerciseType: preset.exerciseType,
                      duration: preset.duration
                    }))
                  }}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-left flex items-center gap-1.5 group"
                  title={`Cargar ${preset.book} - ${preset.exerciseType} (${preset.duration} min)`}
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                    {preset.book}
                  </span>
                  {preset.exerciseType && (
                    <span className="text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      • {preset.exerciseType}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded ml-1 border border-purple-200 dark:border-purple-800">
                    {preset.duration}m
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs and Action Buttons */}
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <FormInputs formData={formData} setFormData={setFormData} />
            </div>

            {/* Toggle: Repetir automáticamente cada semana & Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={formData.isRecurring} 
                  onChange={e => setFormData(prev => ({...prev, isRecurring: e.target.checked}))}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span>🔄</span> Repetir automáticamente cada semana
                </span>
              </label>

              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <Button size="sm" className="w-full sm:w-auto px-6 font-semibold bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreate}>
                  Crear Rutina
                </Button>
                <Button size="sm" variant="ghost" className="w-full sm:w-auto px-6 font-semibold" onClick={cancelForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Table Container */}
      <div className="overflow-x-auto w-full scrollbar-thin">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              {/* Sticky Left Column Header */}
              <th className="sticky left-0 bg-slate-50 dark:bg-zinc-900 z-20 px-3 sm:px-4 py-3 w-[190px] min-w-[190px] max-w-[210px] sm:w-[240px] sm:min-w-[240px] sm:max-w-none shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-500 uppercase tracking-wider">
                Rutina Base
              </th>
              {/* 7 Days Headers */}
              {weekDays.map((day, idx) => {
                const isToday = new Date().toDateString() === day.toDateString()
                return (
                  <th key={idx} className="px-1 py-3 text-center w-[72px] min-w-[72px] font-bold text-xs text-slate-500 uppercase tracking-wider">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] sm:text-xs">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                      <span className={cn(
                        "text-[10px] sm:text-[11px] w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mt-1 font-bold", 
                        isToday ? "bg-primary-600 text-white shadow-sm" : "text-slate-500"
                      )}>
                        {day.getDate()}
                      </span>
                    </div>
                  </th>
                )
              })}
              <th className="px-2 sm:px-3 py-3 text-center w-[76px] min-w-[76px] font-bold text-xs text-slate-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {groupedRoutines.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 sm:p-14 text-center">
                  <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner mb-4">
                      <Copy className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg">
                      No hay rutinas programadas para esta semana
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
                      Duplica todos los ejercicios y métodos de práctica de la semana anterior con un solo clic, con todos los días limpios para registrar tu progreso.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleClonePreviousWeek}
                        disabled={isCloning}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isCloning ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{isCloning ? 'Clonando rutinas...' : '📋 Clonar Rutinas de la Semana Anterior'}</span>
                      </button>

                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          cancelForm()
                          setIsAdding(true)
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 h-auto rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border-slate-300 dark:border-slate-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Añadir Rutina</span>
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              groupedRoutines.map((routine) => {
                const isEditing = editingIds && editingIds.join(',') === routine.ids.join(',')
                
                if (isEditing) {
                  return (
                    <tr key={routine.key} className="bg-primary-50/30 dark:bg-primary-950/10">
                      <td className="sticky left-0 bg-white dark:bg-zinc-900 z-10 p-3 sm:p-4 w-[190px] min-w-[190px] max-w-[210px] sm:w-[240px] sm:min-w-[240px] sm:max-w-none shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 dark:border-slate-800">
                        <div className="space-y-3">
                          <FormInputs formData={formData} setFormData={setFormData} />
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                            <input 
                              type="checkbox" 
                              checked={formData.isRecurring} 
                              onChange={e => setFormData(prev => ({...prev, isRecurring: e.target.checked}))}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700"
                            />
                            <span>Repetir cada semana</span>
                          </label>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="w-full h-8 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white" onClick={submitEdit}>Guardar</Button>
                            <Button size="sm" variant="ghost" className="w-full h-8 text-xs font-semibold" onClick={cancelForm}>Cancel</Button>
                          </div>
                        </div>
                      </td>
                      <td colSpan={8} className="p-4 text-slate-400 dark:text-slate-500 text-sm text-center italic">
                        Modificando los parámetros de la rutina semanal...
                      </td>
                    </tr>
                  )
                }

                const colors = INSTRUMENT_COLORS[routine.instrument as Instrument] || INSTRUMENT_COLORS.GUITARRA
                return (
                  <tr key={routine.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Sticky Left Column Detail */}
                    <td className="sticky left-0 bg-white dark:bg-zinc-900 z-10 p-3 sm:p-4 w-[190px] min-w-[190px] max-w-[210px] sm:w-[240px] sm:min-w-[240px] sm:max-w-none shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={cn(
                              "px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border uppercase tracking-wider truncate max-w-[90px] sm:max-w-[120px]",
                              colors.bg, colors.text, colors.border
                            )}>
                              {routine.instrument}
                            </span>
                            {routine.isRecurring && (
                              <span className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/40 px-1 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0" title="Rutina fija semanal">
                                🔄
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-500 shrink-0">{routine.duration}m</span>
                        </div>

                        {routine.book && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5 min-w-0" title={routine.book}>
                            <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate text-[11px] sm:text-xs max-w-[130px] sm:max-w-[180px]">{routine.book}</span>
                          </div>
                        )}

                        {routine.exerciseType && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 min-w-0" title={routine.exerciseType}>
                            <Target className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate text-[11px] sm:text-xs max-w-[130px] sm:max-w-[180px]">{routine.exerciseType}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 7 Interactive Day Cells */}
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const dayDate = weekDays[dayIdx]
                      const existingSession = routine.sessions.find(s => s.dayIndex === dayIdx)
                      
                      return (
                        <td key={dayIdx} className="p-1 sm:p-2 text-center whitespace-nowrap w-[72px] min-w-[72px]">
                          <button
                            type="button"
                            onClick={(e) => handleCellClick(e, dayDate, existingSession, {
                              instrument: routine.instrument as Instrument,
                              duration: routine.duration,
                              book: routine.book || undefined,
                              exerciseType: routine.exerciseType || undefined
                            })}
                            className="group min-h-[44px] min-w-[44px] flex items-center justify-center mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg transition-transform active:scale-95"
                            aria-label={`${existingSession?.completed ? 'Completado' : 'Pendiente'} - ${routine.instrument} - ${dayDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}`}
                          >
                            {existingSession?.completed ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all duration-200">
                                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 opacity-80 leading-none">
                                  {existingSession.duration}m
                                </span>
                              </div>
                            ) : (
                              <div className={cn(
                                "w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                                existingSession
                                  ? "border-slate-300 dark:border-slate-700 text-slate-400 opacity-60"
                                  : "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 opacity-40 border-dashed"
                              )}>
                                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary-500" />
                              </div>
                            )}
                          </button>
                        </td>
                      )
                    })}

                    {/* Action Buttons Column */}
                    <td className="p-1 sm:p-2 text-center whitespace-nowrap w-[76px] min-w-[76px]">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1 min-h-[44px]">
                        <button
                          type="button"
                          onClick={() => handleEditClick(routine)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Editar rutina"
                          aria-label="Editar rutina"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoutine(routine.ids)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Eliminar rutina"
                          aria-label="Eliminar rutina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Popover/Modal flotante para registrar práctica con duración real */}
      {activePopover && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px]" 
            onClick={() => setActivePopover(null)} 
          />
          
          <div
            ref={popoverRef}
            style={
              typeof window !== 'undefined' && window.innerWidth >= 640 ? {
                position: 'fixed',
                top: `${Math.max(16, Math.min(window.innerHeight - 340, activePopover.y))}px`,
                left: `${Math.max(150, Math.min(window.innerWidth - 150, activePopover.x))}px`,
                transform: 'translate(-50%, -100%) translateY(-12px)',
              } : {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
            }
            className="z-50 w-[calc(100vw-32px)] max-w-xs sm:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-3"
          >
            {/* Short Title with Instrument */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Sesión de {activePopover.instrument.toLowerCase()}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {activePopover.dayDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Numeric Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Duración de hoy (min)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={1}
                  value={activePopover.currentDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    setActivePopover(prev => prev ? { ...prev, currentDuration: val } : null)
                  }}
                  className="w-full text-sm font-semibold p-2.5 pr-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-900 dark:text-slate-100"
                />
                <span className="absolute right-3 text-xs font-semibold text-slate-400">min</span>
              </div>
            </div>

            {/* Quick Adjustment Buttons: [-5m], [+5m], [+10m], [+30m] */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '-5m', val: -5 },
                { label: '+5m', val: 5 },
                { label: '+10m', val: 10 },
                { label: '+30m', val: 30 }
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => {
                    setActivePopover(prev => {
                      if (!prev) return null
                      const newVal = Math.max(1, prev.currentDuration + btn.val)
                      return { ...prev, currentDuration: newVal }
                    })
                  }}
                  className="text-[11px] font-bold py-1.5 px-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Action Buttons: Registrar Práctica */}
            <div className="flex items-center gap-2 mt-1">
              <Button
                size="sm"
                className="flex-1 font-semibold text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                onClick={async () => {
                  const duration = activePopover.currentDuration || activePopover.defaultDuration
                  if (activePopover.sessionId) {
                    if (setSessions) {
                      setSessions(prev => prev.map(s => s.id === activePopover.sessionId ? { ...s, completed: true, duration } : s))
                    }
                    await togglePracticeSession(activePopover.sessionId, true, duration)
                  } else {
                    await createPracticeSession({
                      instrument: activePopover.instrument,
                      duration: duration,
                      scheduledAt: activePopover.dayDate,
                      book: activePopover.book || undefined,
                      exerciseType: activePopover.exerciseType || undefined,
                      completed: true
                    })
                  }
                  setActivePopover(null)
                }}
              >
                Registrar Práctica
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs font-semibold"
                onClick={() => setActivePopover(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
