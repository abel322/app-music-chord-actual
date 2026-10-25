'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Measure, MeasureDivision, MeasureSlot, ChordBeat } from '@/types/measure'
import { HarmonicProgression, CadenceDefinition, PRESET_CADENCES } from '@/lib/harmonic-theory'
import {
  MEASURE_DIVISIONS,
  generateSlotsForDivision,
  syncBeatsFromSlots,
  ensureMeasureSlots,
  inferMeasureDivision,
  getDivisionBracket,
  getDivisionOptionsForTimeSignature,
  formatTimeSignaturePulseMarks,
  MeasureDivisionOption,
} from '@/lib/rhythm-utils'
import { getBeatsPerMeasure, applyCadenceToMeasure } from '@/lib/measure-utils'
import { ProgressionPicker } from './ProgressionPicker'
import { CadencePicker } from './CadencePicker'
import { ChordSelectorModal } from './ChordSelectorModal'
import { DivisionPicker } from './DivisionPicker'
import { normalizeChordInput } from '@/lib/chord-catalog'
import {
  RHYTHM_OPTIONS,
  getRhythmOptionsForTimeSignature,
  RhythmOption,
} from '@/constants/rhythms'
import {
  Copy,
  Trash2,
  X,
  Sparkles,
  Sliders,
  Tag,
  Split,
  Check,
  ChevronDown,
  Layers,
  Music,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MeasureEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedMeasure: Measure
  measures: Measure[]
  sectionName?: string
  currentKey?: string
  timeSignature?: string
  diatonicChords?: string[]
  onUpdateMeasure: (updated: Measure) => void
  onUpdateAllMeasures?: (measures: Measure[]) => void
  onDuplicate: (measureId: string) => void
  onRemoveMeasure?: (measureId: string) => void
  onSplitMeasure: (measureId: string, c1: string, c2: string) => void
  onApplyProgression: (measureId: string, prog: HarmonicProgression) => void
  onToggleRepeat: (measureId: string, type: 'start' | 'end') => void
  onToggleVolta: (measureId: string, volta: number) => void
}

