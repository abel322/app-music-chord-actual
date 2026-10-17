'use client'

import React from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadSheetPlaybackControlsProps {
  isPlaying: boolean
  isMuted: boolean
  currentMeasureNumber?: number
  currentBeat: number
  beatsCount: number
  currentSectionLabel?: string
  totalMeasuresCount: number
  currentFlatMeasureIndex: number
  onTogglePlay: () => void
  onStop: () => void
  onToggleMute: () => void
  className?: string
}

export function LeadSheetPlaybackControls({
  isPlaying,
  isMuted,
  currentMeasureNumber = 1,
  currentBeat = 1,
  beatsCount = 4,
  currentSectionLabel,
  totalMeasuresCount,
  currentFlatMeasureIndex,
  onTogglePlay,
  onStop,
  onToggleMute,
  className,
}: LeadSheetPlaybackControlsProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap select-none', className)}>
      {/* Botón Principal: Iniciar / Pausar */}
      <button
        type="button"
        onClick={onTogglePlay}
        className={cn(
          'px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer shadow-md',
          isPlaying
            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/50'
            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400/40 hover:shadow-emerald-500/40'
        )}
        title={isPlaying ? 'Pausar reproducción en este compás' : 'Iniciar reproducción al tempo de la canción'}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pausar</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Iniciar</span>
          </>
        )}
      </button>

      {/* Botón Detener / Reiniciar al Compás 1 */}
      <button
        type="button"
        onClick={onStop}
        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
        title="Detener reproducción y volver al Compás 1 de la Intro"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Reiniciar</span>
      </button>

      {/* Botón Toggle Metrónomo (Audio) */}
      <button
        type="button"
        onClick={onToggleMute}
        className={cn(
          'px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm',
          !isMuted
            ? 'bg-purple-950/70 border-purple-500/60 text-purple-300 hover:bg-purple-900/60'
            : 'bg-slate-800/90 border-slate-700/80 text-slate-400 hover:text-slate-300 hover:bg-slate-700/90'
        )}
        title={isMuted ? 'Activar sonido del metrónomo (clic de audio)' : 'Silenciar metrónomo'}
      >
        {!isMuted ? (
          <Volume2 className="w-3.5 h-3.5 text-purple-400" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span className="hidden sm:inline">Metrónomo</span>
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            !isMuted ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-slate-500'
          )}
        />
      </button>

      {/* Indicador Visual en Vivo de Pulso y Compás */}
      {totalMeasuresCount > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-mono">
          <span className="text-[11px] font-bold text-slate-300">
            C.{currentMeasureNumber}
            <span className="text-slate-500 text-[10px]">
              /{totalMeasuresCount}
            </span>
          </span>

          {/* Marcadores de Pulso (Pulsan al compás del metrónomo) */}
          <div className="flex items-center gap-1">
            {Array.from({ length: beatsCount }).map((_, bIdx) => {
              const beatNum = bIdx + 1
              const isCurrentBeat = isPlaying && currentBeat === beatNum
              const isFirstBeat = beatNum === 1

              return (
                <span
                  key={bIdx}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-100',
                    isCurrentBeat
                      ? isFirstBeat
                        ? 'bg-purple-400 scale-125 shadow-xs shadow-purple-400'
                        : 'bg-amber-400 scale-110 shadow-xs shadow-amber-400'
                      : 'bg-slate-700 opacity-60'
                  )}
                  title={`Pulso ${beatNum}`}
                />
              )
            })}
          </div>

          {currentSectionLabel && (
            <span className="hidden lg:inline text-[10px] text-purple-400/90 font-sans font-semibold max-w-[80px] truncate">
              {currentSectionLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
