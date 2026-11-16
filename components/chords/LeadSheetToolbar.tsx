'use client'

import React, { useState } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlaybackMode = 'fixed'

export interface LeadSheetToolbarProps {
  isPlaying: boolean
  togglePlayPause?: () => void
  onTogglePlay?: () => void
  handleRestart?: () => void
  onStop?: () => void
  activeSectionName?: string
  sectionName?: string
  currentSectionLabel?: string
  totalRepeats?: number
  repeatCount?: number
  currentRepeat?: number
  iteration?: number
  toggleMetronome?: () => void
  onToggleMute?: () => void
  isMetronomeOn?: boolean
  isMuted?: boolean
  effectiveTempo?: number
  tempo?: number
  onUpdateTempo?: (bpm: number) => void
  className?: string
  nextSectionName?: string | null
  totalMeasuresCount?: number
  [key: string]: any
}

export type StickyPlaybackTransportProps = LeadSheetToolbarProps

export function LeadSheetToolbar({
  isPlaying,
  togglePlayPause,
  onTogglePlay,
  handleRestart,
  onStop,
  activeSectionName,
  sectionName,
  currentSectionLabel,
  totalRepeats,
  repeatCount,
  currentRepeat,
  iteration,
  nextSectionName,
  toggleMetronome,
  onToggleMute,
  isMetronomeOn,
  isMuted = false,
  effectiveTempo,
  tempo = 120,
  onUpdateTempo,
  className,
}: LeadSheetToolbarProps) {
  const effTempo = effectiveTempo ?? tempo
  const [isEditingTempo, setIsEditingTempo] = useState(false)
  const [localTempoVal, setLocalTempoVal] = useState(effTempo.toString())

  const effActiveSection = activeSectionName || sectionName || currentSectionLabel || 'Intro'
  const effCurrentRepeat = currentRepeat ?? iteration ?? 1
  const effTotalRepeats = totalRepeats ?? repeatCount ?? 1

  const effIsMetronomeOn =
    isMetronomeOn !== undefined ? isMetronomeOn : !isMuted

  const handlePlayPause = togglePlayPause || onTogglePlay || (() => {})
  const handleRestartAction = handleRestart || onStop || (() => {})
  const handleMetronome = toggleMetronome || onToggleMute || (() => {})

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
        'w-full bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl px-3 py-2.5 select-none',
        className
      )}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5">
        {/* Botón Principal: PAUSAR / INICIAR + Reiniciar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePlayPause}
            className={`h-9 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 text-white shadow-md transition-transform active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-400/40'
                : 'bg-emerald-600 hover:bg-emerald-700 ring-1 ring-emerald-400/30'
            }`}
            title={isPlaying ? 'Pausar avance de secciones' : 'Iniciar avance inmediato de secciones'}
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

          {/* Botón Reiniciar / Volver al inicio */}
          <button
            type="button"
            onClick={handleRestartAction}
            className="h-9 w-9 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center justify-center border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Reiniciar desde la primera sección"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Monitor Central: Sección Activa En Curso */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center px-1">
          {isPlaying ? (
            <div className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-2 truncate ring-1 ring-cyan-400/40">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-white font-extrabold tracking-wide truncate">{effActiveSection}</span>
              <span className="text-cyan-400/60 shrink-0">•</span>
              <span className="text-[10px] text-cyan-200 uppercase font-black shrink-0">
                En Curso
              </span>
              {effTotalRepeats > 1 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 bg-cyan-900/80 text-cyan-200">
                  {effCurrentRepeat}/{effTotalRepeats}
                </span>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/90 text-slate-200 text-xs font-mono font-bold px-3 py-1 rounded-xl border border-slate-700 flex items-center gap-2 truncate">
              <span className="text-cyan-400 font-extrabold shrink-0">●</span>
              <span className="text-white font-extrabold truncate">{effActiveSection}</span>
              <span className="text-slate-500 text-[10px] font-normal shrink-0">(Pausa)</span>
              {nextSectionName && (
                <span className="hidden sm:inline text-slate-400 text-[10px] shrink-0">
                  → Viene {nextSectionName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Extremo Derecho: Metrónomo y Tempo BPM */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleMetronome}
            className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              effIsMetronomeOn
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={effIsMetronomeOn ? 'Silenciar metrónomo' : 'Activar sonido de metrónomo'}
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
              className="w-14 text-center bg-slate-900 text-white rounded-lg text-xs font-mono font-bold border border-cyan-500 outline-none h-9 px-1 shrink-0"
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
                'text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 h-9 flex items-center justify-center shrink-0 select-none',
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
