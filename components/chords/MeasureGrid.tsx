'use client'

import React, { useState } from 'react'
import { Measure, ChordBeat, BeatAccent } from '@/types/measure'
import { getBeatsPerMeasure } from '@/lib/measure-utils'
import { Plus, Trash2, Repeat, Edit3, X, Check } from 'lucide-react'
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
      // Eliminar el acorde en ese pulso
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

    // Ordenar pulsos por número
    updatedBeats.sort((a, b) => a.beat - b.beat)

    handleUpdateMeasure({
      ...measure,
      beats: updatedBeats,
    })
    setEditingBeat(null)
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
      {/* Rejilla de Compases: 4 Compases por Fila (Estándar Lead Sheet) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {measures.map((measure, index) => {
          const isSelected = selectedMeasureId === measure.id
          const hasChords = measure.beats.length > 0
          const primaryChord = measure.beats.find((b) => b.beat === 1)?.chord || (measure.beats[0]?.chord ?? '')
          const singleChordFullMeasure = measure.beats.length === 1 && measure.beats[0].beat === 1

          // Pulsos del compás
          const beatsArray = Array.from({ length: beatsPerMeasure }, (_, i) => i + 1)

          return (
            <div
              key={measure.id}
              onClick={() => {
                if (isEditing) setSelectedMeasureId(measure.id)
              }}
              className={cn(
                'relative flex flex-col justify-between rounded-xl border transition-all duration-200 select-none min-h-[92px] sm:min-h-[104px] p-2.5 sm:p-3',
                // Estilo estilo Lead Sheet / Chart de estudio
                isSelected && isEditing
                  ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/30 ring-2 ring-primary-500/30'
                  : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600',
                measure.repeatStart && 'border-l-[5px] border-l-primary-600 dark:border-l-primary-500',
                measure.repeatEnd && 'border-r-[5px] border-r-primary-600 dark:border-r-primary-500',
                isEditing && 'cursor-pointer hover:shadow-md'
              )}
            >
              {/* Barra superior de la celda: Número de compás, Marcadores de repetición y Volta */}
              <div className="flex items-center justify-between text-[11px] leading-none mb-1">
                <div className="flex items-center gap-1.5 font-mono">
                  {/* Número discreto de compás */}
                  <span className="text-slate-400 dark:text-slate-500 font-bold">
                    {measure.measureNumber}
                  </span>

                  {/* Símbolo de Repetición Apertura |: */}
                  {measure.repeatStart && (
                    <span className="font-extrabold text-primary-600 dark:text-primary-400 text-xs tracking-tighter" title="Inicio de repetición">
                      |:
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Casilla de 1ª o 2ª repetición (Volta) */}
                  {measure.volta && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      {measure.volta}ª
                    </span>
                  )}

                  {/* Símbolo de Repetición Cierre :| */}
                  {measure.repeatEnd && (
                    <span className="font-extrabold text-primary-600 dark:text-primary-400 text-xs tracking-tighter" title="Fin de repetición">
                      :| {measure.repeatCount ? `x${measure.repeatCount}` : ''}
                    </span>
                  )}

                  {/* Botón rápido de eliminar en modo edición */}
                  {isEditing && onRemoveMeasure && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveMeasure(measure.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                      title="Eliminar compás"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contenido Armónico del Compás (Chords & Beats) */}
              <div className="flex-1 flex flex-col justify-center my-1">
                {singleChordFullMeasure ? (
                  // Caso 1: Un solo acorde dura todo el compás (Barra completa con slashes elegantes)
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {primaryChord}
                    </span>
                    {/* Slashes de duración rítmica (ej. / / / /) */}
                    <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-600 font-mono text-[11px] font-bold mt-0.5">
                      {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                        <span key={i}>/</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Caso 2: Compás dividido en pulsos (ej. 2 acordes o más)
                  <div className="grid grid-cols-4 gap-1 w-full text-center items-end py-0.5">
                    {beatsArray.map((beatNum) => {
                      const beatData = measure.beats.find((b) => b.beat === beatNum)
                      const isBeatEditing = editingBeat?.measureId === measure.id && editingBeat?.beatNumber === beatNum

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
                            isEditing ? 'hover:bg-primary-100/60 dark:hover:bg-primary-950/50 cursor-pointer' : '',
                            beatData?.chord ? 'font-bold' : 'text-slate-300 dark:text-slate-700'
                          )}
                        >
                          {/* Acorde en el pulso */}
                          <div className="h-7 flex items-center justify-center">
                            {beatData?.chord ? (
                              <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-none">
                                {beatData.chord}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-300 dark:text-slate-700">
                                /
                              </span>
                            )}
                          </div>

                          {/* Marca de tiempo/pulso discreto */}
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
                            {beatNum}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Letra guía sincronizada debajo del compás */}
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

      {/* Editor flotante / Popover al hacer clic en un compás en Modo Edición */}
      {isEditing && selectedMeasure && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-primary-600 text-white">
                Compás #{selectedMeasure.measureNumber}
              </span>
              <span className="text-xs text-slate-500">Configuración de pulsos y acordes</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón repetición inicio |: */}
              <button
                type="button"
                onClick={() => handleToggleRepeat(selectedMeasure.id, 'start')}
                className={cn(
                  'px-2 py-1 rounded text-xs font-mono font-bold border transition-colors',
                  selectedMeasure.repeatStart
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                |: Inicio Rep.
              </button>

              {/* Botón repetición fin :| */}
              <button
                type="button"
                onClick={() => handleToggleRepeat(selectedMeasure.id, 'end')}
                className={cn(
                  'px-2 py-1 rounded text-xs font-mono font-bold border transition-colors',
                  selectedMeasure.repeatEnd
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                :| Fin Rep.
              </button>

              {/* Casillas Volta 1 y 2 */}
              <button
                type="button"
                onClick={() => handleToggleVolta(selectedMeasure.id, 1)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-bold border transition-colors',
                  selectedMeasure.volta === 1
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                1ª Casilla
              </button>
              <button
                type="button"
                onClick={() => handleToggleVolta(selectedMeasure.id, 2)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-bold border transition-colors',
                  selectedMeasure.volta === 2
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                2ª Casilla
              </button>
            </div>
          </div>

          {/* Asignación de Acordes por Pulso */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
            {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
              const bNum = idx + 1
              const currentBeat = selectedMeasure.beats.find((b) => b.beat === bNum)

              return (
                <div key={bNum} className="flex flex-col gap-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
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
                    placeholder={`Acorde Beat ${bNum}`}
                    onBlur={(e) => handleSaveBeatChord(selectedMeasure.id, bNum, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveBeatChord(selectedMeasure.id, bNum, (e.target as HTMLInputElement).value)
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm font-mono font-bold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-primary-500 uppercase"
                  />
                </div>
              )
            })}
          </div>

          {/* Paleta rápida de Acordes Diatónicos en el Tono actual */}
          {diatonicChords.length > 0 && (
            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">
                Acordes en {currentKey}:
              </span>
              {diatonicChords.map((chord) => (
                <button
                  key={chord}
                  type="button"
                  onClick={() => {
                    // Si no tiene acorde en Beat 1, ponerlo en Beat 1; si ya tiene, ponerlo en el siguiente libre o en Beat 1
                    handleSaveBeatChord(selectedMeasure.id, 1, chord)
                  }}
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/60 hover:text-primary-600 transition-colors"
                >
                  {chord}
                </button>
              ))}
            </div>
          )}

          {/* Letra Guía del Compás */}
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Letra de guía para este compás:
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
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Botones rápidos para añadir compases si estamos en Modo Edición */}
      {isEditing && onAddMeasures && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-slate-400 font-medium">Añadir compases:</span>
          <button
            type="button"
            onClick={() => onAddMeasures(4)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> +4 Compases
          </button>
          <button
            type="button"
            onClick={() => onAddMeasures(8)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> +8 Compases
          </button>
          <button
            type="button"
            onClick={() => onAddMeasures(1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> +1 Compás
          </button>
        </div>
      )}
    </div>
  )
}
