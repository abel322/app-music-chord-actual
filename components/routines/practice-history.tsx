'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, BookOpen, Target, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Session {
  id: string
  instrument: string
  duration: number
  scheduledAt: Date
  completed: boolean
  book?: string | null
  exerciseType?: string | null
}

export function PracticeHistory({ sessions }: { sessions: Session[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterInstrument, setFilterInstrument] = useState<string>('TODOS')

  const filteredSessions = useMemo(() => {
    return sessions
      .filter(s => {
        // Filter by instrument
        if (filterInstrument !== 'TODOS' && s.instrument !== filterInstrument) return false
        
        // Filter by search term (book or exerciseType)
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase()
          const bookMatch = s.book?.toLowerCase().includes(term)
          const exerciseMatch = s.exerciseType?.toLowerCase().includes(term)
          if (!bookMatch && !exerciseMatch) return false
        }
        
        return true
      })
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  }, [sessions, searchTerm, filterInstrument])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          Historial de Prácticas
        </h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar libro o ejercicio..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
            />
          </div>
          
          <div className="relative w-full sm:w-40 flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={filterInstrument}
              onChange={e => setFilterInstrument(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all appearance-none cursor-pointer text-slate-900 dark:text-slate-100"
            >
              <option value="TODOS">Todos</option>
              <option value="GUITARRA">Guitarra</option>
              <option value="PIANO">Piano</option>
              <option value="BAJO">Bajo</option>
              <option value="BATERIA">Batería</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Fecha</th>
              <th className="px-6 py-4 font-semibold">Instrumento</th>
              <th className="px-6 py-4 font-semibold">Duración</th>
              <th className="px-6 py-4 font-semibold">Libro / Método</th>
              <th className="px-6 py-4 font-semibold">Ejercicio</th>
              <th className="px-6 py-4 font-semibold text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredSessions.length > 0 ? filteredSessions.map(session => (
              <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {new Date(session.scheduledAt).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                  {session.instrument}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {session.duration} min
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {session.book ? (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{session.book}</span>
                    </div>
                  ) : <span className="text-slate-300 dark:text-slate-600 italic">-</span>}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {session.exerciseType ? (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{session.exerciseType}</span>
                    </div>
                  ) : <span className="text-slate-300 dark:text-slate-600 italic">-</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {session.completed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Circle className="w-3.5 h-3.5" /> Pendiente
                    </span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No se encontraron prácticas que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
