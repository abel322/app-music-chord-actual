'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Play,
  Square,
  CircleDot,
  Sparkles,
  Clock,
  RotateCcw,
  Check,
  Volume2,
  Trash2,
  Plus,
  Layers,
} from 'lucide-react'
import {
  DrumGrooveData,
  DrumHit,
  DrumPadType,
  DRUM_PRESETS,
  DONNER_DRUM_MAP,
  getDrumInfoByNote,
} from '@/types/drum'
import { useWebMidi } from '@/hooks/useWebMidi'
import { drumSynth } from '@/lib/audio/drumSynth'
import { cn } from '@/lib/utils'

interface DrumGrooveRecorderModalProps {
  isOpen: boolean
  onClose: () => void
  sectionLabel: string
  sectionType?: string
  tempo: number
  timeSignature?: string
  initialGroove?: DrumGrooveData | null
  onSaveGroove: (groove: DrumGrooveData) => void
}

// Pads principales a mostrar en la cuadrícula de secuenciador (Grid)
const SEQUENCER_PADS: { type: DrumPadType; note: number; name: string; isCymbal: boolean }[] = [
  { type: 'CRASH', note: 49, name: 'Crash', isCymbal: true },
  { type: 'RIDE', note: 51, name: 'Ride', isCymbal: true },
  { type: 'HIHAT_OPEN', note: 46, name: 'HH Abierto', isCymbal: true },
  { type: 'HIHAT_CLOSED', note: 42, name: 'HH Cerrado', isCymbal: true },
  { type: 'TOM_HIGH', note: 48, name: 'Tom 1', isCymbal: false },
  { type: 'TOM_MID', note: 45, name: 'Tom 2', isCymbal: false },
  { type: 'SNARE', note: 38, name: 'Caja', isCymbal: false },
  { type: 'TOM_FLOOR', note: 41, name: 'Floor Tom', isCymbal: false },
  { type: 'KICK', note: 36, name: 'Bombo', isCymbal: false },
]

