'use client'

import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Check, Trash2, BookOpen, Target, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPracticeSession, togglePracticeSession, deletePracticeSession, updatePracticeSession } from '@/app/actions/routines'
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
      <select 
        value={formData.instrument} 
        onChange={e => setFormData(prev => ({...prev, instrument: e.target.value as Instrument}))}
        className="w-full text-xs p-1 rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none"
      >
        <option value="GUITARRA">Guitarra</option>
        <option value="PIANO">Piano</option>
        <option value="BAJO">Bajo</option>
        <option value="BATERIA">Batería</option>
      </select>
      
      <div className="flex items-center gap-1">
        <input 
          type="number" 
          value={formData.duration} 
          onChange={e => setFormData(prev => ({...prev, duration: parseInt(e.target.value) || 0}))}
          className="w-full text-xs p-1 rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none"
          placeholder="Minutos"
        />
      </div>

      <input 
        type="text" 
        value={formData.book} 
        onChange={e => setFormData(prev => ({...prev, book: e.target.value}))}
        className="w-full text-[10px] p-1 rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none placeholder:text-slate-400"
        placeholder="Libro/Método (opcional)"
      />
      <input 
        type="text" 
        value={formData.exerciseType} 
        onChange={e => setFormData(prev => ({...prev, exerciseType: e.target.value}))}
        className="w-full text-[10px] p-1 rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none placeholder:text-slate-400"
        placeholder="Ejercicio (opcional)"
      />
    </>
  )
}

export function WeeklyCalendar({ sessions }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAdding, setIsAdding] = useState<Date | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  
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
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + i)
    return d
  })

  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const handleCreate = async () => {
    if (!isAdding) return
    await createPracticeSession({
      instrument: formData.instrument,
      duration: formData.duration,
      scheduledAt: isAdding,
      book: formData.book || undefined,
      exerciseType: formData.exerciseType || undefined
    })
    setIsAdding(null)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '' })
  }

  const handleEditClick = (session: Session) => {
    setFormData({
      instrument: session.instrument as Instrument,
      duration: session.duration,
      book: session.book || '',
      exerciseType: session.exerciseType || ''
    })
    setEditingId(session.id)
    setIsAdding(null)
  }

  const submitEdit = async () => {
    if (!editingId) return
    await updatePracticeSession(editingId, {
      instrument: formData.instrument,
      duration: formData.duration,
      book: formData.book || undefined,
      exerciseType: formData.exerciseType || undefined
    })
    setEditingId(null)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '' })
  }

  const cancelForm = () => {
    setIsAdding(null)
    setEditingId(null)
    setFormData({ instrument: 'GUITARRA', duration: 60, book: '', exerciseType: '' })
  }



  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm mb-8">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          Calendario Semanal
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium w-32 text-center">
            {startOfWeek.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - 
            {weekDays[6].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
          </span>
          <Button variant="ghost" size="sm" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/50">
        {weekDays.map((day, idx) => {
          const isToday = new Date().toDateString() === day.toDateString()
          const daySessions = sessions.filter(s => new Date(s.scheduledAt).toDateString() === day.toDateString())

          return (
            <div key={idx} className="min-h-[120px] md:min-h-[200px] flex flex-col p-3 md:p-2 gap-2">
              <div className="flex md:flex-col items-center justify-between md:justify-center mb-2 pb-2 md:pb-0 border-b border-slate-100 dark:border-slate-800/50 md:border-b-0">
                <p className="text-xs font-semibold text-slate-400 uppercase md:hidden">
                  {day.toLocaleDateString('es-ES', { weekday: 'long' })}
                </p>
                <p className="text-xs font-semibold text-slate-400 uppercase hidden md:block">
                  {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                </p>
                <p className={cn("text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full md:mx-auto", isToday ? "bg-primary-600 text-white" : "text-slate-700 dark:text-slate-300")}>
                  {day.getDate()}
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                {daySessions.map(session => {
                  if (editingId === session.id) {
                    return (
                      <div key={session.id} className="p-2 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-xs space-y-2">
                        <FormInputs formData={formData} setFormData={setFormData} />
                        <div className="flex gap-1 pt-1">
                          <Button size="sm" className="w-full h-6 text-[10px]" onClick={submitEdit}>Guardar</Button>
                          <Button size="sm" variant="ghost" className="w-full h-6 text-[10px]" onClick={cancelForm}>Cancel</Button>
                        </div>
                      </div>
                    )
                  }

                  const colors = INSTRUMENT_COLORS[session.instrument as Instrument] || INSTRUMENT_COLORS.GUITARRA
                  return (
                    <div key={session.id} className={cn("relative group p-2 text-xs rounded-lg border flex flex-col gap-1.5", colors.bg, colors.text, colors.border, session.completed && "opacity-50 line-through")}>
                      <div className="flex items-center justify-between">
                        <div className="font-bold truncate">{session.instrument}</div>
                        <div className="flex items-center gap-1">
                          <span>{session.duration}m</span>
                          <button 
                            onClick={() => handleEditClick(session)} 
                            className="p-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100" 
                            title="Editar práctica"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {session.book && (
                        <div className="flex items-center gap-1 text-[10px] opacity-80" title="Libro/Método">
                          <BookOpen className="w-3 h-3 shrink-0" />
                          <span className="truncate">{session.book}</span>
                        </div>
                      )}
                      
                      {session.exerciseType && (
                        <div className="flex items-center gap-1 text-[10px] opacity-80" title="Ejercicio">
                          <Target className="w-3 h-3 shrink-0" />
                          <span className="truncate">{session.exerciseType}</span>
                        </div>
                      )}

                      <div className="flex gap-1 justify-end mt-1">
                        <button onClick={() => togglePracticeSession(session.id, !session.completed)} className="p-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100" title="Marcar completado">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => deletePracticeSession(session.id)} className="p-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100" title="Eliminar">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {isAdding?.toDateString() === day.toDateString() ? (
                  <div className="p-2 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-xs space-y-2 mt-auto">
                    <FormInputs formData={formData} setFormData={setFormData} />
                    <div className="flex gap-1 pt-1">
                      <Button size="sm" className="w-full h-6 text-[10px]" onClick={handleCreate}>OK</Button>
                      <Button size="sm" variant="ghost" className="w-full h-6 text-[10px]" onClick={cancelForm}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      cancelForm() // reset any ongoing edit
                      setIsAdding(day)
                    }}
                    className="w-full py-1.5 mt-auto flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