export function MeasureEditModal({
  isOpen,
  onClose,
  selectedMeasure,
  measures,
  sectionName,
  currentKey = 'C',
  timeSignature = '4/4',
  diatonicChords = [],
  onUpdateMeasure,
  onUpdateAllMeasures,
  onDuplicate,
  onRemoveMeasure,
  onSplitMeasure,
  onApplyProgression,
  onToggleRepeat,
  onToggleVolta,
}: MeasureEditModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0)
  const [isChordModalOpen, setIsChordModalOpen] = useState<boolean>(false)
  const [showAdvancedSubdivision, setShowAdvancedSubdivision] = useState<boolean>(false)

  const effectiveTimeSig = selectedMeasure.timeSignature || timeSignature
  const effectiveBeats = getBeatsPerMeasure(effectiveTimeSig)
  const currentDivision = inferMeasureDivision(selectedMeasure)
  const currentSlots = ensureMeasureSlots(selectedMeasure, effectiveTimeSig)
  const divisionOptions = getDivisionOptionsForTimeSignature(effectiveTimeSig)
  const divisionBracket = getDivisionBracket(currentDivision)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Bloqueo de scroll de fondo mientras el modal está activo
  useEffect(() => {
    if (!isOpen) return
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.classList.add('overflow-hidden')
    document.documentElement.classList.add('overflow-hidden')
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.classList.remove('overflow-hidden')
      document.documentElement.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  // 2. Cierre accesible con tecla Escape (solo si el selector secundario de acorde no está abierto)
  useEffect(() => {
    if (!isOpen || isChordModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isChordModalOpen, onClose])

  // Catálogo completo de opciones rítmicas según compás
  const rhythmOptions = useMemo(() => {
    return getRhythmOptionsForTimeSignature(effectiveTimeSig)
  }, [effectiveTimeSig])

  // Categoría rítmica activa en las pestañas compactas ('regular' | 'irregular')
  const [rhythmCategory, setRhythmCategory] = useState<'regular' | 'irregular'>('regular')

  // Sincronizar automáticamente la pestaña si el compás activo tiene una subdivisión irregular
  useEffect(() => {
    if (
      currentDivision === 'triplet_half' ||
      currentDivision === 'triplet_quarter' ||
      currentDivision === 'triplet_eighth' ||
      currentDivision === 'quintuplet' ||
      currentDivision === 'sextuplet' ||
      currentDivision === 'septuplet' ||
      currentDivision === 'nonuplet'
    ) {
      setRhythmCategory('irregular')
    } else {
      setRhythmCategory('regular')
    }
  }, [selectedMeasure.id, currentDivision])

  // Opciones filtradas por la categoría de pestaña seleccionada
  const filteredRhythmOptions = useMemo(() => {
    return rhythmOptions.filter((opt) => opt.category === rhythmCategory)
  }, [rhythmOptions, rhythmCategory])

  // Opción rítmica actual identificada
  const currentRhythmOption = useMemo(() => {
    return (
      rhythmOptions.find(
        (opt) =>
          opt.division === currentDivision && opt.slotsCount === currentSlots.length
      ) ||
      rhythmOptions.find((opt) => opt.division === currentDivision) ||
      null
    )
  }, [rhythmOptions, currentDivision, currentSlots.length])

  const isCurrentInCatalog = rhythmOptions.some(
    (opt) => opt.division === currentDivision && opt.slotsCount === currentSlots.length
  )

  // Cambiar la división rítmica global del compás
  const handleSelectDivision = (newDivision: MeasureDivision, option?: RhythmOption) => {
    setActiveSlotIndex(0)
    const existingChords = currentSlots.map((s) => s.chord)
    const newSlots = generateSlotsForDivision(newDivision, existingChords, effectiveTimeSig)

    // Si la opción rítmica define etiquetas específicas de slot, las asignamos
    if (option?.slotLabels && option.slotLabels.length === newSlots.length) {
      newSlots.forEach((slot, idx) => {
        if (option.slotLabels?.[idx]) {
          slot.label = option.slotLabels[idx]
        }
      })
    }

    const syncedBeats = syncBeatsFromSlots(newSlots, newDivision, effectiveTimeSig)

    onUpdateMeasure({
      ...selectedMeasure,
      timeSignature: effectiveTimeSig,
      division: newDivision,
      slots: newSlots,
      beats: syncedBeats,
      subdivisionGrouping:
        getDivisionBracket(newDivision) ||
        (option?.category === 'irregular' ? `[ ${option.slotsCount} ]` : undefined),
    })
  }

  // Modificar el acorde de un slot con normalización inteligente
  const handleUpdateSlotChord = (slotIndex: number, newChord: string) => {
    const normalized = normalizeChordInput(newChord)
    const updatedSlots = currentSlots.map((s) => {
      if (s.index !== slotIndex) return s
      return {
        ...s,
        chord: normalized === '' ? null : normalized,
        isRest: normalized === '%' ? true : false,
      }
    })

    const syncedBeats = syncBeatsFromSlots(updatedSlots, currentDivision, effectiveTimeSig)

    onUpdateMeasure({
      ...selectedMeasure,
      slots: updatedSlots,
      beats: syncedBeats,
    })
  }

  // Toggle de acento rítmico (>) en un slot
  const handleToggleSlotAccent = (slotIndex: number) => {
    const updatedSlots = currentSlots.map((s) => {
      if (s.index !== slotIndex) return s
      return {
        ...s,
        accent: !s.accent,
      }
    })

    const syncedBeats = syncBeatsFromSlots(updatedSlots, currentDivision, effectiveTimeSig)

    onUpdateMeasure({
      ...selectedMeasure,
      slots: updatedSlots,
      beats: syncedBeats,
    })
  }

  // Toggle de silencio / corte (%) en un slot
  const handleToggleSlotRest = (slotIndex: number) => {
    const updatedSlots = currentSlots.map((s) => {
      if (s.index !== slotIndex) return s
      const isRest = !s.isRest
      return {
        ...s,
        isRest,
        chord: isRest ? '%' : (s.chord === '%' ? null : s.chord),
      }
    })

    const syncedBeats = syncBeatsFromSlots(updatedSlots, currentDivision, effectiveTimeSig)

    onUpdateMeasure({
      ...selectedMeasure,
      slots: updatedSlots,
      beats: syncedBeats,
    })
  }

  // Limpiar slot
  const handleClearSlot = (slotIndex: number) => {
    handleUpdateSlotChord(slotIndex, '')
  }

  // Abrir modal de selección de acorde
  const handleOpenChordModalForSlot = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex)
    setIsChordModalOpen(true)
  }

  // Asignar o desasignar cadencia
  const handleSelectCadence = (cad: CadenceDefinition | null) => {
    if (onUpdateAllMeasures) {
      const { updatedMeasures, targetUpdatedMeasure } = applyCadenceToMeasure(
        measures,
        selectedMeasure.id,
        cad,
        currentKey,
        timeSignature
      )
      onUpdateAllMeasures(updatedMeasures)
      onUpdateMeasure(targetUpdatedMeasure)
    } else {
      const isLast = measures.length > 0 && selectedMeasure.id === measures[measures.length - 1].id
      onUpdateMeasure({
        ...selectedMeasure,
        division: selectedMeasure.division || currentDivision,
        slots: selectedMeasure.slots || currentSlots,
        cadence: cad ? (cad.type || cad.id) : undefined,
        cadenceLabel: cad ? `${cad.name} (${cad.degrees})` : undefined,
        cadenceColor: cad ? cad.colorBadge : undefined,
        cadenceRole: cad ? (isLast ? 'single' : 'start') : undefined,
      })
    }
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="measure-modal-title"
    >
      {/* Contenedor del Modal / Bottom Sheet */}
      <div
        className="w-[95vw] sm:max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Indicador táctil superior para móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* 2. Cabecera Compacta del Compás */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          {/* Título y badge morado */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              id="measure-modal-title"
              className="px-2.5 py-1 rounded-xl text-xs font-black bg-purple-600 text-white shadow-sm shadow-purple-900/20 shrink-0"
            >
              Compás #{selectedMeasure.measureNumber}
            </span>
            {sectionName && (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                · {sectionName}
              </span>
            )}
            {divisionBracket && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                {divisionBracket}
              </span>
            )}
          </div>

          {/* Acciones rápidas de la cabecera */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Duplicar compás */}
            <button
              type="button"
              onClick={() => onDuplicate(selectedMeasure.id)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
              title="Duplicar compás"
              aria-label="Duplicar compás"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Eliminar compás (rojo suave) */}
            {onRemoveMeasure && (
              <button
                type="button"
                onClick={() => {
                  onRemoveMeasure(selectedMeasure.id)
                  onClose()
                }}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="Eliminar compás"
                aria-label="Eliminar compás"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Botón de cierre visible */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title="Cerrar modal (Esc)"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Cuerpo del Modal: Subdivisión, Slots de Acordes y Guías */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* A. Métrica / Subdivisión: Selector Horizontal Compacto de Ritmo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Ritmo / Subdivisión:</span>
              </label>

              <button
                type="button"
                onClick={() => setShowAdvancedSubdivision(!showAdvancedSubdivision)}
                className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{showAdvancedSubdivision ? 'Ocultar catálogo' : 'Más opciones'}</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform', showAdvancedSubdivision && 'rotate-180')} />
              </button>
            </div>

            {/* Segmented Control / Pestañas Compactas */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRhythmCategory('regular')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer font-bold',
                  rhythmCategory === 'regular'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Regulares
              </button>
              <button
                type="button"
                onClick={() => setRhythmCategory('irregular')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer font-bold',
                  rhythmCategory === 'irregular'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Tresillos / Irregulares
              </button>
            </div>

            {/* Cuadrícula de Opciones (Cards Compactas) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredRhythmOptions.map((opt) => {
                const isSelected =
                  currentDivision === opt.division &&
                  currentSlots.length === opt.slotsCount

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDivision(opt.division, opt)}
                    className={cn(
                      'p-2.5 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer active:scale-98 select-none',
                      isSelected
                        ? 'border-2 border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-sm'
                        : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span className="text-xs font-bold leading-tight truncate w-full">
                      {opt.name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-mono mt-0.5 truncate w-full',
                        isSelected
                          ? 'text-purple-600 dark:text-purple-400 font-semibold'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {opt.badge}
                    </span>
                  </button>
                )
              })}

              {/* Indicador adicional si la división activa proviene de opciones avanzadas */}
              {!isCurrentInCatalog && (
                <div className="p-2.5 rounded-xl text-left border-2 border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-sm flex flex-col justify-between">
                  <span className="text-xs font-bold leading-tight truncate w-full">
                    {divisionOptions.find((d) => d.id === currentDivision)?.name || 'Especial'}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                    {currentSlots.length} slots
                  </span>
                </div>
              )}
            </div>

            {/* Catálogo completo desplegable si el usuario desea amalgamas o tresillos */}
            {showAdvancedSubdivision && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <DivisionPicker
                  currentDivision={currentDivision}
                  timeSignature={effectiveTimeSig}
                  divisionOptions={divisionOptions}
                  onSelectDivision={(div) => {
                    handleSelectDivision(div)
                    setShowAdvancedSubdivision(false)
                  }}
                />
              </div>
            )}
          </div>

          {/* B. Slots de Acordes: Tamaño Táctil Cómodo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Acordes del compás ({currentSlots.length} {currentSlots.length === 1 ? 'slot' : 'slots'}):</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Toca cualquier slot para elegir acorde
              </span>
            </div>

            {/* Renderizado de Slots */}
            {currentDivision === 'whole' ? (
              /* Caso Redonda: 1 Slot Central Grande para Todo el Compás */
              <div className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/60 flex flex-col items-center justify-center gap-2 text-center">
                <div className="flex items-center justify-between w-full px-1 text-xs font-bold text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Compás completo ({formatTimeSignaturePulseMarks(effectiveTimeSig)})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSlotAccent(0)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-black border transition-colors',
                        currentSlots[0]?.accent
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                      )}
                      title="Acento rítmico (>)"
                    >
                      &gt; Acento
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSlotRest(0)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-black border transition-colors',
                        currentSlots[0]?.isRest
                          ? 'bg-rose-500 text-white border-rose-600'
                          : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                      )}
                      title="Silencio (%)"
                    >
                      % Silencio
                    </button>
                    {currentSlots[0]?.chord && (
                      <button
                        type="button"
                        onClick={() => handleClearSlot(0)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                        title="Borrar acorde"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Botón Selector Principal del Slot Único */}
                <button
                  type="button"
                  onClick={() => handleOpenChordModalForSlot(0)}
                  className={cn(
                    'w-full py-5 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 group shadow-sm active:scale-98 cursor-pointer',
                    currentSlots[0]?.chord && !currentSlots[0]?.isRest
                      ? 'border-purple-400 bg-white dark:bg-slate-900 hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/40'
                      : currentSlots[0]?.isRest
                      ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/30 hover:border-rose-500'
                      : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-400 hover:bg-purple-50/20'
                  )}
                >
                  {currentSlots[0]?.chord ? (
                    <span className="font-mono text-3xl font-black text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform whitespace-nowrap min-w-0">
                      {currentSlots[0].chord}
                    </span>
                  ) : currentSlots[0]?.isRest ? (
                    <span className="font-mono text-2xl font-black text-rose-500">
                      % (Silencio)
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-purple-600 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" /> Tocar para seleccionar acorde
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium">
                    {currentSlots[0]?.chord ? 'Toca para abrir catálogo de acordes' : 'Abre el selector con 1 clic'}
                  </span>
                </button>
              </div>
            ) : (
              /* Casos Múltiples Slots: Blancas (2), Negras (4), Corcheas (8), Tresillos, etc. */
              <div
                className={cn(
                  'grid gap-2',
                  currentSlots.length > 4
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : currentSlots.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2'
                )}
              >
                {currentSlots.map((slot) => {
                  const isOffbeat = slot.label === '&' || slot.label.includes('&')
                  const isRest = slot.isRest || slot.chord === '%'
                  const hasChord = !!slot.chord && !isRest
                  const isActive = activeSlotIndex === slot.index

                  // Indicador minimalista de tiempo (ej. T. 1, T. 1.5, T. 2, etc.)
                  const slotTimingLabel =
                    currentRhythmOption?.slotLabels?.[slot.index] ||
                    (slot.label.startsWith('T.')
                      ? slot.label
                      : slot.label === '&'
                      ? `T. ${Math.floor(slot.index / 2) + 1}.5`
                      : /^\d+$/.test(slot.label)
                      ? `T. ${slot.label}`
                      : slot.label)

                  return (
                    <div
                      key={slot.index}
                      className={cn(
                        'flex flex-col gap-1 p-2 rounded-xl border transition-all text-center',
                        isActive
                          ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/30 dark:bg-purple-950/30'
                          : hasChord
                          ? 'border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 shadow-xs'
                          : isRest
                          ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60'
                      )}
                    >
                      {/* Cabecera del Slot */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span
                          className={cn(
                            'font-mono px-1.5 py-0.5 rounded text-[10px] font-bold',
                            isOffbeat
                              ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80'
                              : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                          )}
                        >
                          {slotTimingLabel}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSlotAccent(slot.index)}
                            className={cn(
                              'w-4 h-4 rounded text-[9px] font-black flex items-center justify-center transition-colors',
                              slot.accent
                                ? 'bg-amber-500 text-white'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                            )}
                            title="Acento (>)"
                          >
                            &gt;
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSlotRest(slot.index)}
                            className={cn(
                              'w-4 h-4 rounded text-[9px] font-black flex items-center justify-center transition-colors',
                              isRest
                                ? 'bg-rose-500 text-white'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                            )}
                            title="Silencio (%)"
                          >
                            %
                          </button>
                          {slot.chord && (
                            <button
                              type="button"
                              onClick={() => handleClearSlot(slot.index)}
                              className="w-4 h-4 rounded text-[9px] font-black flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                              title="Borrar acorde"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Botón Selector del Slot */}
                      <button
                        type="button"
                        onClick={() => handleOpenChordModalForSlot(slot.index)}
                        className={cn(
                          'w-full py-3 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center group active:scale-95 shadow-2xs cursor-pointer min-h-[46px]',
                          hasChord
                            ? 'border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/40 hover:border-purple-400'
                            : isRest
                            ? 'border-rose-200 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/40 hover:border-rose-400'
                            : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-400 hover:bg-purple-50/20'
                        )}
                        title={`Tocar para elegir acorde de ${slot.label}`}
                      >
                        {hasChord ? (
                          <span className="font-mono font-black text-sm sm:text-base text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform whitespace-nowrap min-w-0">
                            {slot.chord}
                          </span>
                        ) : isRest ? (
                          <span className="font-mono font-black text-xs text-rose-500 whitespace-nowrap">
                            %
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-purple-600 whitespace-nowrap">
                            + Acorde
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* C. Frase de Letra o Guía Rítmica del Compás */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Frase de letra o guía para este compás (opcional):
            </label>
            <input
              type="text"
              defaultValue={selectedMeasure.guideLyric || ''}
              placeholder="Ej: Cuando la noche cae..."
              onBlur={(e) => {
                onUpdateMeasure({
                  ...selectedMeasure,
                  guideLyric: e.target.value,
                })
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          {/* D. Herramientas Rápidas de Armonía y Estructura */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Armonía y Repeticiones:</span>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Selector de Cadencia */}
              <CadencePicker
                currentKey={currentKey}
                currentCadenceId={selectedMeasure.cadence}
                buttonLabel="✦ Marcar Cadencia"
                buttonVariant="subtle"
                onSelectCadence={handleSelectCadence}
              />

              {/* Progresión armónica desde aquí */}
              <ProgressionPicker
                currentKey={currentKey}
                buttonLabel="✦ Progresión"
                buttonVariant="subtle"
                onSelectProgression={(prog) => onApplyProgression(selectedMeasure.id, prog)}
              />

              {/* Dividir en 2 acordes (atajo) */}
              <button
                type="button"
                onClick={() => {
                  const c1 = currentSlots[0]?.chord || (diatonicChords[0] || 'C')
                  const c2 = diatonicChords[4] || 'G'
                  onSplitMeasure(selectedMeasure.id, c1, c2)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shadow-2xs"
                title="Dividir en 2 acordes de 2 tiempos"
              >
                <Split className="w-3.5 h-3.5" /> 2 Acordes
              </button>

              {/* Repeticiones */}
              <button
                type="button"
                onClick={() => onToggleRepeat(selectedMeasure.id, 'start')}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shadow-2xs',
                  selectedMeasure.repeatStart
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
                title="Apertura de repetición |:"
              >
                |: Inicio
              </button>
              <button
                type="button"
                onClick={() => onToggleRepeat(selectedMeasure.id, 'end')}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shadow-2xs',
                  selectedMeasure.repeatEnd
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
                title="Cierre de repetición :|"
              >
                :| Fin
              </button>

              {/* Casillas Volta */}
              <button
                type="button"
                onClick={() => onToggleVolta(selectedMeasure.id, 1)}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-bold border transition-colors shadow-2xs',
                  selectedMeasure.volta === 1
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                1ª
              </button>
              <button
                type="button"
                onClick={() => onToggleVolta(selectedMeasure.id, 2)}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-bold border transition-colors shadow-2xs',
                  selectedMeasure.volta === 2
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                2ª
              </button>
            </div>

            {/* Píldoras rápidas de cadencias frecuentes */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedMeasure.cadence && (
                  <button
                    type="button"
                    onClick={() => handleSelectCadence(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 transition-colors shadow-2xs"
                  >
                    ✕ Quitar Cadencia
                  </button>
                )}
                {PRESET_CADENCES.slice(0, 4).map((cad) => {
                  const isActive = selectedMeasure.cadence === cad.type || selectedMeasure.cadence === cad.id
                  return (
                    <button
                      key={cad.id}
                      type="button"
                      onClick={() => handleSelectCadence(isActive ? null : cad)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold border transition-all truncate',
                        isActive
                          ? cn(cad.colorBadge, 'ring-2 ring-purple-500/50 shadow-sm')
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      )}
                      title={isActive ? 'Clic para quitar cadencia' : cad.description}
                    >
                      {cad.name.split('(')[0].replace('Cadencia ', '')} ({cad.degrees})
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Pie del Modal con Botón Listo / Guardar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Los cambios se guardan automáticamente al instante
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/20 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Listo</span>
          </button>
        </div>
      </div>

      {/* Selector modal secundario de acordes en catálogo interactivo */}
      <ChordSelectorModal
        isOpen={isChordModalOpen}
        onClose={() => setIsChordModalOpen(false)}
        onSelectChord={(chord) => handleUpdateSlotChord(activeSlotIndex, chord)}
        initialChord={currentSlots[activeSlotIndex]?.chord}
        currentKey={currentKey}
        diatonicChords={diatonicChords}
        slotLabel={currentSlots[activeSlotIndex]?.label || `${activeSlotIndex + 1}`}
        measureNumber={selectedMeasure.measureNumber}
      />
    </div>,
    document.body
  )
}