export function DrumGrooveRecorderModal({
  isOpen,
  onClose,
  sectionLabel,
  tempo,
  initialGroove,
  onSaveGroove,
}: DrumGrooveRecorderModalProps) {
  const { isConnected, addHitListener } = useWebMidi()

  // Configuración de compases y cuantización
  const [barsCount, setBarsCount] = useState<number>(initialGroove?.barsCount || 1)
  const [quantizeGrid, setQuantizeGrid] = useState<8 | 16>(initialGroove?.quantizeGrid || 16)
  const [hits, setHits] = useState<DrumHit[]>(initialGroove?.hits || [])

  // Estados del grabador USB y reproductor
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [countDown, setCountDown] = useState<number | null>(null) // 4, 3, 2, 1
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false)
  const [currentPlayStep, setCurrentPlayStep] = useState<number>(-1)

  const totalSteps = barsCount * quantizeGrid
  const stepDurationMs = (60000 / tempo) / (quantizeGrid / 4)

  // Referencias para timers
  const recordingStartTimeRef = useRef<number>(0)
  const previewTimerRef = useRef<any>(null)
  const countInTimerRef = useRef<any>(null)
  const recordedBufferRef = useRef<{ note: number; velocity: number; timeMs: number }[]>([])

  // Detener todo al desmontar o cerrar
  const stopPreview = useCallback(() => {
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current)
      previewTimerRef.current = null
    }
    setIsPlayingPreview(false)
    setCurrentPlayStep(-1)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setCountDown(null)
    if (countInTimerRef.current) {
      clearTimeout(countInTimerRef.current)
      countInTimerRef.current = null
    }
  }, [])

  // Cargar groove inicial al abrir
  useEffect(() => {
    if (isOpen) {
      if (initialGroove) {
        setBarsCount(initialGroove.barsCount || 1)
        setQuantizeGrid(initialGroove.quantizeGrid || 16)
        setHits(initialGroove.hits || [])
      } else {
        // Cargar por defecto el preset estándar de Rock/Pop
        const defaultPreset = DRUM_PRESETS[0]
        setBarsCount(defaultPreset.barsCount)
        setQuantizeGrid(defaultPreset.quantizeGrid)
        setHits(defaultPreset.hits)
      }
    } else {
      stopPreview()
      stopRecording()
    }
  }, [isOpen, initialGroove, stopPreview, stopRecording])

  // Escuchar golpes MIDI de la Donner mientras se graba
  useEffect(() => {
    if (!isRecording || countDown !== null) return

    const unsubscribe = addHitListener((event) => {
      const now = performance.now()
      const elapsedMs = now - recordingStartTimeRef.current

      // Sonido en vivo
      const padInfo = getDrumInfoByNote(event.note)
      drumSynth.playHit(padInfo.type, event.velocity)

      // Guardar en el búfer de grabación
      recordedBufferRef.current.push({
        note: event.note,
        velocity: event.velocity,
        timeMs: elapsedMs,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [isRecording, countDown, addHitListener])

  // Iniciar proceso de grabación con Donner (Cuenta previa de 4 pulsos)
  const startRecordingFlow = () => {
    stopPreview()
    recordedBufferRef.current = []

    let count = 4
    setCountDown(count)
    setIsRecording(true)

    // Intervalo de pulso de metrónomo (negras)
    const beatMs = 60000 / tempo

    // Emitir primer clic de cuenta
    drumSynth.playClick(true, 1.0)

    const countInterval = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountDown(count)
        drumSynth.playClick(false, 0.9)
      } else {
        clearInterval(countInterval)
        setCountDown(null)

        // Inicio exacto de la grabación de los compases
        drumSynth.playClick(true, 1.2)
        recordingStartTimeRef.current = performance.now()

        // Duración total de la grabación (1 o 2 compases)
        const totalDurationMs = beatMs * 4 * barsCount

        countInTimerRef.current = setTimeout(() => {
          // Finalizar grabación y cuantizar
          finalizeRecording(totalDurationMs)
        }, totalDurationMs)
      }
    }, beatMs)
  }

  // Cuantización de golpes grabados
  const finalizeRecording = (totalDurationMs: number) => {
    setIsRecording(false)
    const rawEvents = recordedBufferRef.current
    const quantizedHits: DrumHit[] = []

    const stepMs = totalDurationMs / totalSteps

    rawEvents.forEach((hit) => {
      // Calcular paso más cercano en la rejilla
      const rawStep = Math.round(hit.timeMs / stepMs)
      const clampedStep = Math.max(0, Math.min(totalSteps - 1, rawStep))

      const padInfo = getDrumInfoByNote(hit.note)

      // Evitar duplicados idénticos en el mismo paso
      const alreadyExists = quantizedHits.some(
        (h) => h.step === clampedStep && h.pad === padInfo.type
      )

      if (!alreadyExists) {
        quantizedHits.push({
          step: clampedStep,
          pad: padInfo.type,
          note: hit.note,
          velocity: hit.velocity,
        })
      }
    })

    setHits(quantizedHits)
    drumSynth.playClick(true, 1.0) // Señal auditiva de fin de grabación
  }

  // Preescucha en bucle continuo
  const togglePlayPreview = () => {
    if (isPlayingPreview) {
      stopPreview()
    } else {
      setIsPlayingPreview(true)
      let step = 0
      setCurrentPlayStep(0)

      // Reproducir paso 0 inmediatamente
      playStepAudio(0)

      previewTimerRef.current = setInterval(() => {
        step = (step + 1) % totalSteps
        setCurrentPlayStep(step)
        playStepAudio(step)
      }, stepDurationMs)
    }
  }

  const playStepAudio = (stepIndex: number) => {
    const hitsInStep = hits.filter((h) => h.step === stepIndex)
    hitsInStep.forEach((hit) => {
      drumSynth.playHit(hit.pad, hit.velocity)
    })
  }

  // Alternar o editar un golpe directamente en la rejilla
  const toggleGridCell = (pad: DrumPadType, defaultNote: number, stepIndex: number) => {
    setHits((prev) => {
      const existsIndex = prev.findIndex((h) => h.pad === pad && h.step === stepIndex)
      if (existsIndex >= 0) {
        // Remover golpe
        return prev.filter((_, idx) => idx !== existsIndex)
      } else {
        // Agregar golpe
        drumSynth.playHit(pad, 105)
        return [
          ...prev,
          {
            step: stepIndex,
            pad,
            note: defaultNote,
            velocity: 105,
          },
        ]
      }
    })
  }

  // Cargar un preset de la biblioteca
  const applyPreset = (presetId: string) => {
    const preset = DRUM_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      setBarsCount(preset.barsCount)
      setQuantizeGrid(preset.quantizeGrid)
      setHits(preset.hits)
      // Reproducir primer sonido del preset como feedback
      drumSynth.playHit('KICK', 115)
      drumSynth.playHit('HIHAT_CLOSED', 90)
    }
  }

  // Guardar y cerrar
  const handleSaveAndExit = () => {
    const grooveData: DrumGrooveData = {
      barsCount,
      quantizeGrid,
      hits,
    }
    onSaveGroove(grooveData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[95vh]">
        {/* Cabecera del Grabador */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <CircleDot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Grabador de Groove: {sectionLabel}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  ⏱️ {tempo} BPM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Graba con tu batería Donner USB o selecciona un preset para esta sección.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Herramientas y Modos de Entrada (Donner vs Presets) */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* VÍA A: Grabar con Donner */}
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                onClick={startRecordingFlow}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-900/40 transition-transform active:scale-95 cursor-pointer"
                title="Comenzar cuenta previa de 4 tiempos y grabar golpes de la Donner"
              >
                <CircleDot className="w-4 h-4 fill-current animate-pulse text-rose-200" />
                <span>Grabar con Donner</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Cancelar Grabación</span>
              </button>
            )}

            {/* Preescucha */}
            <button
              onClick={togglePlayPreview}
              disabled={isRecording || hits.length === 0}
              className={cn(
                'h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                isPlayingPreview
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              )}
            >
              {isPlayingPreview ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Preescuchar</span>
                </>
              )}
            </button>
          </div>

          {/* VÍA B: Selector de Presets Rápidos */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 hidden sm:inline">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
            </span>
            <select
              onChange={(e) => applyPreset(e.target.value)}
              defaultValue=""
              className="h-9 bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="" disabled>
                Cargar ritmo precargado...
              </option>
              {DRUM_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>

            {/* Limpiar Rejilla */}
            {hits.length > 0 && (
              <button
                onClick={() => setHits([])}
                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                title="Limpiar todos los golpes"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Panel Central con Cuenta Previa en Vivo o Secuenciador */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Overlay de Cuenta Previa Activa */}
          {countDown !== null && (
            <div className="bg-purple-950/60 border border-purple-500/40 rounded-2xl p-6 text-center animate-in zoom-in-95">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
                ¡Prepárate! Cuenta Previa al Tempo {tempo} BPM
              </span>
              <div className="text-6xl sm:text-7xl font-black text-amber-400 my-2 animate-bounce">
                {countDown}
              </div>
              <p className="text-xs text-slate-300">
                Toca tu Donner al iniciar el compás 1.
              </p>
            </div>
          )}

          {/* Estado de Grabando Activo */}
          {isRecording && countDown === null && (
            <div className="bg-rose-950/60 border border-rose-500/60 rounded-2xl p-4 text-center animate-pulse flex items-center justify-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500" />
              <span className="text-sm font-black text-rose-200">
                🔴 GRABANDO EN VIVO... Toca tu Donner ahora ({barsCount} compás{barsCount > 1 ? 'es' : ''})
              </span>
            </div>
          )}

          {/* Ajustes de Duración y Cuantización */}
          <div className="flex items-center justify-between text-xs bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <span>Compases:</span>
              <button
                onClick={() => setBarsCount(1)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border font-mono font-bold transition-all',
                  barsCount === 1
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                )}
              >
                1 Compás
              </button>
              <button
                onClick={() => setBarsCount(2)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border font-mono font-bold transition-all',
                  barsCount === 2
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                )}
              >
                2 Compases
              </button>
            </div>

            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <span>Rejilla:</span>
              <button
                onClick={() => setQuantizeGrid(16)}
                className={cn(
                  'px-2 py-0.5 rounded-lg border font-mono font-bold transition-all',
                  quantizeGrid === 16
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                )}
              >
                1/16 (Semicorcheas)
              </button>
              <button
                onClick={() => setQuantizeGrid(8)}
                className={cn(
                  'px-2 py-0.5 rounded-lg border font-mono font-bold transition-all',
                  quantizeGrid === 8
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                )}
              >
                1/8 (Corcheas)
              </button>
            </div>
          </div>

          {/* Secuenciador de Pasos (Step Sequencer Grid) */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 overflow-x-auto no-scrollbar">
            <div className="min-w-[620px] space-y-1">
              {/* Encabezado de Pasos (1, e, &, a / 2, e, &, a ...) */}
              <div className="flex items-center mb-2 pl-24">
                {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                  const isBeatStart = stepIdx % 4 === 0
                  const beatNumber = Math.floor((stepIdx % 16) / 4) + 1
                  const isPlayingThisStep = currentPlayStep === stepIdx

                  return (
                    <div
                      key={stepIdx}
                      className={cn(
                        'flex-1 text-center font-mono text-[10px] font-bold py-0.5 transition-colors',
                        isBeatStart ? 'text-amber-400' : 'text-slate-600',
                        isPlayingThisStep && 'bg-purple-500 text-white rounded'
                      )}
                    >
                      {isBeatStart ? beatNumber : '•'}
                    </div>
                  )
                })}
              </div>

              {/* Filas de Pads */}
              {SEQUENCER_PADS.map((pad) => {
                return (
                  <div key={pad.type} className="flex items-center gap-1.5">
                    {/* Etiqueta del Instrumento */}
                    <div
                      onClick={() => drumSynth.playHit(pad.type, 110)}
                      className="w-24 text-right pr-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer select-none flex items-center justify-end gap-1 shrink-0"
                      title="Clic para escuchar sonido"
                    >
                      <span className="truncate">{pad.name}</span>
                    </div>

                    {/* Pasos en la fila */}
                    <div className="flex-1 flex items-center gap-1">
                      {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                        const hasHit = hits.some(
                          (h) => h.step === stepIdx && h.pad === pad.type
                        )
                        const isBeatStart = stepIdx % 4 === 0
                        const isCurrentPlayStep = currentPlayStep === stepIdx

                        return (
                          <button
                            key={stepIdx}
                            onClick={() => toggleGridCell(pad.type, pad.note, stepIdx)}
                            className={cn(
                              'flex-1 h-7 rounded-md transition-all duration-75 border cursor-pointer flex items-center justify-center',
                              hasHit
                                ? pad.isCymbal
                                  ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-sm'
                                  : 'bg-purple-600 border-purple-400 text-white font-black shadow-sm'
                                : isBeatStart
                                ? 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-700'
                                : 'bg-slate-900 border-slate-800/70 hover:bg-slate-800',
                              isCurrentPlayStep && 'ring-2 ring-white scale-110'
                            )}
                          >
                            {hasHit && (
                              <span className="text-[10px] leading-none">
                                {pad.isCymbal ? '✕' : '●'}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pie del Modal con Guardar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            Total de golpes en el patrón: <span className="text-white font-bold">{hits.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAndExit}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar en esta Sección</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
