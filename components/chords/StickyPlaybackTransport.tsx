'use client'

import React, { useState } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StickyPlaybackTransportProps {
  isPlaying: boolean
  isMuted?: boolean
  isMetronomeOn?: boolean
  tempo?: number
  effectiveTempo?: number
  tempoInput?: string
  currentMeasureNumber?: number
  activeMeasureNumber?: number
  currentBeat?: number
  beatsCount?: number
  currentSectionLabel?: string
  sectionName?: string
  activeSectionName?: string
  nextSectionName?: string | null
  totalMeasuresCount?: number
  iteration?: number
  currentRepeat?: number
  repeatCount?: number
  totalRepeats?: number
  measureIndexInSection?: number
  totalMeasuresInSection?: number
  onTogglePlay?: () => void
  togglePlayPause?: () => void
  onStop?: () => void
  onToggleMute?: () => void
  toggleMetronome?: () => void
  onUpdateTempo?: (bpm: number) => void
  className?: string
}

export function StickyPlaybackTransport({
  isPlaying,
  isMuted = false,
  isMetronomeOn,
  tempo = 120,
  effectiveTempo,
  currentMeasureNumber = 1,
  activeMeasureNumber,
  currentBeat = 1,
  beatsCount = 4,
  currentSectionLabel,
  sectionName,
  activeSectionName,
  nextSectionName,
  totalMeasuresCount,
  iteration = 1,
  currentRepeat,
  repeatCount = 1,
  totalRepeats,
  measureIndexInSection = 0,
  totalMeasuresInSection,
  onTogglePlay,
  togglePlayPause,
  onStop,
  onToggleMute,
  toggleMetronome,
  onUpdateTempo,
  className,
}: StickyPlaybackTransportProps) {
  const effTempo = effectiveTempo ?? tempo
  const [isEditingTempo, setIsEditingTempo] = useState(false)
  const [localTempoVal, setLocalTempoVal] = useState(effTempo.toString())

  const effActiveMeasureNumber = activeMeasureNumber ?? currentMeasureNumber
  const effActiveSectionName = activeSectionName || sectionName || currentSectionLabel || ''
  const effCurrentRepeat = currentRepeat ?? iteration ?? 1
  const effTotalRepeats = totalRepeats ?? repeatCount ?? 1
  const isLastRepeat = effTotalRepeats > 1 && effCurrentRepeat === effTotalRepeats
  const metronomeActive = isMetronomeOn !== undefined ? isMetronomeOn : !isMuted
  const handleTogglePlay = togglePlayPause || onTogglePlay || (() => {})
  const handleToggleMetronome = toggleMetronome || onToggleMute || (() => {})

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
    <div className={cn('sticky top-0 z-40 w-full px-2 py-1.5 sm:px-4 sm:py-2 select-none', className)}>
      <div className="mx-auto max-w-xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl px-2.5 py-1.5 sm:px-4 sm:py-2 flex flex-col gap-1.5">
        {/* FILA PRINCIPAL: Controles y Posición */}
        <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
          {/* 1. Lado Izquierdo: Botón Play/Pausa + Compás */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 text-white shadow-sm transition-all shrink-0 cursor-pointer ${
                isPlaying ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              title={isPlaying ? 'Pausar reproducción' : 'Iniciar reproducción'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Pausa</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Iniciar</span>
                </>
              )}
            </button>

            {/* Botón Detener / Reiniciar al Compás 1 (Visible en desktop) */}
            {onStop && (
              <button
                type="button"
                onClick={onStop}
                className="hidden sm:flex h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 items-center justify-center transition-all shrink-0 cursor-pointer"
                title="Reiniciar reproducción al Compás 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Indicador de Compás Actual */}
            <div className="bg-slate-800 text-slate-200 text-xs font-mono font-bold px-2 py-1 rounded-lg border border-slate-700/60 shrink-0 flex items-center gap-1.5">
              <span>C.{effActiveMeasureNumber || 1}</span>
              {totalMeasuresCount ? (
                <span className="text-slate-500 text-[10px] hidden sm:inline">
                  /{totalMeasuresCount}
                </span>
              ) : null}
              {beatsCount > 0 && (
                <div className="hidden sm:flex items-center gap-0.5 ml-0.5">
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
              )}
            </div>
          </div>

          {/* 2. Centro: Monitor de Sección y Vuelta (Compacto en móvil) */}
          <div className="flex items-center justify-center min-w-0 flex-1 px-1">
            {effTotalRepeats > 1 ? (
              isLastRepeat ? (
                <div className="bg-amber-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full truncate shadow-sm flex items-center gap-1">
                  <span>⚠️ Última</span>
                  {nextSectionName && (
                    <span className="hidden sm:inline">→ Viene {nextSectionName}</span>
                  )}
                </div>
              ) : (
                <div className="bg-purple-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full truncate shadow-sm">
                  <span className="truncate max-w-[80px] xs:max-w-none inline-block align-bottom">{effActiveSectionName}</span>
                  <span className="opacity-90 ml-1 whitespace-nowrap">V.{effCurrentRepeat}/{effTotalRepeats}</span>
                </div>
              )
            ) : (
              <span className="text-xs font-semibold text-slate-300 truncate">
                {effActiveSectionName}
              </span>
            )}
          </div>

          {/* 3. Lado Derecho: Metrónomo y Tempo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleMetronome}
              className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                metronomeActive
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={metronomeActive ? 'Silenciar metrónomo' : 'Activar metrónomo'}
            >
              {metronomeActive ? <Volume2 className="w-3.5 h-3.5 text-purple-400" /> : <VolumeX className="w-3.5 h-3.5" />}
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
                className="w-12 text-center bg-slate-900 text-white rounded text-[11px] font-mono font-bold border border-purple-500 outline-none h-8 px-1 shrink-0"
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
                  'text-[11px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700/60 shrink-0 whitespace-nowrap',
                  onUpdateTempo && 'cursor-pointer hover:text-white hover:border-slate-600'
                )}
                title={onUpdateTempo ? 'Clic para editar BPM' : undefined}
              >
                ⏱️ {effTempo}
              </div>
            )}
          </div>
        </div>

        {/* SUB-FILA OPCIONAL (Solo en móvil si es Última Vuelta y hay próxima sección): */}
        {isLastRepeat && nextSectionName && (
          <div className="sm:hidden w-full text-center py-0.5 bg-amber-400/10 border border-amber-400/30 rounded-lg text-[10px] font-bold text-amber-300 flex items-center justify-center gap-1 animate-pulse">
            <span>⚠️ Última vuelta</span>
            <span>→</span>
            <span className="uppercase text-amber-200 font-extrabold">{nextSectionName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Alias para exportación como LeadSheetToolbar
export const LeadSheetToolbar = StickyPlaybackTransport
