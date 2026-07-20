'use client'

import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Check, Trash2, BookOpen, Target, Pencil, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  createPracticeSession, 
  togglePracticeSession, 
  updateWeeklyRoutine, 
  deleteWeeklyRoutine, 
  createWeeklyRoutine 
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
}

interface WeeklyCalendarProps {
  sessions: Session[]
}

const INSTRUMENT_COLORS: Record<Instrument, { bg: string, text: string, border: string }> = {
  GUITARRA: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  PIANO: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  BAJO: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  BATERIA: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
}

interface FormInputsProps {
  formData: {
    instrument: Instrument
    duration: number
    book?: string
    exerciseType?: string
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    instrument: Instrument
    duration: number
    book?: string
    exerciseType?: string
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
          className="w-full text-xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
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

export function WeeklyCalendar({ sessions }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAdding, setIsAdding] = useState(false)
  const [editingIds, setEditingIds] = useState<string[] | null>(null)
  
  const [formData, setFormData] = useState<{
    instrument: Instrument, 
    duration: number,
    book?: string,
    exerciseType?: string
  }>({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '' })

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const startOfWeek = getStartOfWeek(currentDate)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + i)
    return d
  })

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

  const handleCreate = async () => {
    if (!isAdding) return
    await createWeeklyRoutine({
      instrument: formData.instrument,
      duration: formData.duration,
      startOfWeek: startOfWeek,
      book: formData.book || undefined,
      exerciseType: formData.exerciseType || undefined
    })
    setIsAdding(false)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '' })
  }

  const handleEditClick = (routine: { instrument: string, duration: number, book: string | null, exerciseType: string | null, ids: string[] }) => {
    setFormData({
      instrument: routine.instrument as Instrument,
      duration: routine.duration,
      book: routine.book || '',
      exerciseType: routine.exerciseType || ''
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
      exerciseType: formData.exerciseType || undefined
    })
    setEditingIds(null)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '' })
  }

  const cancelForm = () => {
    setIsAdding(false)
    setEditingIds(null)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '' })
  }

  const handleCellClick = async (
    dayDate: Date, 
    existingSession?: Session & { dayIndex: number }, 
    routineDetails?: { instrument: Instrument, duration: number, book?: string, exerciseType?: string }
  ) => {
    if (existingSession) {
      await togglePracticeSession(existingSession.id, !existingSession.completed)
    } else if (routineDetails) {
      await createPracticeSession({
        instrument: routineDetails.instrument,
        duration: routineDetails.duration,
        scheduledAt: dayDate,
        book: routineDetails.book,
        exerciseType: routineDetails.exerciseType,
        completed: true
      })
    }
  }

  // Filter and group sessions
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
      sessions: (Session & { dayIndex: number })[]
      ids: string[]
    }> = {}

    activeWeekSessions.forEach(s => {
      const sDate = new Date(s.scheduledAt)
      const day = sDate.getDay()
      const dayIndex = day === 0 ? 6 : day - 1

      const key = `${s.instrument}-${s.duration}-${s.book || ''}-${s.exerciseType || ''}`
      if (!groups[key]) {
        groups[key] = {
          key,
          instrument: s.instrument,
          duration: s.duration,
          book: s.book || null,
          exerciseType: s.exerciseType || null,
          sessions: [],
          ids: []
        }
      }
      groups[key].sessions.push({ ...s, dayIndex })
      groups[key].ids.push(s.id)
    })

    return Object.values(groups)
  }, [activeWeekSessions])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm mb-8">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 gap-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          Matriz de Rutinas Semanales
        </h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-900">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-xs font-semibold px-2 min-w-[130px] text-center text-slate-850 dark:text-slate-200">
              {startOfWeek.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - 
              {weekDays[6].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Button 
            size="sm" 
            onClick={() => {
              cancelForm()
              setIsAdding(true)
            }}
            className="flex items-center gap-2 shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Añadir Rutina
          </Button>
        </div>
      </div>

      {/* Add Form Section */}
      {isAdding && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 animate-in fade-in slide-in-from-top-4 duration-200">
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Nueva Rutina Base Semanal</h4>
          <div className="flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
            <FormInputs formData={formData} setFormData={setFormData} />
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <Button size="sm" className="w-full md:w-auto px-6 font-semibold" onClick={handleCreate}>Crear Rutina</Button>
              <Button size="sm" variant="ghost" className="w-full md:w-auto px-6 font-semibold" onClick={cancelForm}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              {/* Sticky Left Column Header */}
              <th className="sticky left-0 bg-slate-50 dark:bg-slate-905 z-20 px-4 py-3 min-w-[280px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-500 uppercase tracking-wider">
                Rutina Base
              </th>
              {/* 7 Days Headers */}
              {weekDays.map((day, idx) => {
                const isToday = new Date().toDateString() === day.toDateString()
                return (
                  <th key={idx} className="px-3 py-3 text-center min-w-[80px] font-bold text-xs text-slate-500 uppercase tracking-wider">
                    <div className="flex flex-col items-center">
                      <span>{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                      <span className={cn(
                        "text-[11px] w-6 h-6 flex items-center justify-center rounded-full mt-1.5 font-bold", 
                        isToday ? "bg-primary-600 text-white" : "text-slate-500"
                      )}>
                        {day.getDate()}
                      </span>
                    </div>
                  </th>
                )
              })}
              <th className="px-4 py-3 text-center min-w-[100px] font-bold text-xs text-slate-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {groupedRoutines.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-slate-500 italic">
                  No hay rutinas programadas para esta semana. ¡Crea una nueva rutina base para comenzar!
                </td>
              </tr>
            ) : (
              groupedRoutines.map((routine) => {
                const isEditing = editingIds && editingIds.join(',') === routine.ids.join(',')
                
                if (isEditing) {
                  return (
                    <tr key={routine.key} className="bg-primary-50/30 dark:bg-primary-950/10">
                      <td className="sticky left-0 bg-primary-50/80 dark:bg-primary-950/30 z-10 p-4 min-w-[280px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-800">
                        <div className="space-y-3">
                          <FormInputs formData={formData} setFormData={setFormData} />
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="w-full h-8 text-xs font-semibold" onClick={submitEdit}>Guardar</Button>
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
                    <td className="sticky left-0 bg-white dark:bg-slate-900 z-10 p-4 min-w-[280px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
                            colors.bg, colors.text, colors.border
                          )}>
                            {routine.instrument}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{routine.duration}m</span>
                        </div>

                        {routine.book && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1" title="Libro/Método">
                            <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate max-w-[200px]">{routine.book}</span>
                          </div>
                        )}

                        {routine.exerciseType && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400" title="Ejercicio">
                            <Target className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate max-w-[200px]">{routine.exerciseType}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 7 Interactive Day Cells */}
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const dayDate = weekDays[dayIdx]
                      const existingSession = routine.sessions.find(s => s.dayIndex === dayIdx)
                      
                      return (
                        <td key={dayIdx} className="px-3 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleCellClick(dayDate, existingSession, {
                              instrument: routine.instrument as Instrument,
                              duration: routine.duration,
                              book: routine.book || undefined,
                              exerciseType: routine.exerciseType || undefined
                            })}
                            className="group focus:outline-none transition-transform active:scale-95 mx-auto block"
                          >
                            {existingSession?.completed ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all duration-200">
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className={cn(
                                "w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                                existingSession
                                  ? "border-slate-300 dark:border-slate-700 text-slate-400 opacity-60"
                                  : "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-750 opacity-30 border-dashed"
                              )}>
                                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-primary-500" />
                              </div>
                            )}
                          </button>
                        </td>
                      )
                    })}

                    {/* Action Buttons Column */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(routine)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Editar rutina"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteWeeklyRoutine(routine.ids)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Eliminar rutina"
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
    </div>
  )
}
