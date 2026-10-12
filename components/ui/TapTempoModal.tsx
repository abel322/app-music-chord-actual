'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Music, X, RotateCcw, Check, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  getCycleBeatsForTimeSignature, 
  getTimeSignatureCycleDescription,
  formatTimeSignaturePulseMarks 
} from '@/lib/rhythm-utils'

interface TapTempoModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyTempo: (bpm: number) => void
  currentTempo?: number
  timeSignature?: string
}

// Clasificación de tempo musical estándar italiano
function getTempoTerm(bpm: number): string {
  if (bpm < 60) return 'Largo (Muy lento)'
  if (bpm <= 75) return 'Adagio (Lento y solemne)'
  if (bpm <= 108) return 'Andante (Paso tranquilo)'
  if (bpm <= 120) return 'Moderato (Moderado)'
  if (bpm <= 168) return 'Allegro (Rápido y vivaz)'
  if (bpm <= 200) return 'Presto (Muy rápido)'
  return 'Prestissimo (Extremadamente rápido)'
}

export function TapTempoModal({
  isOpen,
  onClose,
  onApplyTempo,
  currentTempo = 120,
  timeSignature = '4/4',
}: TapTempoModalProps) {
  const [bpm, setBpm] = useState<number | null>(null)
  const [activeBeat, setActiveBeat] = useState<number>(0)
  const [completedCycles, setCompletedCycles] = useState<number>(0)
  const [isTapping, setIsTapping] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Total acumulado de taps para el ciclo infinito de compás (independiente de la ventana de timestamps)
  const totalTapsRef = useRef<number>(0)
  const tapTimesRef = useRef<number[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const cycleBeats = getCycleBeatsForTimeSignature(timeSignature)
  const cycleDescription = getTimeSignatureCycleDescription(timeSignature)
  const pulseMarks = formatTimeSignaturePulseMarks(timeSignature)

  // Reproducir click sintetizado de metrónomo con Web Audio API
  const playClick = useCallback((isFirstBeat: boolean) => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx()
      }

      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // Frecuencia más aguda y mayor ganancia en el pulso 1 (downbeat) para marcar el compás
      osc.frequency.setValueAtTime(isFirstBeat ? 880 : 587.33, ctx.currentTime)
      gain.gain.setValueAtTime(isFirstBeat ? 0.35 : 0.22, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {
      // Audio no permitido o silenciado
    }
  }, [soundEnabled])

  // Lógica principal de Tap
  const handleTap = useCallback(() => {
    const now = Date.now()

    // Feedback visual momentáneo
    setIsTapping(true)
    setTimeout(() => setIsTapping(false), 120)

    const times = tapTimesRef.current
    const lastTap = times[times.length - 1]

    // Detección de pausa: Si pasaron más de 2.5 segundos, reiniciar para una nueva medición limpia desde T.1
    if (lastTap && now - lastTap > 2500) {
      tapTimesRef.current = []
      totalTapsRef.current = 0
      setBpm(null)
      setActiveBeat(0)
      setCompletedCycles(0)
    }

    // Registrar nuevo tap
    tapTimesRef.current.push(now)
    totalTapsRef.current += 1

    // Para el cálculo estable de BPM, conservar una ventana deslizante de las últimas 10 pulsaciones
    if (tapTimesRef.current.length > 10) {
      tapTimesRef.current.shift()
    }

    // 1. Ciclo Infinito de Compás (Módulo Cíclico):
    // El pulso activo se calcula siempre con el operador módulo respecto a los pulsos por compás
    const currentTapCount = totalTapsRef.current
    const currentBeatInMeasure = ((currentTapCount - 1) % cycleBeats) + 1
    const completedMeasures = Math.floor(currentTapCount / cycleBeats)

    setActiveBeat(currentBeatInMeasure)
    setCompletedCycles(completedMeasures)

    const isDownbeat = currentBeatInMeasure === 1
    playClick(isDownbeat)

    // Calcular BPM a partir de 2 o más pulsaciones consecutivas
    const recentTimes = tapTimesRef.current
    if (recentTimes.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < recentTimes.length; i++) {
        intervals.push(recentTimes[i] - recentTimes[i - 1])
      }

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      if (avgInterval > 0) {
        let calculated = Math.round(60000 / avgInterval)
        calculated = Math.min(240, Math.max(40, calculated))
        setBpm(calculated)
      }
    }

    // 2. Detección de Pausa (Reset Automático por Inactividad tras 2.5s)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setActiveBeat(0)
      setCompletedCycles(0)
      totalTapsRef.current = 0
      tapTimesRef.current = []
    }, 2500)
  }, [cycleBeats, playClick])

  // Reiniciar medición
  const handleReset = () => {
    tapTimesRef.current = []
    totalTapsRef.current = 0
    setBpm(null)
    setActiveBeat(0)
    setCompletedCycles(0)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  // Aplicar tempo medido
  const handleApply = () => {
    const tempoToApply = bpm || currentTempo
    if (tempoToApply) {
      onApplyTempo(tempoToApply)
      onClose()
    }
  }

  // Resetear estados al abrir o cerrar modal
  useEffect(() => {
    if (!isOpen) {
      tapTimesRef.current = []
      totalTapsRef.current = 0
      setActiveBeat(0)
      setCompletedCycles(0)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isOpen])

  // Atajos de teclado: Espacio o 'T' para tap, Escape para cerrar
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === ' ' || e.key.toLowerCase() === 't') {
        e.preventDefault()
        handleTap()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isOpen, handleTap, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 text-center animate-in zoom-in-95 duration-200">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Detector de Tempo (Tap Tempo)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Sincronización por pulsos de compás
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                'p-1.5 rounded-lg border transition-colors',
                soundEnabled
                  ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
              title={soundEnabled ? 'Silenciar click' : 'Activar click de metrónomo'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar modal (Escape)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Indicador de la Métrica Activa y Pulsos por Compás */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">
              Cifra de Compás Activa:
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-mono font-black bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-800">
              {timeSignature}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {cycleDescription}
          </p>

          <div className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            {pulseMarks}
          </div>

          {/* Indicadores Visuales de Progreso (Dots por Pulso con acento en T.1 Downbeat) */}
          <div className="pt-2 flex items-center justify-center gap-3">
            {Array.from({ length: cycleBeats }).map((_, idx) => {
              const beatNumber = idx + 1
              const isActive = activeBeat === beatNumber
              const isDownbeat = beatNumber === 1

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center font-mono font-black text-xs transition-all duration-150 border-2 select-none',
                      isActive && isDownbeat
                        ? 'bg-amber-500 text-white border-amber-300 ring-4 ring-amber-400/50 scale-125 shadow-lg shadow-amber-500/40 animate-pulse'
                        : isActive
                        ? 'bg-primary-500 text-white border-primary-300 ring-4 ring-primary-500/30 scale-110 shadow-md'
                        : isDownbeat
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-300/80 dark:border-amber-700/80'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {beatNumber}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold transition-colors whitespace-nowrap',
                      isActive && isDownbeat
                        ? 'text-amber-600 dark:text-amber-400 font-black'
                        : isActive
                        ? 'text-primary-600 dark:text-primary-400 font-extrabold'
                        : isDownbeat
                        ? 'text-amber-600/70 dark:text-amber-400/70'
                        : 'text-slate-400'
                    )}
                  >
                    {isDownbeat ? 'T.1 (Tierra)' : `T.${beatNumber}`}
                  </span>
                </div>
              )
            })}
          </div>

          {completedCycles > 0 && (
            <div className="text-[11px] font-bold text-primary-600 dark:text-primary-400 pt-1 flex items-center justify-center gap-1.5 animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {completedCycles} {completedCycles === 1 ? 'compás completado' : 'compases completados'}
              </span>
            </div>
          )}
        </div>

        {/* Botón Central Grande e Interactivo para Tapping */}
        <div className="py-2">
          <button
            type="button"
            onClick={handleTap}
            className={cn(
              'w-36 h-36 sm:w-40 sm:h-40 rounded-full mx-auto flex flex-col items-center justify-center gap-1.5 transition-all select-none cursor-pointer border-4 shadow-xl',
              isTapping && activeBeat === 1
                ? 'scale-95 bg-amber-500 border-amber-300 text-white ring-8 ring-amber-400/40 shadow-amber-500/40'
                : isTapping
                ? 'scale-95 bg-primary-600 border-primary-400 text-white ring-8 ring-primary-500/40 shadow-primary-500/30'
                : 'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 border-primary-300 dark:border-primary-600 text-white hover:scale-102 hover:shadow-2xl'
            )}
            title="Haz clic o presiona la barra Espaciadora / tecla T al compás"
          >
            <Music
              className={cn(
                'w-8 h-8 transition-transform duration-100',
                isTapping ? 'scale-125' : 'scale-100'
              )}
            />
            <span className="text-sm sm:text-base font-black tracking-wider uppercase">
              ¡TAP TEMPO!
            </span>
            <span className="text-[10px] font-medium opacity-80">
              Espacio / Tecla T
            </span>
          </button>
        </div>

        {/* Display del Tempo Medido */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {bpm || currentTempo || '--'}
            </span>
            <span className="text-base font-bold text-primary-600 dark:text-primary-400">
              BPM
            </span>
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {bpm ? getTempoTerm(bpm) : `Tempo actual configurado (${currentTempo} BPM)`}
          </div>
        </div>

        {/* Acciones Inferiores: Aplicar, Reiniciar y Cancelar */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1 text-xs font-bold gap-1 text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </Button>

          <Button
            type="button"
            variant="gradient"
            size="sm"
            onClick={handleApply}
            disabled={!bpm && !currentTempo}
            className="flex-2 text-xs font-bold gap-1.5 shadow-md shadow-primary-900/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar Tempo {bpm ? `(${bpm} BPM)` : ''}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
