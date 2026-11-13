'use client'

import React, { useState } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Mic, Target, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlaybackMode = 'fixed' | 'band'

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

  // Modo "Seguir a la Banda" (Tempo Adaptativo + Anclaje por Voz)
  playbackMode?: PlaybackMode
  onModeChange?: (mode: PlaybackMode) => void
  bandStatus?: 'idle' | 'listening' | 'tracking' | 'holding'
  inputLevel?: number
  lastVoiceAction?: string
  sensitivity?: number
  onSensitivityChange?: (sens: number) => void
  onTapDownbeat?: () => void
  liveBpm?: number
  bandErrorMsg?: string | null
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

  // Modo "Seguir a la Banda"
  playbackMode = 'fixed',
  onModeChange,
  bandStatus = 'idle',
  inputLevel = 0,
  lastVoiceAction,
  sensitivity = 0.65,
  onSensitivityChange,
  onTapDownbeat,
  liveBpm,
  bandErrorMsg,
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
        'sticky top-0 z-50 w-full bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-2 sm:px-3 py-2 select-none space-y-1.5',
        className
      )}
    >
      <div className="max-w-4xl mx-auto space-y-1.5">
        {/* Selector de Modo (⏱ Tempo Fijo vs 🎧 Seguir a la Banda) + Ajustes Rápidos */}
        {onModeChange && (
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => onModeChange('fixed')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                  playbackMode === 'fixed'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Reproducción con temporizador y metrónomo a BPM fijo"
              >
                <span>⏱</span>
                <span>Tempo Fijo (BPM)</span>
              </button>
              <button
                type="button"
                onClick={() => onModeChange('band')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                  playbackMode === 'band'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Escuchar al micrófono y sincronizar dinámicamente con los músicos en vivo"
              >
                <span>🎧</span>
                <span>Seguir a la Banda</span>
              </button>
            </div>

            {playbackMode === 'band' && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* VU Meter Mic */}
                <div
                  className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2 py-1 rounded-lg text-slate-300"
                  title={`Nivel del micrófono en tiempo real: ${inputLevel}%`}
                >
                  <Mic
                    className={cn(
                      'w-3.5 h-3.5 transition-colors',
                      inputLevel > 10 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                    )}
                  />
                  <div className="w-12 sm:w-16 h-2 bg-slate-700/80 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-75',
                        inputLevel > 65
                          ? 'bg-amber-400'
                          : inputLevel > 15
                          ? 'bg-emerald-400'
                          : 'bg-slate-500'
                      )}
                      style={{ width: `${Math.min(100, inputLevel)}%` }}
                    />
                  </div>
                </div>

                {/* Control de Sensibilidad (Baja / Media / Alta) */}
                <div className="flex items-center bg-slate-800/80 border border-slate-700/80 p-0.5 rounded-lg text-[11px] font-bold">
                  <span className="text-slate-400 px-1.5 hidden sm:inline">Sens:</span>
                  <button
                    type="button"
                    onClick={() => onSensitivityChange?.(0.35)}
                    className={cn(
                      'px-2 py-0.5 rounded transition-all cursor-pointer',
                      sensitivity <= 0.45
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                    title="Baja: para salas con mucho ruido o batería acústica fuerte"
                  >
                    Baja
                  </button>
                  <button
                    type="button"
                    onClick={() => onSensitivityChange?.(0.65)}
                    className={cn(
                      'px-2 py-0.5 rounded transition-all cursor-pointer',
                      sensitivity > 0.45 && sensitivity < 0.85
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                    title="Media: recomendada para la mayoría de ensayos"
                  >
                    Media
                  </button>
                  <button
                    type="button"
                    onClick={() => onSensitivityChange?.(0.95)}
                    className={cn(
                      'px-2 py-0.5 rounded transition-all cursor-pointer',
                      sensitivity >= 0.85
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                    title="Alta: para ensayos acústicos suaves o voces bajas"
                  >
                    Alta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de Error si el micrófono falló o fue denegado */}
        {bandErrorMsg && playbackMode === 'band' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-950/80 border border-red-700 text-red-200 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{bandErrorMsg}</span>
          </div>
        )}

        {/* Fila Principal de Transporte */}
        <div className="flex items-center justify-between gap-2">
          {/* Botón Principal: PAUSAR / INICIAR + Reiniciar + Marcar T.1 */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`h-9 px-3 sm:px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 text-white shadow-md transition-transform active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-400/40'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              title={isPlaying ? 'Pausar' : 'Iniciar'}
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

            {/* Botón Táctil: Marcar Tiempo 1 (en modo Seguir a la Banda) */}
            {playbackMode === 'band' && (
              <button
                type="button"
                onClick={onTapDownbeat}
                className="h-9 px-2 sm:px-2.5 bg-purple-700/80 hover:bg-purple-600 text-white rounded-xl flex items-center gap-1 text-xs font-black border border-purple-500/80 shadow-xs transition-transform active:scale-90 cursor-pointer shrink-0"
                title="Marcar Tiempo 1: Re-sincronizar el beat 1 con un toque táctil"
              >
                <Target className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Marcar </span>
                <span>T.1</span>
              </button>
            )}
          </div>

          {/* Monitor Central: Compás Actual, Estado en Vivo y Comandos de Voz */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center px-1">
            {playbackMode === 'band' ? (
              <div className="flex items-center gap-1.5 max-w-full truncate">
                {isPlaying ? (
                  bandStatus === 'holding' ? (
                    <div className="bg-amber-400/20 text-amber-300 border border-amber-500/60 font-black text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 animate-pulse truncate ring-1 ring-amber-400/40">
                      <span className="shrink-0 text-amber-300">⏸</span>
                      <span className="font-extrabold tracking-wide">Esperando entrada...</span>
                      <span className="text-amber-400/60 shrink-0">•</span>
                      <span className="shrink-0 text-amber-200 font-mono">C.{effActiveMeasure}</span>
                      <span className="text-amber-400/60 shrink-0">•</span>
                      <span className="truncate">{effActiveSection}</span>
                    </div>
                  ) : bandStatus === 'tracking' ? (
                    <div className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 font-black text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 truncate ring-1 ring-emerald-400/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span className="font-extrabold tracking-wide">🟢 Siguiendo ritmo (~{liveBpm || effTempo} BPM)</span>
                      <span className="text-emerald-400/60 shrink-0">•</span>
                      <span className="shrink-0 font-mono text-white">C.{effActiveMeasure}</span>
                      <span className="text-emerald-400/60 shrink-0">•</span>
                      <span className="truncate text-emerald-100">{effActiveSection}</span>
                    </div>
                  ) : (
                    <div className="bg-purple-950/80 text-purple-200 border border-purple-500/60 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 truncate">
                      <span className="shrink-0">👂</span>
                      <span>Escuchando banda...</span>
                      <span className="text-purple-400/60 shrink-0">•</span>
                      <span className="shrink-0 font-mono">C.{effActiveMeasure}</span>
                      <span className="text-purple-400/60 shrink-0">•</span>
                      <span className="truncate">{effActiveSection}</span>
                    </div>
                  )
                ) : (
                  <div className="bg-slate-800/90 text-slate-100 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 truncate">
                    <span className="text-purple-400 font-extrabold shrink-0">
                      C.{effActiveMeasure}
                    </span>
                    <span className="text-slate-500 shrink-0">•</span>
                    <span className="truncate">{effActiveSection}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 bg-purple-900/60 text-purple-200 border border-purple-700/50">
                      Modo Banda Listo
                    </span>
                  </div>
                )}

                {/* Badge de Acción de Voz Reciente */}
                {lastVoiceAction && (
                  <div className="bg-purple-600 text-white font-black text-xs px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce shrink-0 ring-1 ring-purple-300">
                    <span>{lastVoiceAction}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Monitor Central en Modo Tempo Fijo */
              countInBeat !== null && countInBeat !== undefined ? (
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
              )
            )}
          </div>

          {/* Extremo Derecho: En Modo Fijo (1-2-3-4, Metrónomo, Tempo) | En Modo Banda (BPM Live + Voz) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {playbackMode === 'band' ? (
              <div className="flex items-center gap-1.5">
                <div
                  className="text-xs font-mono font-black text-purple-300 bg-purple-950/80 px-2 py-1.5 rounded-lg border border-purple-800/80 h-9 flex items-center justify-center shrink-0 shadow-inner"
                  title="Tempo adaptativo detectado en vivo por el micrófono"
                >
                  <span>⚡ {liveBpm || effTempo} BPM</span>
                </div>
                <div
                  className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-1 rounded-lg"
                  title="Di en voz alta: 'Coro', 'Estrofa', 'Puente', 'Repetir' para anclar la canción"
                >
                  <span>🎙️</span>
                  <span>Voz activa</span>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const StickyPlaybackTransport = LeadSheetToolbar
