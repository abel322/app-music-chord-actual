'use client'

import { Activity, Target, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Session {
  id: string
  instrument: string
  duration: number
  scheduledAt: Date
  completed: boolean
}

export function ProgressPanel({ sessions }: { sessions: Session[] }) {
  // Calculate Stats
  const totalScheduled = sessions.length
  const totalCompleted = sessions.filter(s => s.completed).length
  const completionPercentage = totalScheduled === 0 ? 0 : Math.round((totalCompleted / totalScheduled) * 100)

  const totalMinutes = sessions.filter(s => s.completed).reduce((acc, s) => acc + s.duration, 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const instruments = ['GUITARRA', 'PIANO', 'BAJO', 'BATERIA']
  const instrumentStats = instruments.map(inst => {
    const instSessions = sessions.filter(s => s.instrument === inst && s.completed)
    const mins = instSessions.reduce((acc, s) => acc + s.duration, 0)
    return { instrument: inst, minutes: mins, percentage: totalMinutes === 0 ? 0 : Math.round((mins / totalMinutes) * 100) }
  }).filter(stat => stat.minutes > 0).sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 w-full">
      {/* Total Time */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3.5 sm:gap-4 w-full">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">Tiempo Práctica</p>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white truncate">
            {hours}h {minutes}m
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3.5 sm:gap-4 w-full">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">Cumplimiento</p>
          <div className="flex items-center gap-2.5 sm:gap-3 w-full">
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white shrink-0">{completionPercentage}%</div>
            <div className="flex-1 min-w-0 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full">
              <div 
                className={cn("h-full rounded-full transition-all duration-1000", completionPercentage > 80 ? "bg-emerald-500" : completionPercentage > 40 ? "bg-amber-500" : "bg-red-500")} 
                style={{ width: `${completionPercentage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instrument Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-center w-full">
        <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 shrink-0" /> <span className="truncate">Distribución</span>
        </p>
        <div className="space-y-2 w-full">
          {instrumentStats.length > 0 ? instrumentStats.map(stat => (
            <div key={stat.instrument} className="flex items-center gap-2 text-xs sm:text-sm w-full">
              <span className="w-16 sm:w-20 font-semibold text-slate-700 dark:text-slate-300 truncate shrink-0 text-xs sm:text-sm">{stat.instrument}</span>
              <div className="flex-1 min-w-0 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full">
                <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${stat.percentage}%` }} />
              </div>
              <span className="w-10 sm:w-12 text-right text-slate-500 text-xs font-mono shrink-0">{stat.minutes}m</span>
            </div>
          )) : (
            <div className="text-xs sm:text-sm text-slate-400 text-center py-2 italic">Aún no hay prácticas completadas.</div>
          )}
        </div>
      </div>
    </div>
  )
}
