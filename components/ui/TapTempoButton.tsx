'use client'

import React, { useState, useRef } from 'react'
import { Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TapTempoButtonProps {
  onTempoChange: (bpm: number) => void
  currentTempo?: number
  className?: string
  buttonLabel?: string
}

export function TapTempoButton({
  onTempoChange,
  currentTempo,
  className,
  buttonLabel = 'Tap',
}: TapTempoButtonProps) {
  const [isTapping, setIsTapping] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const tapTimesRef = useRef<number[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleTap = () => {
    const now = Date.now()

    // Feedback visual inmediato
    setIsTapping(true)
    setTimeout(() => setIsTapping(false), 120)

    // Si pasaron más de 2 segundos (2000ms) desde el último clic, reiniciar historial
    const lastTap = tapTimesRef.current[tapTimesRef.current.length - 1]
    if (lastTap && now - lastTap > 2000) {
      tapTimesRef.current = []
      setTapCount(0)
    }

    tapTimesRef.current.push(now)
    // Mantener hasta las últimas 5 pulsaciones consecutivas para máxima precisión
    if (tapTimesRef.current.length > 5) {
      tapTimesRef.current.shift()
    }

    const currentTaps = tapTimesRef.current
    setTapCount(currentTaps.length)

    // Al recibir 2 o más pulsaciones consecutivas, calcular BPM
    if (currentTaps.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < currentTaps.length; i++) {
        intervals.push(currentTaps[i] - currentTaps[i - 1])
      }

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      if (avgInterval > 0) {
        let bpm = Math.round(60000 / avgInterval)
        // Limitar a rango musical estándar válido (40 a 240 BPM)
        bpm = Math.min(240, Math.max(40, bpm))
        onTempoChange(bpm)
      }
    }

    // Auto-reset del contador visual si transcurren 2 segundos sin pulsaciones
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setTapCount(0)
      tapTimesRef.current = []
    }, 2000)
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key.toLowerCase() === 't') {
          e.preventDefault()
          handleTap()
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all select-none border cursor-pointer shrink-0',
        isTapping
          ? 'scale-95 bg-primary-600 text-white border-primary-500 ring-2 ring-primary-400 shadow-md'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-700 shadow-xs',
        className
      )}
      title="Haz clics rítmicos o presiona 'T' al compás para calcular el Tempo en BPM"
    >
      <Music
        className={cn(
          'w-3.5 h-3.5 transition-transform',
          isTapping ? 'scale-125 text-white' : 'text-primary-500'
        )}
      />
      <span>
        {buttonLabel}
        {tapCount > 1 ? ` (${tapCount})` : ''}
      </span>
    </button>
  )
}
