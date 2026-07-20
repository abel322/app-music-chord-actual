'use client'

import { useState, useMemo } from 'react'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

type Instrument = 'GUITARRA' | 'PIANO' | 'BAJO' | 'BATERIA'

const INSTRUMENT_COLORS: Record<Instrument, { fill: string }> = {
  GUITARRA: { fill: 'from-orange-500 to-amber-500' },
  PIANO: { fill: 'from-blue-500 to-indigo-500' },
  BAJO: { fill: 'from-red-500 to-rose-500' },
  BATERIA: { fill: 'from-emerald-500 to-teal-500' },
}

interface HistoricalDistributionProps {
  instrumentMinutes: Record<Instrument, number>
}

export function HistoricalDistribution({ instrumentMinutes }: HistoricalDistributionProps) {
  const [targetHours, setTargetHours] = useState(100)

  const targetMinutes = useMemo(() => targetHours * 60, [targetHours])

  const instruments: Instrument[] = ['GUITARRA', 'PIANO', 'BAJO', 'BATERIA']

  const distribution = useMemo(() => {
    return instruments.map(inst => {
      const minutes = instrumentMinutes[inst] || 0
      const percentage = targetMinutes === 0 ? 0 : Math.min(Math.round((minutes / targetMinutes) * 100), 100)
      return {
        instrument: inst,
        minutes,
        percentage
      }
    }).sort((a, b) => b.minutes - a.minutes)
  }, [instrumentMinutes, targetMinutes])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">Distribución Histórica</h3>
            <p className="text-xs text-slate-500">Minutos totales acumulados por instrumento</p>
          </div>
        </div>
        
        {/* Dynamic target input */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta:</span>
          <input
            type="number"
            min={1}
            value={targetHours}
            onChange={(e) => setTargetHours(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-16 text-center text-xs font-bold bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-100"
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">hs</span>
        </div>
      </div>

      <div className="space-y-4">
        {distribution.map(item => {
          const colors = INSTRUMENT_COLORS[item.instrument]
          const hrs = Math.floor(item.minutes / 60)
          const mins = item.minutes % 60
          
          return (
            <div key={item.instrument} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{item.instrument}</span>
                <span className="font-mono text-slate-500 font-bold">
                  {hrs > 0 ? `${hrs}h ` : ''}{mins}m / {targetHours}h
                </span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full bg-gradient-to-r rounded-full transition-all duration-500 ease-out", 
                    colors.fill
                  )} 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
