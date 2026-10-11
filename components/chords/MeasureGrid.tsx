'use client'

import React, { useState } from 'react'
import { Measure, ChordBeat, BeatAccent } from '@/types/measure'
import { getBeatsPerMeasure, duplicateMeasure, applyProgressionFromMeasure } from '@/lib/measure-utils'
import { detectCadence, HarmonicProgression, CadenceDefinition, PRESET_CADENCES, getProgressionChords } from '@/lib/harmonic-theory'
import { ProgressionPicker } from './ProgressionPicker'
import { CadencePicker } from './CadencePicker'
import { Plus, Trash2, Repeat, Edit3, X, Check, Copy, Split, Sparkles, Tag, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MeasureGridProps {
  measures: Measure[]
  timeSignature?: string
  currentKey?: string
  diatonicChords?: string[]
  isEditing?: boolean
  onUpdateMeasures: (updatedMeasures: Measure[]) => void
  onAddMeasures?: (count: number) => void
  onRemoveMeasure?: (measureId: string) => void
}

export function MeasureGrid({
  measures,
  timeSignature = '4/4',
  currentKey = 'C',
  diatonicChords = [],
  isEditing = false,
  onUpdateMeasures,
  onAddMeasures,
  onRemoveMeasure,
}: MeasureGridProps) {
  const beatsPerMeasure = getBeatsPerMeasure(timeSignature)
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null)
  const [editingBeat, setEditingBeat] = useState<{ measureId: string; beatNumber: number; chord: string } | null>(null)

  const selectedMeasure = measures.find((m) => m.id === selectedMeasureId)

  // Actualizar un compás específico
  const handleUpdateMeasure = (updated: Measure) => {
    onUpdateMeasures(measures.map((m) => (m.id === updated.id ? updated : m)))
  }

  // Guardar un acorde en un pulso específico
  const handleSaveBeatChord = (measureId: string, beatNumber: number, newChord: string, accent: BeatAccent = 'normal') => {
    const trimmedChord = newChord.trim()
    const measure = measures.find((m) => m.id === measureId)
    if (!measure) return

    let updatedBeats = [...measure.beats]
    const existingIndex = updatedBeats.findIndex((b) => b.beat === beatNumber)

    if (trimmedChord === '') {
      if (existingIndex !== -1) {
        updatedBeats.splice(existingIndex, 1)
      }
    } else {
      if (existingIndex !== -1) {
        updatedBeats[existingIndex] = {
          ...updatedBeats[existingIndex],
          chord: trimmedChord,
          accent,
        }
      } else {
        updatedBeats.push({
          id: `beat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          beat: beatNumber,
          chord: trimmedChord,
          accent,
        })
      }
    }

    updatedBeats.sort((a, b) => a.beat - b.beat)

    handleUpdateMeasure({
      ...measure,
      beats: updatedBeats,
    })
    setEditingBeat(null)
  }

  // Aplicar una progresión a partir de un compás específico
  const handleApplyProgressionFromHere = (measureId: string, prog: HarmonicProgression) => {
    const chords = getProgressionChords(prog, currentKey)
    const updated = applyProgressionFromMeasure(measures, measureId, chords, timeSignature)
    onUpdateMeasures(updated)
  }

  // Asignar o desasignar cadencia armónica en un compás
  const handleSetCadenceOnMeasure = (measureId: string, cad: CadenceDefinition | null) => {
    const measure = measures.find((m) => m.id === measureId)
    if (!measure) return

    if (!cad) {
      handleUpdateMeasure({
        ...measure,
        cadence: undefined,
        cadenceLabel: undefined,
        cadenceColor: undefined,
      })
    } else {
      handleUpdateMeasure({
        ...measure,
        cadence: cad.id || cad.type,
        cadenceLabel: `${cad.name} (${cad.degrees})`,
        cadenceColor: cad.colorBadge,
      })
    }
  }

  // Dividir el compás en 2 acordes (ej: Beat 1 y Beat 3 en 4/4)
  const handleSplitMeasure = (measureId: string, chord1: string, chord2: string) => {
    const measure = measures.find((m) => m.id === measureId)
    if (!measure) return

    const midBeat = Math.ceil(beatsPerMeasure / 2) + 1 // Beat 3 en 4/4
    const newBeats: ChordBeat[] = [
      {
        id: `beat-${Date.now()}-1`,
        beat: 1,
        chord: chord1 || 'C',
        accent: 'normal',
        duration: Math.floor(beatsPerMeasure / 2),
      },
      {
        id: `beat-${Date.now()}-2`,
        beat: midBeat,
        chord: chord2 || 'G',
        accent: 'normal',
        duration: Math.floor(beatsPerMeasure / 2),
      },
    ]

    handleUpdateMeasure({
      ...measure,
      beats: newBeats,
    })
  }

  // Duplicar compás
  const handleDuplicate = (measureId: string) => {
    const duplicatedList = duplicateMeasure(measures, measureId)
    onUpdateMeasures(duplicatedList)
  }

  // Toggle repetición
  const handleToggleRepeat = (measureId: string, type: 'start' | 'end') => {
    const measure = measures.find((m) => m.id === measureId)
    if (!measure) return

    if (type === 'start') {
      handleUpdateMeasure({ ...measure, repeatStart: !measure.repeatStart })
    } else {
      handleUpdateMeasure({ ...measure, repeatEnd: !measure.repeatEnd })
    }
  }

  // Toggle casilla Volta (1 o 2)
  const handleToggleVolta = (measureId: string, voltaNumber: number) => {
    const measure = measures.find((m) => m.id === measureId)
    if (!measure) return
    const newVolta = measure.volta === voltaNumber ? undefined : voltaNumber
    handleUpdateMeasure({ ...measure, volta: newVolta })
  }

  return (
    <div className="space-y-4">
      {/* Rejilla de Compases: 4 Compases por Fila (Lead Sheet estándar) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {measures.map((measure, index) => {
          const isSelected = selectedMeasureId === measure.id
          const hasChords = measure.beats.length > 0
          const primaryChord = measure.beats.find((b) => b.beat === 1)?.chord || (measure.beats[0]?.chord ?? '')
          const singleChordFullMeasure = measure.beats.length === 1 && measure.beats[0].beat === 1

          // Detección automática o etiqueta manual de cadencia armónica
          const prevMeasure = index > 0 ? measures[index - 1] : null
          const prevChord = prevMeasure?.beats[prevMeasure.beats.length - 1]?.chord || prevMeasure?.beats[0]?.chord || ''
          const detectedCadence = detectCadence(primaryChord, prevChord, currentKey)

          const cadenceToDisplay = measure.cadenceLabel || (detectedCadence ? `${detectedCadence.name} (${detectedCadence.degrees})` : null)
          const cadenceColor = measure.cadenceColor || detectedCadence?.colorBadge || 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800'

          // Pulsos del compás
          const beatsArray = Array.from({ length: beatsPerMeasure }, (_, i) => i + 1)

          return (
            <div
              key={measure.id}
              onClick={() => {
                if (isEditing) setSelectedMeasureId(measure.id)
              }}
              className={cn(
                'group relative flex flex-col justify-between rounded-xl border transition-all duration-200 select-none min-h-[102px] sm:min-h-[115px] p-2.5 sm:p-3',
                isSelected && isEditing
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/40 shadow-md'
                  : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm',
                measure.repeatStart && 'border-l-[5px] border-l-primary-600 dark:border-l-primary-500',
                measure.repeatEnd && 'border-r-[5px] border-r-primary-600 dark:border-r-primary-500',
                isEditing && 'cursor-pointer hover:shadow-md'
              )}
            >
              {/* Barra superior de la celda: Número de compás, Cadencia detectada, y Repeticiones */}
              <div className="flex items-center justify-between text-[11px] leading-none mb-1 gap-1">
                <div className="flex items-center gap-1.5 font-mono shrink-0">
                  <span className="text-slate-400 dark:text-slate-500 font-bold">
                    {measure.measureNumber}
                  </span>

                  {measure.repeatStart && (
                    <span className="font-extrabold text-primary-600 dark:text-primary-400 text-xs tracking-tighter" title="Inicio de repetición">
                      |:
                    </span>
                  )}
                </div>

                {/* Badge de Cadencia Armónica (Automática o Manual) */}
                {cadenceToDisplay && (
                  <div className="truncate max-w-[130px] sm:max-w-[160px]">
                    <span 
                      className={cn(
                        'inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-tight truncate',
                        cadenceColor
                      )} 
                      title={cadenceToDisplay}
                    >
                      {cadenceToDisplay}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  {measure.volta && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      {measure.volta}ª
                    </span>
                  )}

                  {measure.repeatEnd && (
                    <span className="font-extrabold text-primary-600 dark:text-primary-400 text-xs tracking-tighter" title="Fin de repetición">
                      :| {measure.repeatCount ? `x${measure.repeatCount}` : ''}
                    </span>
                  )}

                  {/* Botones de acción rápida al pasar el cursor en modo edición */}
                  {isEditing && (
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicate(measure.id)
                        }}
                        className="p-0.5 rounded text-slate-400 hover:text-primary-600 transition-colors"
                        title="Duplicar compás"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {onRemoveMeasure && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveMeasure(measure.id)
                          }}
                          className="p-0.5 rounded text-slate-400 hover:text-red-500 transition-colors"
                          title="Eliminar compás"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido Armónico del Compás (Chords & Beats) */}
              <div className="flex-1 flex flex-col justify-center my-1">
                {singleChordFullMeasure ? (
                  /* Caso 1: Un solo acorde dura todo el compás */
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-mono text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {primaryChord}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-600 font-mono text-[11px] font-bold mt-0.5">
                      {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                        <span key={i}>/</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Caso 2: Compás dividido en pulsos (ej. 2 acordes o más) */
                  <div className="grid grid-cols-4 gap-1 w-full text-center items-end py-0.5">
                    {beatsArray.map((beatNum) => {
                      const beatData = measure.beats.find((b) => b.beat === beatNum)

                      return (
                        <div
                          key={beatNum}
                          onClick={(e) => {
                            if (isEditing) {
                              e.stopPropagation()
                              setEditingBeat({
                                measureId: measure.id,
                                beatNumber: beatNum,
                                chord: beatData?.chord || '',
                              })
                            }
                          }}
                          className={cn(
                            'flex flex-col items-center justify-between p-1 rounded-md transition-colors',
                            isEditing ? 'hover:bg-primary-100/70 dark:hover:bg-primary-950/60 cursor-pointer' : '',
                            beatData?.chord ? 'font-bold' : 'text-slate-300 dark:text-slate-700'
                          )}
                        >
                          <div className="h-7 flex items-center justify-center">
                            {beatData?.chord ? (
                              <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">
                                {beatData.chord}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-300 dark:text-slate-700 font-semibold">
                                /
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
                            {beatNum}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Letra guía rítmica debajo del compás */}
              {measure.guideLyric && (
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate font-serif">
                    &quot;{measure.guideLyric}&quot;
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Panel Inspector Interactivo del Compás Seleccionado en Modo Edición */}
      {isEditing && selectedMeasure && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md animate-in fade-in space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-primary-600 text-white shadow-sm">
                Compás #{selectedMeasure.measureNumber}
              </span>
              <span className="text-xs text-slate-500">
                Ajuste modular por compás: Progresiones, Cadencias y Pulsos
              </span>
            </div>

            {/* Acciones Modulares por Compás */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Selector Desacoplado: Aplicar Progresión desde este compás */}
              <ProgressionPicker
                currentKey={currentKey}
                buttonLabel="✦ Progresión desde aquí"
                buttonVariant="subtle"
                onSelectProgression={(prog) => handleApplyProgressionFromHere(selectedMeasure.id, prog)}
              />

              {/* 2. Selector Desacoplado: Marcar Cadencia en este compás */}
              <CadencePicker
                currentCadenceId={selectedMeasure.cadence}
                buttonLabel="✦ Marcar Cadencia"
                buttonVariant="subtle"
                onSelectCadence={(cad) => handleSetCadenceOnMeasure(selectedMeasure.id, cad)}
              />

              {/* Duplicar Compás */}
              <button
                type="button"
                onClick={() => handleDuplicate(selectedMeasure.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
                title="Clonar este compás"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicar
              </button>

              {/* Dividir en 2 Acordes (Beat 1 y Beat 3) */}
              <button
                type="button"
                onClick={() => {
                  const c1 = selectedMeasure.beats[0]?.chord || (diatonicChords[0] || 'C')
                  const c2 = diatonicChords[4] || 'G'
                  handleSplitMeasure(selectedMeasure.id, c1, c2)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/50 transition-colors shadow-sm"
                title="Dividir en 2 acordes de 2 tiempos"
              >
                <Split className="w-3.5 h-3.5" /> 2 Acordes / Compás
              </button>

              {/* Repeticiones */}
              <button
                type="button"
                onClick={() => handleToggleRepeat(selectedMeasure.id, 'start')}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shadow-sm',
                  selectedMeasure.repeatStart
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                |: Inicio
              </button>
              <button
                type="button"
                onClick={() => handleToggleRepeat(selectedMeasure.id, 'end')}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shadow-sm',
                  selectedMeasure.repeatEnd
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                :| Fin
              </button>
            </div>
          </div>

          {/* Asignación de Acordes por Pulso (Beats) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
              const bNum = idx + 1
              const currentBeat = selectedMeasure.beats.find((b) => b.beat === bNum)

              return (
                <div key={bNum} className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Pulso {bNum}</span>
                    {currentBeat?.chord && (
                      <button
                        type="button"
                        onClick={() => handleSaveBeatChord(selectedMeasure.id, bNum, '')}
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    defaultValue={currentBeat?.chord || ''}
                    placeholder={`Acorde ${bNum}`}
                    onBlur={(e) => handleSaveBeatChord(selectedMeasure.id, bNum, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveBeatChord(selectedMeasure.id, bNum, (e.target as HTMLInputElement).value)
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-extrabold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase text-slate-900 dark:text-white"
                  />
                </div>
              )
            })}
          </div>

          {/* Paleta rápida de Acordes Diatónicos en la tonalidad activa */}
          {diatonicChords.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" /> Acordes en {currentKey}:
              </span>
              {diatonicChords.map((chord) => (
                <button
                  key={chord}
                  type="button"
                  onClick={() => {
                    handleSaveBeatChord(selectedMeasure.id, 1, chord)
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/60 hover:text-primary-600 transition-colors shadow-sm"
                >
                  {chord}
                </button>
              ))}
            </div>
          )}

          {/* Letra Guía del Compás y Atajos de Cadencias Populares */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            {/* Letra rítmica guía */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Letra rítmica de guía para este compás:
              </label>
              <input
                type="text"
                defaultValue={selectedMeasure.guideLyric || ''}
                placeholder="Ej: Cuando la noche cae..."
                onBlur={(e) => {
                  handleUpdateMeasure({
                    ...selectedMeasure,
                    guideLyric: e.target.value,
                  })
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Insignia / Atajos Rápidos de Cadencia */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-purple-500" /> Insignia de Cadencia en este compás:
                </label>
                {selectedMeasure.cadence && (
                  <button
                    type="button"
                    onClick={() => handleSetCadenceOnMeasure(selectedMeasure.id, null)}
                    className="text-[11px] text-red-500 hover:underline font-semibold"
                  >
                    Quitar Cadencia
                  </button>
                )}
              </div>

              {/* Botones de 1 clic para cadencias frecuentes */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_CADENCES.slice(0, 5).map((cad) => {
                  const isActive = selectedMeasure.cadence === cad.type || selectedMeasure.cadence === cad.id
                  return (
                    <button
                      key={cad.id}
                      type="button"
                      onClick={() => handleSetCadenceOnMeasure(selectedMeasure.id, cad)}
                      className={cn(
                        'px-2 py-1 rounded-md text-[10px] font-bold border transition-all truncate',
                        isActive
                          ? cn(cad.colorBadge, 'ring-2 ring-purple-500/50')
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      )}
                      title={cad.description}
                    >
                      {cad.name.split('(')[0].replace('Cadencia ', '')} ({cad.degrees})
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones rápidos para añadir compases en Modo Edición */}
      {isEditing && onAddMeasures && (
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Agregar compases a la sección:</span>
          <button
            type="button"
            onClick={() => onAddMeasures(4)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> +4 Compases
          </button>
          <button
            type="button"
            onClick={() => onAddMeasures(8)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> +8 Compases
          </button>
          <button
            type="button"
            onClick={() => onAddMeasures(1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> +1 Compás
          </button>
        </div>
      )}
    </div>
  )
}
