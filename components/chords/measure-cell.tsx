'use client'

import React from 'react'
import { Measure, MeasureSlot, MeasureDivision } from '@/types/measure'
import {
  inferMeasureDivision,
  ensureMeasureSlots,
  getDivisionBracket,
  getMetricPulseGroups
} from '@/lib/rhythm-utils'
import { getBeatsPerMeasure, getCadenceDisplayLabels } from '@/lib/measure-utils'
import { Copy, Trash2, X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CadenceWrapType = 'none' | 'both' | 'mobile-only'

export interface CadenceBracketInfo {
  role?: 'single' | 'start' | 'end'
  type?: 'single' | 'start' | 'end'
  label?: string
  shortLabel?: string
  startPercent?: number
  endPercent?: number
  wrapType?: CadenceWrapType
  pairedMeasureId?: string
  isLastInRowDesktop?: boolean
  isLastInRowMobile?: boolean
}

export interface MeasureCellProps {
  measure: Measure
  timeSignature?: string
  beatsPerMeasure?: number
  currentKey?: string
  isSelected?: boolean
  isEditing?: boolean
  isActive?: boolean
  isPlaying?: boolean
  measureDurationMs?: number
  prevMeasure?: Measure | null
  cadenceBracket?: CadenceBracketInfo | null
  onClick?: () => void
  onDuplicate?: (measureId: string) => void
  onRemove?: (measureId: string) => void
  onRemoveCadence?: (measureId: string) => void
  dragHandleProps?: Record<string, any>
  isDragging?: boolean
  sectionRepeatStart?: boolean
  sectionRepeatEnd?: number
  isSelectedForBatch?: boolean
  onToggleSelect?: (measureId: string, event?: React.MouseEvent) => void
}

export function MeasureCell({
  measure,
  timeSignature,
  beatsPerMeasure = 4,
  currentKey = 'C',
  isSelected = false,
  isSelectedForBatch = false,
  isEditing = false,
  isActive = false,
  isPlaying = false,
  measureDurationMs = 3333,
  prevMeasure,
  cadenceBracket,
  onClick,
  onToggleSelect,
  onDuplicate,
  onRemove,
  onRemoveCadence,
  dragHandleProps,
  isDragging = false,
  sectionRepeatStart = false,
  sectionRepeatEnd,
}: MeasureCellProps) {
  const effectiveTimeSig = measure.timeSignature || timeSignature || (beatsPerMeasure ? `${beatsPerMeasure}/4` : '4/4')
  const actualBeats = getBeatsPerMeasure(effectiveTimeSig)
  const pulseGroups = getMetricPulseGroups(effectiveTimeSig)
  const division = inferMeasureDivision(measure)
  const slots = ensureMeasureSlots(measure, effectiveTimeSig)
  const divisionBracket = getDivisionBracket(division)

  const halfCount = Math.max(1, Math.ceil(actualBeats / 2))
  const firstHalfBeats = Array.from({ length: halfCount }, (_, i) => i + 1)
  const secondHalfBeats = Array.from({ length: Math.max(1, actualBeats - halfCount) }, (_, i) => halfCount + i + 1)

  // Acorde principal del compás para la vista completa (división 'whole')
  const primaryChord =
    slots.find((s) => s.chord && s.chord !== '%')?.chord ||
    slots[0]?.chord ||
    measure.beats?.find((b) => b.chord)?.chord ||
    ''

  // Corchete de Cadencia Armónica: SÓLO si fue configurada manualmente
  const effectiveBracket: CadenceBracketInfo | null =
    cadenceBracket ||
    (measure.cadence || measure.cadenceLabel
      ? {
        role: (measure.cadenceRole as 'single' | 'start' | 'end') || 'single',
        label: measure.cadenceRole === 'start' ? undefined : (measure.cadenceLabel || measure.cadence),
        startPercent: 50,
        endPercent: 25,
        wrapType: 'none',
      }
      : null)

  const bracketRole = effectiveBracket?.role || effectiveBracket?.type || 'single'
  const startPercent = effectiveBracket?.startPercent ?? 50
  const endPercent = effectiveBracket?.endPercent ?? 25
  const wrapType = effectiveBracket?.wrapType ?? 'none'
  const isLastInRowDesktop = effectiveBracket?.isLastInRowDesktop ?? false
  const isLastInRowMobile = effectiveBracket?.isLastInRowMobile ?? false

  const rawLabel = effectiveBracket?.label || (measure.cadenceRole === 'start' ? undefined : (measure.cadenceLabel || measure.cadence))
  const { full: parsedFull, short: parsedShort } = getCadenceDisplayLabels(measure.cadence, rawLabel)
  const fullLabel = effectiveBracket?.label || parsedFull
  const shortLabel = effectiveBracket?.shortLabel || parsedShort

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && onToggleSelect) {
      e.stopPropagation()
      onToggleSelect(measure.id, e)
      return
    }
    onClick?.()
  }

  return (
    <div
      id={`measure-${measure.id}`}
      data-measure-id={measure.id}
      data-measure-number={measure.measureNumber}
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border select-none min-h-[72px] sm:min-h-[96px] py-2 px-2.5 sm:py-4 sm:px-4 overflow-visible scroll-mt-32 transition-all duration-300',
        isActive
          ? 'ring-4 ring-purple-500 border-purple-500 shadow-xl shadow-purple-500/20 scale-[1.03] z-10 bg-purple-50 dark:bg-purple-950/40'
          : isSelectedForBatch
            ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/50 ring-2 ring-purple-500/60 shadow-md'
            : isSelected && isEditing
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/40 shadow-md'
              : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm',
        (measure.repeatStart || sectionRepeatStart) && 'border-l-[5px] border-l-purple-600 dark:border-l-purple-500',
        (measure.repeatEnd || !!sectionRepeatEnd) && 'border-r-[5px] border-r-purple-600 dark:border-r-purple-500',
        (isEditing || isPlaying) && 'cursor-pointer hover:shadow-md',
        isDragging && 'opacity-40 border-dashed border-purple-400 dark:border-purple-500'
      )}
    >
      {/* 0. Corchete Flotante Superior de Cadencia Armónica (Renderizado Geométrico Preciso y Delimitado) */}
      {effectiveBracket && (
        <>
          {/* Caso 1: Compás individual (Semicadencia o cadencia en un solo compás) */}
          {bracketRole === 'single' && (
            <div
              className={cn(
                'absolute -top-6 sm:-top-6.5 pointer-events-none z-20 h-2.5 sm:h-3 border-t-2 border-l-2 border-r-2 border-purple-500/80 dark:border-purple-400/80 rounded-t-sm',
                isLastInRowDesktop && 'right-0 max-w-full'
              )}
              style={{
                left: `${startPercent}%`,
                right: isLastInRowDesktop ? 0 : `${100 - endPercent}%`,
              }}
            >
              {shortLabel && (
                <div
                  className={cn(
                    'absolute bottom-full mb-1 z-30 pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap w-max px-2 py-0.5 rounded text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 shadow-sm border border-purple-200 dark:border-purple-800 select-none',
                    isLastInRowDesktop || isLastInRowMobile
                      ? 'right-2 left-auto translate-x-0'
                      : 'left-1/2 -translate-x-1/2'
                  )}
                  title={fullLabel}
                >
                  <span>{shortLabel}</span>
                  {onRemoveCadence && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveCadence(measure.id)
                      }}
                      className="p-0.5 rounded-full text-purple-400 hover:text-red-500 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors flex items-center justify-center shrink-0"
                      title="Quitar cadencia"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Caso 2: Compás de origen (Tensión: inicia en startPercent y se proyecta a la derecha) */}
          {bracketRole === 'start' && (
            <>
              {/* 2A: Misma fila en mobile y desktop (wrapType === 'none') -> Compás intermedio (ej. Compás 1 a 2) */}
              {wrapType === 'none' && (
                <div
                  className="absolute -top-6 sm:-top-6.5 -right-[5px] sm:-right-[7px] pointer-events-none z-20 h-2.5 sm:h-3 border-t-2 border-l-2 border-purple-500/80 dark:border-purple-400/80 rounded-tl-sm"
                  style={{ left: `${startPercent}%` }}
                >
                  {shortLabel && (
                    <div
                      className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap w-max px-2 py-0.5 rounded text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 shadow-sm border border-purple-200 dark:border-purple-800 select-none"
                      title={fullLabel}
                    >
                      <span>{shortLabel}</span>
                      {onRemoveCadence && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveCadence(measure.id)
                          }}
                          className="p-0.5 rounded-full text-purple-400 hover:text-red-500 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors flex items-center justify-center shrink-0"
                          title="Quitar cadencia"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2B: Salto de renglón en ambos (wrapType === 'both') -> Último compás de fila (ej. Compás 4) */}
              {wrapType === 'both' && (
                <div
                  className="absolute -top-6 sm:-top-6.5 right-0 pointer-events-none z-20 h-2.5 sm:h-3 border-t-2 border-l-2 border-purple-500/80 dark:border-purple-400/80 rounded-tl-sm max-w-full"
                  style={{ left: `${startPercent}%` }}
                >
                  <span className="absolute -top-2 right-0.5 text-[10px] sm:text-[11px] font-bold text-purple-500/80 select-none leading-none">
                    →
                  </span>
                  {shortLabel && (
                    <div
                      className="absolute bottom-full mb-1 right-2 left-auto translate-x-0 z-30 pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap w-max px-2 py-0.5 rounded text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 shadow-sm border border-purple-200 dark:border-purple-800 select-none"
                      title={fullLabel}
                    >
                      <span>{shortLabel}</span>
                      {onRemoveCadence && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveCadence(measure.id)
                          }}
                          className="p-0.5 rounded-full text-purple-400 hover:text-red-500 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors flex items-center justify-center shrink-0"
                          title="Quitar cadencia"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2C: Salto en móvil, misma fila en desktop (wrapType === 'mobile-only' -> ej. Compás 2) */}
              {wrapType === 'mobile-only' && (
                <div
                  className="absolute -top-6 sm:-top-6.5 right-0 md:-right-[7px] pointer-events-none z-20 h-2.5 sm:h-3 border-t-2 border-l-2 border-purple-500/80 dark:border-purple-400/80 rounded-tl-sm"
                  style={{ left: `${startPercent}%` }}
                >
                  <span className="block md:hidden absolute -top-2 right-0.5 text-[10px] sm:text-[11px] font-bold text-purple-500/80 select-none leading-none">
                    →
                  </span>
                  {shortLabel && (
                    <div
                      className="absolute bottom-full mb-1 right-2 md:right-auto md:left-1/2 translate-x-0 md:-translate-x-1/2 z-30 pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap w-max px-2 py-0.5 rounded text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 shadow-sm border border-purple-200 dark:border-purple-800 select-none"
                      title={fullLabel}
                    >
                      <span>{shortLabel}</span>
                      {onRemoveCadence && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveCadence(measure.id)
                          }}
                          className="p-0.5 rounded-full text-purple-400 hover:text-red-500 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors flex items-center justify-center shrink-0"
                          title="Quitar cadencia"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Caso 3: Compás de resolución (Llega desde la izquierda y desciende sobre el pulso 1) */}
          {bracketRole === 'end' && (
            <>
              {/* 3A: Misma fila (wrapType === 'none') */}
              {wrapType === 'none' && (
                <div
                  className="absolute -top-6 sm:-top-6.5 -left-[5px] sm:-left-[7px] pointer-events-none z-20 h-2.5 sm:h-3 border-t-2 border-r-2 border-purple-500/80 dark:border-purple-400/80 rounded-tr-sm"
                  style={{ right: `${100 - endPercent}%` }}
                />
              )}

              {/* 3B: Salto de renglón en ambos (wrapType === 'both') */}
              {wrapType === 'both' && (
                <div
                  className="absolute -top-6 sm:-top-6.5 left-0 pointer-events-none z-20 h-2.5 sm:h-3 border-t-2 border-r-2 border-purple-500/80 dark:border-purple-400/80 rounded-tr-sm"
                  style={{ right: `${100 - endPercent}%` }}
                >
                  <span className="absolute -top-2 -left-1 text-[11px] font-bold text-purple-500/80 select-none leading-none">
                    ←
                  </span>
                </div>
              )}

              {/* 3C: Salto en móvil, misma fila en desktop (wrapType === 'mobile-only') */}
              {wrapType === 'mobile-only' && (
                <div
                  className="absolute -top-6 sm:-top-6.5 left-0 md:-left-[7px] pointer-events-none z-20 h-2.5 sm:h-3 border-t-2 border-r-2 border-purple-500/80 dark:border-purple-400/80 rounded-tr-sm"
                  style={{ right: `${100 - endPercent}%` }}
                >
                  <span className="block md:hidden absolute -top-2 -left-1 text-[11px] font-bold text-purple-500/80 select-none leading-none">
                    ←
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 1. Cabecera del Compás: Número, Barra de Repetición, Bracket y Casillas */}
      <div className="flex items-center justify-between text-[11px] leading-none mb-1 gap-1 shrink-0">
        <div className="flex items-center gap-1.5 font-mono shrink-0">
          {/* Checkbox de selección rápida multi-compás (Modo Edición) */}
          {isEditing && onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelectedForBatch}
              onChange={(e) => {
                e.stopPropagation()
                onToggleSelect(measure.id, e.nativeEvent as unknown as React.MouseEvent)
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 transition-all opacity-40 group-hover:opacity-100 checked:opacity-100"
              title="Seleccionar compás para duplicar o eliminar en lote (o Shift + Clic)"
            />
          )}

          <span
            className={cn(
              'text-slate-400 dark:text-slate-500 font-bold',
              isSelectedForBatch && 'text-purple-600 dark:text-purple-400 font-black'
            )}
          >
            {measure.measureNumber}
          </span>

          {(measure.repeatStart || sectionRepeatStart) && (
            <span
              className="font-extrabold text-purple-600 dark:text-purple-400 text-xs tracking-tighter"
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

        {/* Volta y Cierre de Repetición */}
        <div className="flex items-center gap-1 shrink-0">
          {measure.volta && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              {measure.volta}ª
            </span>
          )}

          {(measure.repeatEnd || !!sectionRepeatEnd) && (
            <span
              className="font-extrabold text-purple-600 dark:text-purple-400 text-xs tracking-tighter"
              title="Fin de repetición :|"
            >
              :| {measure.repeatCount ? `x${measure.repeatCount}` : sectionRepeatEnd ? `×${sectionRepeatEnd}` : ''}
            </span>
          )}

          {/* Acciones Rápidas (Modo Edición) */}
          {isEditing && (
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Manija de Agarre / Drag Handle para reordenar con touch-none */}
              {dragHandleProps && (
                <button
                  type="button"
                  {...dragHandleProps}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 rounded touch-none transition-colors"
                  title="Arrastrar para reordenar compás"
                  aria-label="Arrastrar para reordenar compás"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              )}

              {onDuplicate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate(measure.id)
                  }}
                  className="p-1 rounded text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hidden sm:block group-hover:block"
                  title="Duplicar compás"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(measure.id)
                  }}
                  className="p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors hidden sm:block group-hover:block"
                  title="Eliminar compás"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
                      'font-mono font-bold tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap min-w-0 shrink-0',
                      primaryChord.length > 9
                        ? 'text-xs sm:text-base'
                        : primaryChord.length > 6
                          ? 'text-sm sm:text-lg'
                          : 'text-base sm:text-lg'
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
          /* Caso Blancas: 2 Mitades con División Central y Notación Rítmica Profesional */
          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 text-center items-center py-0.5">
            {/* Primera mitad (Acorde 1, tiempos 1 y 2) */}
            <div className="flex flex-col items-center justify-center px-1 min-w-0">
              <div className="flex items-center justify-center gap-0.5 max-w-full">
                <span
                  className={cn(
                    'font-mono leading-none whitespace-nowrap min-w-0 shrink-0',
                    slots[0]?.isRest || slots[0]?.chord === '%'
                      ? 'text-rose-500 dark:text-rose-400 font-black'
                      : 'text-slate-900 dark:text-white',
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
              {/* Notación rítmica estándar: barras / con números 1 y 2 alineados debajo */}
              <div className="flex items-center justify-center gap-3 sm:gap-3.5 font-mono leading-none mt-1">
                {firstHalfBeats.map((beatNum) => (
                  <div key={beatNum} className="flex flex-col items-center justify-center">
                    <span className="text-slate-300 dark:text-slate-600 font-black text-xs sm:text-[13px] leading-none">
                      /
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold mt-0.5 leading-none">
                      {beatNum}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Segunda mitad (Acorde 2, tiempos 3 y 4) */}
            <div className="flex flex-col items-center justify-center px-1 min-w-0">
              <div className="flex items-center justify-center gap-0.5 max-w-full">
                <span
                  className={cn(
                    'font-mono leading-none whitespace-nowrap min-w-0 shrink-0',
                    slots[1]?.isRest || slots[1]?.chord === '%'
                      ? 'text-rose-500 dark:text-rose-400 font-black'
                      : 'text-slate-900 dark:text-white',
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
              {/* Notación rítmica estándar: barras / con números 3 y 4 alineados debajo */}
              <div className="flex items-center justify-center gap-3 sm:gap-3.5 font-mono leading-none mt-1">
                {secondHalfBeats.map((beatNum) => (
                  <div key={beatNum} className="flex flex-col items-center justify-center">
                    <span className="text-slate-300 dark:text-slate-600 font-black text-xs sm:text-[13px] leading-none">
                      /
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold mt-0.5 leading-none">
                      {beatNum}
                    </span>
                  </div>
                ))}
              </div>
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

      {/* 4. Barra de Progreso de Pulso/Compás Sutil en Reproducción */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-200/50 dark:bg-purple-900/50 overflow-hidden rounded-b-xl z-20 pointer-events-none">
          <div
            key={`progress-${measure.id}-${isActive}`}
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 origin-left"
            style={{
              animation: `measureProgressBar ${measureDurationMs || 3333}ms linear forwards`,
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          />
        </div>
      )}
    </div>
  )
}
