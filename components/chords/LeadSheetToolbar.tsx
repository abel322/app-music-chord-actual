'use client'

import React, { useState } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LeadSheetToolbarProps {
  isPlaying: boolean
  togglePlayPause?: () => void
  onTogglePlay?: () => void
  handleRestart?: () => void
  onStop?: () => void
  activeMeasureNumber?: number
  currentMeasureNumber?: number
  activeSectionName?: string
  sectionName?: string
  currentSectionLabel?: string
  totalRepeats?: number
  repeatCount?: number
  currentRepeat?: number
  iteration?: number
  isLastRepeat?: boolean
  toggleMetronome?: () => void
  onToggleMute?: () => void
  isMetronomeOn?: boolean
  isMuted?: boolean
  effectiveTempo?: number
  tempo?: number
  onUpdateTempo?: (bpm: number) => void
  className?: string
  currentBeat?: number
  beatsCount?: number
  nextSectionName?: string | null
  totalMeasuresCount?: number

  // Control y visualización de Cuenta Previa (Count-In de 4 pulsos)
  hasCountIn?: boolean
  onToggleCountIn?: () => void
  setHasCountIn?: (value: boolean | ((prev: boolean) => boolean)) => void
  countInBeat?: number | null
}

export type StickyPlaybackTransportProps = LeadSheetToolbarProps

export function LeadSheetToolbar({
  isPlaying,
  togglePlayPause,
  onTogglePlay,
  handleRestart,
  onStop,
  activeMeasureNumber,
  currentMeasureNumber,
  activeSectionName,
  sectionName,
  currentSectionLabel,
  totalRepeats,
  repeatCount,
  currentRepeat,
  iteration,
  isLastRepeat: isLastRepeatProp,
  nextSectionName,
  toggleMetronome,
  onToggleMute,
  isMetronomeOn,
  isMuted = false,
  effectiveTempo,
  tempo = 120,
  onUpdateTempo,
  className,
  hasCountIn = true,
  onToggleCountIn,
  setHasCountIn,
  countInBeat,
}: LeadSheetToolbarProps) {
  const effTempo = effectiveTempo ?? tempo
  const [isEditingTempo, setIsEditingTempo] = useState(false)
  const [localTempoVal, setLocalTempoVal] = useState(effTempo.toString())

  const effActiveMeasure = activeMeasureNumber ?? currentMeasureNumber ?? 1
  const effActiveSection = activeSectionName || sectionName || currentSectionLabel || 'Intro'
  const effCurrentRepeat = currentRepeat ?? iteration ?? 1
  const effTotalRepeats = totalRepeats ?? repeatCount ?? 1
  const effIsLastRepeat =
    isLastRepeatProp !== undefined
      ? isLastRepeatProp
      : effTotalRepeats > 1 && effCurrentRepeat === effTotalRepeats

  const effIsMetronomeOn =
    isMetronomeOn !== undefined ? isMetronomeOn : !isMuted

  const handlePlayPause = togglePlayPause || onTogglePlay || (() => {})
  const handleRestartAction = handleRestart || onStop || (() => {})
  const handleMetronome = toggleMetronome || onToggleMute || (() => {})

  const handleToggleCountIn = () => {
    if (onToggleCountIn) {
      onToggleCountIn()
    } else if (setHasCountIn) {
      setHasCountIn(!hasCountIn)
    }
  }

  const handleCommitLocalTempo = () => {
    setIsEditingTempo(false)
    const parsed = parseInt(localTempoVal, 10)
    if (!isNaN(parsed) && onUpdateTempo) {
      const clamped = Math.min(300, Math.max(30, parsed))
      onUpdateTempo(clamped)
      setLocalTempoVal(clamped.toString())
    } else {
      setLocalTempoVal(effTempo.toString())
    }
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-50 w-full bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-3 py-2 select-none',
        className
      )}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Botón Principal: PAUSAR / INICIAR (Siempre visible y accesible con el pulgar) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePlayPause}
            className={`h-9 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 text-white shadow-md transition-transform active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-400/40'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            title={isPlaying ? 'Pausar reproducción' : 'Iniciar reproducción'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSAR</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>INICIAR</span>
              </>
            )}
          </button>

          {/* Botón Reiniciar / Detener */}
          <button
            type="button"
            onClick={handleRestartAction}
            className="h-9 w-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Reiniciar desde el compás 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Monitor Central: Compás Actual y Sección O Conteo Regresivo de Cuenta Previa */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center px-1">
          {countInBeat !== null && countInBeat !== undefined ? (
            <div className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-3.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 animate-pulse ring-2 ring-amber-300">
              <span className="shrink-0">⏳</span>
              <span className="tracking-wide">ENTRANDO EN: {countInBeat} / 4</span>
            </div>
          ) : isPlaying && effIsLastRepeat ? (
            <div className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 animate-pulse truncate ring-1 ring-amber-300">
              <span className="shrink-0">C.{effActiveMeasure}</span>
              <span className="shrink-0">•</span>
              <span className="truncate">{effActiveSection}</span>
              <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-black shrink-0">
                ⚠️ Última {nextSectionName ? `→ ${nextSectionName}` : ''}
              </span>
            </div>
          ) : (
            <div className="bg-slate-800/90 text-slate-100 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 truncate">
              <span className="text-purple-400 font-extrabold shrink-0">
                C.{effActiveMeasure}
              </span>
              <span className="text-slate-500 shrink-0">•</span>
              <span className="truncate">{effActiveSection}</span>
              {effTotalRepeats > 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 bg-purple-900 text-purple-200">
                  {isPlaying ? `${effCurrentRepeat}/${effTotalRepeats}` : `${effTotalRepeats} Vueltas`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Extremo Derecho: Botón Cuenta Previa 1-2-3-4, Metrónomo y Tempo */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(onToggleCountIn || setHasCountIn || hasCountIn !== undefined) && (
            <button
              type="button"
              onClick={handleToggleCountIn}
              className={`h-9 px-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                hasCountIn
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Cuenta previa de 4 pulsos antes de iniciar"
            >
              1-2-3-4
            </button>
          )}

          <button
            type="button"
            onClick={handleMetronome}
            className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              effIsMetronomeOn
                ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={effIsMetronomeOn ? 'Silenciar metrónomo' : 'Activar metrónomo'}
          >
            {effIsMetronomeOn ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

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
                  setLocalTempoVal(effTempo.toString())
                  setIsEditingTempo(false)
                }
              }}
              autoFocus
              className="w-14 text-center bg-slate-900 text-white rounded-lg text-xs font-mono font-bold border border-purple-500 outline-none h-9 px-1 shrink-0"
            />
          ) : (
            <div
              onClick={() => {
                if (onUpdateTempo) {
                  setLocalTempoVal(effTempo.toString())
                  setIsEditingTempo(true)
                }
              }}
              className={cn(
                'text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700 h-9 flex items-center justify-center shrink-0 select-none',
                onUpdateTempo && 'cursor-pointer hover:text-white hover:border-slate-600'
              )}
              title={onUpdateTempo ? 'Clic para editar BPM' : undefined}
            >
              ⏱️ {effTempo}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const StickyPlaybackTransport = LeadSheetToolbar
