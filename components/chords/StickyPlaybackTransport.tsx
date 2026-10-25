'use client'

import React, { useState } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StickyPlaybackTransportProps {
  isPlaying: boolean
  isMuted: boolean
  tempo: number
  tempoInput?: string
  currentMeasureNumber?: number
  currentBeat?: number
  beatsCount?: number
  currentSectionLabel?: string
  sectionName?: string
  nextSectionName?: string | null
  totalMeasuresCount?: number
  iteration?: number
  currentRepeat?: number
  repeatCount?: number
  totalRepeats?: number
  measureIndexInSection?: number
  totalMeasuresInSection?: number
  onTogglePlay: () => void
  onStop: () => void
  onToggleMute: () => void
  onUpdateTempo?: (bpm: number) => void
  className?: string
}

export function StickyPlaybackTransport({
  isPlaying,
  isMuted,
  tempo,
  currentMeasureNumber = 1,
  currentBeat = 1,
  beatsCount = 4,
  currentSectionLabel,
  sectionName,
  nextSectionName,
  totalMeasuresCount,
  iteration = 1,
  currentRepeat,
  repeatCount = 1,
  totalRepeats,
  measureIndexInSection = 0,
  totalMeasuresInSection,
  onTogglePlay,
  onStop,
  onToggleMute,
  onUpdateTempo,
  className,
}: StickyPlaybackTransportProps) {
  const [isEditingTempo, setIsEditingTempo] = useState(false)
  const [localTempoVal, setLocalTempoVal] = useState(tempo.toString())

  const effSectionName = sectionName || currentSectionLabel || ''
  const effCurrentRepeat = currentRepeat ?? iteration ?? 1
  const effTotalRepeats = totalRepeats ?? repeatCount ?? 1

  const handleCommitLocalTempo = () => {
    setIsEditingTempo(false)
    const parsed = parseInt(localTempoVal, 10)
    if (!isNaN(parsed) && onUpdateTempo) {
      const clamped = Math.min(300, Math.max(30, parsed))
      onUpdateTempo(clamped)
      setLocalTempoVal(clamped.toString())
    } else {
      setLocalTempoVal(tempo.toString())
    }
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-40 transition-all duration-200 select-none',
        // Modo Píldora Flotante en Móviles (sm:hidden) / Fila Delgada en Desktop (sm:flex)
        'my-1.5 mx-2 rounded-2xl ring-1 ring-slate-700/60 shadow-2xl sm:my-0 sm:mx-0 sm:rounded-none sm:ring-0 sm:shadow-md sm:border-b sm:border-slate-800/80',
        'bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white',
        'h-12 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3',
        className
      )}
    >
      {/* 1. Izquierda: Acción Principal (Iniciar/Pausar + Reiniciar) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onTogglePlay}
          className={cn(
            'h-8 px-2.5 sm:px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm',
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 ring-1 ring-rose-400/60'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
          )}
          title={isPlaying ? 'Pausar reproducción (Barra Espaciadora)' : 'Iniciar reproducción (Barra Espaciadora)'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="text-xs">Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="text-xs">Iniciar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onStop}
          className="h-8 w-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Reiniciar reproducción al Compás 1"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Centro: Monitor de Posición en Tiempo Real y Monitor Permanente de Repeticiones (Sticky HUD) */}
      <div className="flex items-center justify-center min-w-0 flex-1 px-1 gap-2">
        <div className="text-xs font-mono bg-slate-800/80 px-2 py-1 rounded-md text-slate-200 border border-slate-700/50 flex items-center gap-1.5 max-w-full truncate shadow-2xs shrink-0">
          <span className="font-bold text-white whitespace-nowrap">
            C.{currentMeasureNumber}
            {totalMeasuresCount ? (
              <span className="text-slate-500 text-[10px] hidden xs:inline">
                /{totalMeasuresCount}
              </span>
            ) : null}
          </span>

          {effSectionName && (
            <>
              <span className="text-slate-500 text-[10px]">•</span>
              <span className="text-purple-300 font-sans font-bold truncate text-[11px] max-w-[70px] sm:max-w-[120px]">
                {effSectionName}
              </span>
            </>
          )}

          {/* Marcadores de Pulso Rítmico */}
          <div className="flex items-center gap-0.5 shrink-0 ml-0.5">
            {Array.from({ length: beatsCount }).map((_, bIdx) => {
              const beatNum = bIdx + 1
              const isCurrentBeat = isPlaying && currentBeat === beatNum
              const isFirstBeat = beatNum === 1

              return (
                <span
                  key={bIdx}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-75',
                    isCurrentBeat
                      ? isFirstBeat
                        ? 'bg-purple-400 scale-125 shadow-xs shadow-purple-400'
                        : 'bg-amber-400 scale-110 shadow-xs shadow-amber-400'
                      : 'bg-slate-600 opacity-40'
                  )}
                  title={`Pulso ${beatNum}`}
                />
              )
            })}
          </div>
        </div>

        {/* Monitor Permanente de Repetición en la Barra Superior Sticky */}
        {effTotalRepeats > 1 && (
          effCurrentRepeat === effTotalRepeats ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-extrabold shadow-lg animate-pulse shrink-0">
              <span>⚠️ ÚLTIMA VUELTA</span>
              {nextSectionName && (
                <span className="bg-amber-300 px-1.5 py-0.5 rounded text-[11px] font-black">
                  → Viene {nextSectionName}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-700 text-white rounded-full text-xs font-bold shadow-md shrink-0">
              <span className="truncate max-w-[80px] sm:max-w-[130px]">🔁 {effSectionName}</span>
              <span className="bg-purple-900/80 px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap">
                Vuelta {effCurrentRepeat}/{effTotalRepeats}
              </span>
            </div>
          )
        )}
      </div>

      {/* 3. Derecha: Metrónomo y Tempo Esenciales */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Toggle Metrónomo compacto */}
        <button
          type="button"
          onClick={onToggleMute}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-lg border transition-all active:scale-95 cursor-pointer shadow-xs relative',
            !isMuted
              ? 'bg-purple-950/70 border-purple-500/60 text-purple-300 hover:bg-purple-900/60'
              : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-300 hover:bg-slate-700/80'
          )}
          title={isMuted ? 'Activar sonido del metrónomo' : 'Silenciar metrónomo'}
        >
          {!isMuted ? (
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span
            className={cn(
              'absolute top-1 right-1 w-1.5 h-1.5 rounded-full',
              !isMuted ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-slate-500'
            )}
          />
        </button>

        {/* Chip de Tempo simplificado */}
        <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg h-8 px-1 text-xs font-mono font-bold text-slate-200 shadow-xs">
          {onUpdateTempo && (
            <button
              type="button"
              onClick={() => onUpdateTempo(Math.max(30, tempo - 1))}
              className="w-4 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/70 rounded transition-colors text-xs font-black cursor-pointer"
              title="Reducir 1 BPM"
            >
              -
            </button>
          )}

          {isEditingTempo ? (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localTempoVal}
              onChange={(e) => setLocalTempoVal(e.target.value.replace(/\D/g, ''))}
              onBlur={handleCommitLocalTempo}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitLocalTempo()
                if (e.key === 'Escape') {
                  setLocalTempoVal(tempo.toString())
                  setIsEditingTempo(false)
                }
              }}
              autoFocus
              className="w-9 text-center bg-slate-900 text-white rounded px-0.5 text-xs font-bold border border-purple-500 outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setLocalTempoVal(tempo.toString())
                setIsEditingTempo(true)
              }}
              className="px-1 text-[11px] whitespace-nowrap flex items-center gap-0.5 hover:text-white transition-colors cursor-pointer"
              title="Clic para editar BPM directamente"
            >
              <span className="opacity-70 text-[10px]">⏱</span>
              <span>{tempo}</span>
              <span className="text-[9px] text-slate-400 font-sans uppercase hidden xs:inline">bpm</span>
            </button>
          )}

          {onUpdateTempo && (
            <button
              type="button"
              onClick={() => onUpdateTempo(Math.min(300, tempo + 1))}
              className="w-4 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/70 rounded transition-colors text-xs font-black cursor-pointer"
              title="Aumentar 1 BPM"
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
