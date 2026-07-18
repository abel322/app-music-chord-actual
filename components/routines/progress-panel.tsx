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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Time */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tiempo Práctica</p>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {hours}h {minutes}m
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Target className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Cumplimiento</p>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-slate-800 dark:text-white">{completionPercentage}%</div>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-1000", completionPercentage > 80 ? "bg-emerald-500" : completionPercentage > 40 ? "bg-amber-500" : "bg-red-500")} 
                style={{ width: `${completionPercentage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instrument Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-center">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Distribución
        </p>
        <div className="space-y-2">
          {instrumentStats.length > 0 ? instrumentStats.map(stat => (
            <div key={stat.instrument} className="flex items-center gap-2 text-sm">
              <span className="w-20 font-semibold text-slate-700 dark:text-slate-300 truncate">{stat.instrument}</span>
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${stat.percentage}%` }} />
              </div>
              <span className="w-12 text-right text-slate-500 text-xs font-mono">{stat.minutes}m</span>
            </div>
          )) : (
            <div className="text-sm text-slate-400 text-center py-2 italic">Aún no hay prácticas completadas.</div>
          )}
        </div>
      </div>
    </div>
  )
}
