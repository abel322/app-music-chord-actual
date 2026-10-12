'use client'

import React from 'react'
import { Measure, MeasureSlot, MeasureDivision } from '@/types/measure'
import { detectCadence } from '@/lib/harmonic-theory'
import { 
  inferMeasureDivision, 
  ensureMeasureSlots, 
  getDivisionBracket,
  getMetricPulseGroups
} from '@/lib/rhythm-utils'
import { getBeatsPerMeasure } from '@/lib/measure-utils'
import { Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MeasureCellProps {
  measure: Measure
  timeSignature?: string
  beatsPerMeasure?: number
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
  timeSignature,
  beatsPerMeasure = 4,
  currentKey = 'C',
  isSelected = false,
  isEditing = false,
  prevMeasure,
  onClick,
  onDuplicate,
  onRemove,
}: MeasureCellProps) {
  const effectiveTimeSig = measure.timeSignature || timeSignature || (beatsPerMeasure ? `${beatsPerMeasure}/4` : '4/4')
  const actualBeats = getBeatsPerMeasure(effectiveTimeSig)
  const pulseGroups = getMetricPulseGroups(effectiveTimeSig)
  const division = inferMeasureDivision(measure)
  const slots = ensureMeasureSlots(measure, effectiveTimeSig)
  const divisionBracket = getDivisionBracket(division)

  // Acorde principal (para detección de cadencia y vista completa)
  const primaryChord = slots.find((s) => s.chord && s.chord !== '%')?.chord || 
    measure.beats.find((b) => b.chord)?.chord || ''

  // Cadencia armónica (manual o automática)
  const prevChord = prevMeasure?.beats[prevMeasure.beats.length - 1]?.chord || 
    prevMeasure?.slots?.find((s) => s.chord)?.chord || ''
  const detectedCadence = detectCadence(primaryChord, prevChord, currentKey)
  const cadenceToDisplay =
    measure.cadenceLabel || (detectedCadence ? `${detectedCadence.name} (${detectedCadence.degrees})` : null)
  const cadenceColor =
    measure.cadenceColor ||
    detectedCadence?.colorBadge ||
    'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800'

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border transition-all duration-200 select-none min-h-[105px] sm:min-h-[120px] p-2.5 sm:p-3 overflow-hidden',
        isSelected && isEditing
          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/40 shadow-md'
          : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm',
        measure.repeatStart && 'border-l-[5px] border-l-primary-600 dark:border-l-primary-500',
        measure.repeatEnd && 'border-r-[5px] border-r-primary-600 dark:border-r-primary-500',
        isEditing && 'cursor-pointer hover:shadow-md'
      )}
    >
      {/* 1. Cabecera del Compás: Número, Barra de Repetición, Badge de Cadencia, Bracket y Casillas */}
      <div className="flex items-center justify-between text-[11px] leading-none mb-1 gap-1 shrink-0">
        <div className="flex items-center gap-1.5 font-mono shrink-0">
          <span className="text-slate-400 dark:text-slate-500 font-bold">
            {measure.measureNumber}
          </span>

          {measure.repeatStart && (
            <span
              className="font-extrabold text-primary-600 dark:text-primary-400 text-xs tracking-tighter"
              title="Inicio de repetición |:"
            >
              |:
            </span>
          )}

          {/* Indicador de figura irregular o amalgama */}
          {divisionBracket && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              {divisionBracket}
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
              title="Fin de repetición :|"
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

      {/* 2. Cuerpo Armónico y Rítmico (Sin truncamiento con puntos suspensivos) */}
      <div className="flex-1 flex flex-col justify-center my-1 min-w-0">
        {division === 'whole' ? (
          /* Caso Redonda / Métrica Completa: Acorde Centrado y Marcas de Pulso Agrupadas */
          <div className="flex flex-col items-center justify-center min-w-0">
            {primaryChord ? (
              <>
                <div className="flex items-center justify-center gap-1 max-w-full">
                  <span
                    className={cn(
                      'font-mono font-black tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap min-w-0 shrink-0',
                      primaryChord.length > 9
                        ? 'text-base sm:text-lg'
                        : primaryChord.length > 6
                        ? 'text-lg sm:text-xl'
                        : 'text-xl sm:text-2xl'
                    )}
                    title={primaryChord}
                  >
                    {primaryChord}
                  </span>
                  {slots[0]?.accent && (
                    <span className="text-xs font-black text-amber-500 leading-none shrink-0">&gt;</span>
                  )}
                </div>
                {/* Marcas de pulso agrupadas debajo del acorde (ej. / / /   / / /) */}
                <div className="flex items-center justify-center gap-3 text-slate-300 dark:text-slate-600 font-mono text-[11px] font-bold mt-1">
                  {pulseGroups.map((group, gIdx) => (
                    <div key={gIdx} className="flex items-center gap-1">
                      {Array.from({ length: group.slashesCount }).map((_, sIdx) => (
                        <span key={sIdx}>/</span>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Compás vacío: marcas de pulso agrupadas centradas y visibles */
              <div className="flex items-center justify-center gap-3 text-slate-300 dark:text-slate-600 font-mono text-sm sm:text-base font-black py-1">
                {pulseGroups.map((group, gIdx) => (
                  <div key={gIdx} className="flex items-center gap-1">
                    {Array.from({ length: group.slashesCount }).map((_, sIdx) => (
                      <span key={sIdx}>/</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : division === 'half' ? (
          /* Caso Blancas: 2 Mitades con División Central */
          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 text-center items-center py-1">
            <div className="flex flex-col items-center justify-center px-1 min-w-0">
              <div className="flex items-center justify-center gap-0.5 max-w-full">
                <span
                  className={cn(
                    'font-mono text-slate-900 dark:text-white leading-none whitespace-nowrap min-w-0 shrink-0',
                    (slots[0]?.chord?.length || 0) > 7
                      ? 'text-xs sm:text-sm font-bold'
                      : (slots[0]?.chord?.length || 0) > 4
                      ? 'text-sm sm:text-base font-bold'
                      : 'text-base sm:text-lg font-black'
                  )}
                  title={slots[0]?.chord || '/'}
                >
                  {slots[0]?.chord || '/'}
                </span>
                {slots[0]?.accent && (
                  <span className="text-[10px] font-black text-amber-500 leading-none shrink-0">&gt;</span>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                {slots[0]?.label || 'T. 1-2'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-1 min-w-0">
              <div className="flex items-center justify-center gap-0.5 max-w-full">
                <span
                  className={cn(
                    'font-mono text-slate-900 dark:text-white leading-none whitespace-nowrap min-w-0 shrink-0',
                    (slots[1]?.chord?.length || 0) > 7
                      ? 'text-xs sm:text-sm font-bold'
                      : (slots[1]?.chord?.length || 0) > 4
                      ? 'text-sm sm:text-base font-bold'
                      : 'text-base sm:text-lg font-black'
                  )}
                  title={slots[1]?.chord || '/'}
                >
                  {slots[1]?.chord || '/'}
                </span>
                {slots[1]?.accent && (
                  <span className="text-[10px] font-black text-amber-500 leading-none shrink-0">&gt;</span>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                {slots[1]?.label || 'T. 3-4'}
              </span>
            </div>
          </div>
        ) : division === 'quarter' ? (
          /* Caso Negras / 4 Subdivisiones: dinámico según slots.length */
          <div
            className={cn(
              'grid gap-0.5 sm:gap-1 w-full text-center items-end py-0.5',
              slots.length === 2 && 'grid-cols-2',
              slots.length === 3 && 'grid-cols-3',
              slots.length === 4 && 'grid-cols-4',
              slots.length > 4 && 'grid-cols-4 sm:grid-cols-6'
            )}
          >
            {slots.map((s) => {
              const chordLen = s.chord?.length || 0
              return (
                <div key={s.index} className="flex flex-col items-center justify-between px-0.5 py-0.5 min-w-0">
                  <div className="flex items-center justify-center gap-0.5 max-w-full">
                    <span
                      className={cn(
                        'font-mono text-slate-900 dark:text-white leading-none whitespace-nowrap min-w-0 shrink-0',
                        chordLen > 6
                          ? 'text-[9px] sm:text-[10px] font-bold tracking-tighter'
                          : chordLen > 4
                          ? 'text-[10px] sm:text-xs font-bold tracking-tight'
                          : 'text-xs sm:text-sm font-black'
                      )}
                      title={s.chord || '/'}
                    >
                      {s.chord || '/'}
                    </span>
                    {s.accent && (
                      <span className="text-[8px] sm:text-[9px] font-black text-amber-500 leading-none shrink-0">&gt;</span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : division === 'eighth' ? (
          /* Caso Corcheas: Tira Horizontal dinámico según slots.length */
          <div className="space-y-0.5">
            <div
              className={cn(
                'grid gap-0.5 w-full text-center items-center py-1 bg-slate-50 dark:bg-slate-950/60 rounded-lg p-1 border border-slate-100 dark:border-slate-800/80',
                slots.length === 4 && 'grid-cols-4',
                slots.length === 6 && 'grid-cols-6',
                slots.length === 8 && 'grid-cols-8',
                slots.length === 12 && 'grid-cols-6 sm:grid-cols-12',
                slots.length > 12 && 'grid-cols-8 sm:grid-cols-16'
              )}
            >
              {slots.map((s) => {
                const isOffbeat = s.label === '&'
                const hasChord = !!s.chord
                const chordLen = s.chord?.length || 0

                return (
                  <div
                    key={s.index}
                    className={cn(
                      'flex flex-col items-center justify-center p-0.5 rounded transition-colors min-w-0',
                      hasChord && 'bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800'
                    )}
                  >
                    <div className="flex items-center justify-center gap-0.2">
                      <span
                        className={cn(
                          'font-mono leading-none whitespace-nowrap min-w-0 shrink-0 font-bold',
                          chordLen > 5
                            ? 'text-[8px] sm:text-[9px] tracking-tighter'
                            : chordLen > 3
                            ? 'text-[9px] sm:text-[10px] tracking-tight'
                            : 'text-[10px] sm:text-xs',
                          hasChord
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-slate-300 dark:text-slate-700'
                        )}
                      >
                        {s.chord || (isOffbeat ? '·' : '/')}
                      </span>
                      {s.accent && (
                        <span className="text-[7px] sm:text-[8px] font-black text-amber-500 leading-none">&gt;</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[8px] font-mono mt-0.5',
                        isOffbeat
                          ? 'text-primary-500 font-extrabold'
                          : 'text-slate-400 font-semibold'
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : division === 'sixteenth' ? (
          /* Caso Semicorcheas: Pulsos agrupados dinámico */
          <div
            className={cn(
              'grid gap-1 w-full text-center items-center py-0.5',
              Math.ceil(slots.length / 4) === 2 && 'grid-cols-2',
              Math.ceil(slots.length / 4) === 3 && 'grid-cols-3',
              Math.ceil(slots.length / 4) >= 4 && 'grid-cols-4'
            )}
          >
            {Array.from({ length: Math.max(1, Math.ceil(slots.length / 4)) }).map((_, bIdx) => {
              const beatSlots = slots.slice(bIdx * 4, (bIdx + 1) * 4)
              const hasChordInBeat = beatSlots.some((s) => !!s.chord)
              return (
                <div
                  key={bIdx}
                  className={cn(
                    'flex flex-col items-center justify-between p-1 rounded-lg border transition-colors min-w-0',
                    hasChordInBeat
                      ? 'border-primary-300 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/40'
                      : 'border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30'
                  )}
                >
                  <div className="grid grid-cols-4 gap-0.5 w-full">
                    {beatSlots.map((s) => {
                      const isRest = s.isRest || s.chord === '%'
                      return (
                        <div key={s.index} className="flex flex-col items-center justify-center min-w-0">
                          <span
                            className={cn(
                              'font-mono leading-none whitespace-nowrap min-w-0 shrink-0 font-bold text-[8px] sm:text-[9px] tracking-tighter',
                              s.chord
                                ? isRest
                                  ? 'text-rose-500'
                                  : 'text-primary-700 dark:text-primary-300'
                                : 'text-slate-300 dark:text-slate-700'
                            )}
                            title={`${s.label}: ${s.chord || 'sin acorde'}`}
                          >
                            {s.chord || '·'}
                          </span>
                          {s.accent && (
                            <span className="text-[7px] font-black text-amber-500 leading-none">&gt;</span>
                          )}
                          <span
                            className={cn(
                              'text-[7px] font-mono mt-0.5',
                              s.chord ? 'text-primary-600 font-bold' : 'text-slate-400'
                            )}
                          >
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Casos Irregulares, Amalgamas y Fusas */
          <div className="space-y-0.5">
            <div
              className={cn(
                'grid gap-0.5 w-full text-center items-center py-1 bg-slate-50 dark:bg-slate-950/60 rounded-lg p-1 border border-slate-100 dark:border-slate-800/80',
                slots.length <= 3 && 'grid-cols-3',
                slots.length === 5 && 'grid-cols-5',
                slots.length === 6 && 'grid-cols-6',
                slots.length === 7 && 'grid-cols-7',
                slots.length === 9 && 'grid-cols-9',
                slots.length === 12 && 'grid-cols-6 sm:grid-cols-12',
                slots.length >= 16 && 'grid-cols-8 sm:grid-cols-16'
              )}
            >
              {slots.map((s) => {
                const hasChord = !!s.chord
                const isRest = s.isRest || s.chord === '%'
                const chordLen = s.chord?.length || 0

                return (
                  <div
                    key={s.index}
                    className={cn(
                      'flex flex-col items-center justify-center p-0.5 rounded transition-colors min-w-0',
                      hasChord && 'bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800'
                    )}
                  >
                    <div className="flex items-center justify-center gap-0.2">
                      <span
                        className={cn(
                          'font-mono leading-none whitespace-nowrap min-w-0 shrink-0 font-bold',
                          chordLen > 5
                            ? 'text-[8px] sm:text-[9px] tracking-tighter'
                            : chordLen > 3
                            ? 'text-[9px] sm:text-[10px] tracking-tight'
                            : 'text-[10px] sm:text-xs',
                          hasChord
                            ? isRest
                              ? 'text-rose-500 font-bold'
                              : 'text-primary-700 dark:text-primary-300'
                            : 'text-slate-300 dark:text-slate-700'
                        )}
                      >
                        {s.chord || '/'}
                      </span>
                      {s.accent && (
                        <span className="text-[7px] sm:text-[8px] font-black text-amber-500 leading-none">&gt;</span>
                      )}
                    </div>
                    <span className="text-[7px] sm:text-[8px] font-mono text-slate-400 mt-0.5">
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Letra Guía Rítmica Inferior */}
      {measure.guideLyric && (
        <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate font-serif">
            &quot;{measure.guideLyric}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
