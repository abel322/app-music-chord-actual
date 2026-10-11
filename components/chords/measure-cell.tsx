'use client'

import React from 'react'
import { Measure, ChordBeat, SubBeatSlot, BeatAccent } from '@/types/measure'
import { detectCadence } from '@/lib/harmonic-theory'
import { getSubdivisionBracketLabel, getAccentSymbol } from '@/lib/rhythm-utils'
import { Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MeasureCellProps {
  measure: Measure
  beatsPerMeasure: number
  currentKey?: string
  isSelected?: boolean
  isEditing?: boolean
  prevMeasure?: Measure | null
  onClick?: () => void
  onDuplicate?: (measureId: string) => void
  onRemove?: (measureId: string) => void
}

export function MeasureCell({
  measure,
  beatsPerMeasure = 4,
  currentKey = 'C',
  isSelected = false,
  isEditing = false,
  prevMeasure,
  onClick,
  onDuplicate,
  onRemove,
}: MeasureCellProps) {
  const hasChords = measure.beats.length > 0
  const primaryChord = measure.beats.find((b) => b.beat === 1)?.chord || (measure.beats[0]?.chord ?? '')

  // Un solo acorde ocupa todo el compás si no hay subdivisiones complejas
  const isSingleChordFullMeasure =
    measure.beats.length === 1 &&
    measure.beats[0].beat === 1 &&
    (!measure.beats[0].subSlots || measure.beats[0].subSlots.length <= 1) &&
    (!measure.beats[0].subdivision || measure.beats[0].subdivision === '1/4' || measure.beats[0].subdivision === '1/1')

  // Detección automática o etiqueta manual de cadencia
  const prevChord = prevMeasure?.beats[prevMeasure.beats.length - 1]?.chord || prevMeasure?.beats[0]?.chord || ''
  const detectedCadence = detectCadence(primaryChord, prevChord, currentKey)
  const cadenceToDisplay =
    measure.cadenceLabel || (detectedCadence ? `${detectedCadence.name} (${detectedCadence.degrees})` : null)
  const cadenceColor =
    measure.cadenceColor ||
    detectedCadence?.colorBadge ||
    'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800'

  // Bracket global de compás si es amalgama
  const measureBracket = measure.subdivisionGrouping || getSubdivisionBracketLabel(measure.subdivision)

  const beatsArray = Array.from({ length: beatsPerMeasure }, (_, i) => i + 1)

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border transition-all duration-200 select-none min-h-[105px] sm:min-h-[118px] p-2.5 sm:p-3',
        isSelected && isEditing
          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/40 shadow-md'
          : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm',
        measure.repeatStart && 'border-l-[5px] border-l-primary-600 dark:border-l-primary-500',
        measure.repeatEnd && 'border-r-[5px] border-r-primary-600 dark:border-r-primary-500',
        isEditing && 'cursor-pointer hover:shadow-md'
      )}
    >
      {/* Cabecera del Compás: Número, Barra de Repetición, Badge de Cadencia y Casillas */}
      <div className="flex items-center justify-between text-[11px] leading-none mb-1 gap-1">
        <div className="flex items-center gap-1.5 font-mono shrink-0">
          <span className="text-slate-400 dark:text-slate-500 font-bold">
            {measure.measureNumber}
          </span>

          {measure.repeatStart && (
            <span
              className="font-extrabold text-primary-600 dark:text-primary-400 text-xs tracking-tighter"
              title="Inicio de repetición"
            >
              |:
            </span>
          )}

          {measureBracket && (
            <span className="px-1 py-0.2 rounded text-[9px] font-mono font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              {measureBracket}
            </span>
          )}
        </div>

        {/* Badge de Cadencia Armónica */}
        {cadenceToDisplay && (
          <div className="truncate max-w-[130px] sm:max-w-[160px]">
            <span
              className={cn(
                'inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-tight truncate shadow-2xs',
                cadenceColor
              )}
              title={cadenceToDisplay}
            >
              {cadenceToDisplay}
            </span>
          </div>
        )}

        {/* Volta y Cierre de Repetición */}
        <div className="flex items-center gap-1 shrink-0">
          {measure.volta && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              {measure.volta}ª
            </span>
          )}

          {measure.repeatEnd && (
            <span
              className="font-extrabold text-primary-600 dark:text-primary-400 text-xs tracking-tighter"
              title="Fin de repetición"
            >
              :| {measure.repeatCount ? `x${measure.repeatCount}` : ''}
            </span>
          )}

          {/* Acciones Rápidas en Hover (Modo Edición) */}
          {isEditing && (
            <div className="hidden group-hover:flex items-center gap-0.5">
              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate(measure.id)
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-primary-600 transition-colors"
                  title="Duplicar compás"
                >
                  <Copy className="w-3 h-3" />
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(measure.id)
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

      {/* Contenido Armónico y Rítmico del Compás */}
      <div className="flex-1 flex flex-col justify-center my-1">
        {isSingleChordFullMeasure ? (
          /* Caso 1: Un solo acorde dura todo el compás con slashes */
          <div className="flex flex-col items-center justify-center">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              {primaryChord}
            </span>
            <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-600 font-mono text-[11px] font-bold mt-1">
              {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                <span key={i}>/</span>
              ))}
            </div>
          </div>
        ) : (
          /* Caso 2: Pulsos divididos o con subdivisiones rítmicas / slots */
          <div className="grid grid-cols-4 gap-1 w-full text-center items-end py-0.5">
            {beatsArray.map((beatNum) => {
              const beatData = measure.beats.find((b) => b.beat === beatNum)
              const hasSubSlots = beatData?.subSlots && beatData.subSlots.length > 1
              const beatBracket = getSubdivisionBracketLabel(beatData?.subdivision)
              const accentMark = getAccentSymbol(beatData?.accent)

              return (
                <div
                  key={beatNum}
                  className={cn(
                    'flex flex-col items-center justify-between p-1 rounded-md transition-colors min-h-[48px]',
                    isEditing ? 'hover:bg-primary-100/70 dark:hover:bg-primary-950/60' : '',
                    beatData?.chord ? 'font-bold' : 'text-slate-300 dark:text-slate-700'
                  )}
                >
                  {/* Si el pulso tiene bracket de figura irregular (ej. tresillo [3]) */}
                  {beatBracket && (
                    <span className="text-[9px] font-mono font-extrabold text-blue-600 dark:text-blue-400 leading-none mb-0.5">
                      {beatBracket}
                    </span>
                  )}

                  {/* Renderizado de acordes del pulso o micro-slots */}
                  {hasSubSlots ? (
                    /* Pulsos subdivididos con slots (ej. 1 & o tresillos) */
                    <div className="flex items-center justify-center gap-0.5 w-full">
                      {beatData!.subSlots!.map((slot, sIdx) => {
                        const slotAccent = getAccentSymbol(slot.accent)
                        return (
                          <div
                            key={slot.id || sIdx}
                            className="flex-1 flex flex-col items-center justify-center min-w-0"
                          >
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white truncate">
                              {slot.chord || (sIdx === 0 ? beatData?.chord || '/' : '/')}
                            </span>
                            {slotAccent && (
                              <span className="text-[8px] font-black text-amber-500 leading-none">
                                {slotAccent}
                              </span>
                            )}
                            <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500">
                              {slot.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* Pulso estándar simple */
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-0.5">
                        {beatData?.chord ? (
                          <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none">
                            {beatData.chord}
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-300 dark:text-slate-700 font-semibold">
                            /
                          </span>
                        )}
                        {accentMark && (
                          <span className="text-[9px] font-black text-amber-500 leading-none">
                            {accentMark}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                        {beatNum}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Letra guía rítmica inferior */}
      {measure.guideLyric && (
        <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate font-serif">
            &quot;{measure.guideLyric}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
