'use client'

import React, { useState } from 'react'
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
  formatTimeSignaturePulseMarks
} from '@/lib/rhythm-utils'
import { getBeatsPerMeasure, applyCadenceToMeasure } from '@/lib/measure-utils'
import { ProgressionPicker } from './ProgressionPicker'
import { CadencePicker } from './CadencePicker'
import { ChordSelectorModal } from './ChordSelectorModal'
import { normalizeChordInput } from '@/lib/chord-catalog'
import { Copy, Split, Sparkles, Tag, Sliders, VolumeX, X, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MeasureInspectorProps {
  selectedMeasure: Measure
  measures: Measure[]
  currentKey?: string
  timeSignature?: string
  diatonicChords?: string[]
  onUpdateMeasure: (updated: Measure) => void
  onUpdateAllMeasures?: (measures: Measure[]) => void
  onDuplicate: (measureId: string) => void
  onSplitMeasure: (measureId: string, c1: string, c2: string) => void
  onApplyProgression: (measureId: string, prog: HarmonicProgression) => void
  onToggleRepeat: (measureId: string, type: 'start' | 'end') => void
  onToggleVolta: (measureId: string, volta: number) => void
  onClose?: () => void
}

export function MeasureInspector({
  selectedMeasure,
  measures,
  currentKey = 'C',
  timeSignature = '4/4',
  diatonicChords = [],
  onUpdateMeasure,
  onUpdateAllMeasures,
  onDuplicate,
  onSplitMeasure,
  onApplyProgression,
  onToggleRepeat,
  onToggleVolta,
  onClose,
}: MeasureInspectorProps) {
  const effectiveTimeSig = selectedMeasure.timeSignature || timeSignature
  const effectiveBeats = getBeatsPerMeasure(effectiveTimeSig)
  const currentDivision = inferMeasureDivision(selectedMeasure)
  const currentSlots = ensureMeasureSlots(selectedMeasure, effectiveTimeSig)
  const divisionOptions = getDivisionOptionsForTimeSignature(effectiveTimeSig)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0)
  const [isChordModalOpen, setIsChordModalOpen] = useState<boolean>(false)

  // Cambiar la división global del compás completo
  const handleSelectDivision = (newDivision: MeasureDivision) => {
    setActiveSlotIndex(0)
    const existingChords = currentSlots.map((s) => s.chord)
    const newSlots = generateSlotsForDivision(newDivision, existingChords, effectiveTimeSig)
    const syncedBeats = syncBeatsFromSlots(newSlots, newDivision, effectiveTimeSig)

    onUpdateMeasure({
      ...selectedMeasure,
      timeSignature: effectiveTimeSig,
      division: newDivision,
      slots: newSlots,
      beats: syncedBeats,
      subdivisionGrouping: getDivisionBracket(newDivision) || undefined,
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

  // Abrir modal para un slot específico
  const handleOpenChordModalForSlot = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex)
    setIsChordModalOpen(true)
  }

  // Asignar o desasignar cadencia e inyectar acordes armónicos automáticamente
  const handleSelectCadence = (cad: CadenceDefinition | null) => {
    const { updatedMeasures, targetUpdatedMeasure } = applyCadenceToMeasure(
      measures,
      selectedMeasure.id,
      cad,
      currentKey,
      effectiveTimeSig
    )
    if (onUpdateAllMeasures) {
      onUpdateAllMeasures(updatedMeasures)
    } else {
      onUpdateMeasure(targetUpdatedMeasure)
    }
  }

  const divisionBracket = getDivisionBracket(currentDivision)

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in space-y-4">
      {/* 1. Barra Superior del Inspector: Controles Generales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-primary-600 text-white shadow-md shadow-primary-900/30">
            Compás #{selectedMeasure.measureNumber}
          </span>
          {divisionBracket && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              {divisionBracket}
            </span>
          )}
          <span className="text-xs text-slate-500 font-medium">
            Configuración armónica y rítmica del compás
          </span>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Progresión Modular */}
          <ProgressionPicker
            currentKey={currentKey}
            buttonLabel="✦ Progresión desde aquí"
            buttonVariant="subtle"
            onSelectProgression={(prog) => onApplyProgression(selectedMeasure.id, prog)}
          />

          {/* Cadencia Modular */}
          <CadencePicker
            currentKey={currentKey}
            currentCadenceId={selectedMeasure.cadence}
            buttonLabel="✦ Marcar Cadencia"
            buttonVariant="subtle"
            onSelectCadence={handleSelectCadence}
          />

          {/* Duplicar Compás */}
          <button
            type="button"
            onClick={() => onDuplicate(selectedMeasure.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Clonar este compás"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicar
          </button>

          {/* Dividir en 2 Acordes (Atajo) */}
          <button
            type="button"
            onClick={() => {
              const c1 = currentSlots[0]?.chord || (diatonicChords[0] || 'C')
              const c2 = diatonicChords[4] || 'G'
              onSplitMeasure(selectedMeasure.id, c1, c2)
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/50 transition-colors shadow-2xs"
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
                ? 'bg-primary-600 text-white border-primary-600'
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
                ? 'bg-primary-600 text-white border-primary-600'
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

          {/* Botón Cerrar Inspector */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-2xs ml-1"
              title="Cerrar inspector (Escape o clic fuera)"
            >
              <X className="w-3.5 h-3.5" /> Cerrar
            </button>
          )}
        </div>
      </div>

      {/* 2. SELECTOR DE DIVISIÓN RÍTMICA Y SLOTS INTERACTIVOS */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <label className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary-500" />
            <span>Métrica y Subdivisión del Compás:</span>
          </label>

          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            {currentSlots.length} {currentSlots.length === 1 ? 'Slot' : 'Slots'} • Toca cualquier slot para asignar acorde
          </span>
        </div>

        {/* Dropdown Maestro de División del Compás */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="md:col-span-2">
            <select
              value={currentDivision}
              onChange={(e) => handleSelectDivision(e.target.value as MeasureDivision)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
            >
              <optgroup label={`1. Regulares / Estándar (${effectiveTimeSig})`}>
                {divisionOptions
                  .filter((d) => d.category === 'regular')
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
              </optgroup>

              {divisionOptions.some((d) => d.category === 'irregular') && (
                <optgroup label="2. Irregulares / Polirritmias en el Compás">
                  {divisionOptions
                    .filter((d) => d.category === 'irregular')
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                </optgroup>
              )}

              {divisionOptions.some((d) => d.category === 'amalgam') && (
                <optgroup label="3. Compases Compuestos y Amalgamas Rítmicas">
                  {divisionOptions
                    .filter((d) => d.category === 'amalgam')
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            {divisionOptions.find((d) => d.id === currentDivision)?.description ||
              MEASURE_DIVISIONS.find((d) => d.id === currentDivision)?.description}
          </div>
        </div>

        {/* 3. TIRA / GRID DE SLOTS INTERACTIVOS (SELECTORES TIPO BOTÓN) */}
        <div className="pt-1">
          {currentDivision === 'whole' ? (
            /* Caso Redonda: 1 Slot Central Grande para Todo el Compás */
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-primary-200 dark:border-primary-900/60 flex flex-col items-center justify-center gap-2.5 text-center">
              <div className="flex items-center justify-between w-full max-w-sm px-1 text-xs font-bold text-slate-500">
                <span className="uppercase tracking-wider">
                  Acorde para Todo el Compás ({formatTimeSignaturePulseMarks(effectiveTimeSig)})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleSlotAccent(0)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-black border transition-colors',
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
                      'px-2 py-0.5 rounded-md text-[10px] font-black border transition-colors',
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
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
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
                  'w-full max-w-sm py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 group shadow-sm active:scale-98',
                  currentSlots[0]?.chord && !currentSlots[0]?.isRest
                    ? 'border-primary-400 bg-white dark:bg-slate-900 hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-950/30'
                    : currentSlots[0]?.isRest
                    ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/30 hover:border-rose-500'
                    : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 hover:bg-primary-50/20'
                )}
              >
                {currentSlots[0]?.chord ? (
                  <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 whitespace-nowrap min-w-0">
                    {currentSlots[0].chord}
                  </span>
                ) : currentSlots[0]?.isRest ? (
                  <span className="font-mono text-xl font-black text-rose-500">
                    % (Silencio)
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-primary-600 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-500" /> Tocar para seleccionar acorde
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentSlots[0]?.chord ? 'Toca para abrir catálogo de acordes' : 'Abre el selector con 1 clic'}
                </span>
              </button>
            </div>
          ) : (
            /* Casos Múltiples Slots: Blancas (2), Negras (4), Corcheas (8), Semicorcheas (16), etc. */
            <div className="space-y-2">
              <div
                className={cn(
                  'grid gap-2',
                  currentSlots.length === 2 && 'grid-cols-2',
                  currentSlots.length === 3 && 'grid-cols-3',
                  currentSlots.length === 4 && 'grid-cols-2 sm:grid-cols-4',
                  currentSlots.length === 5 && 'grid-cols-5',
                  currentSlots.length === 6 && 'grid-cols-3 sm:grid-cols-6',
                  currentSlots.length === 7 && 'grid-cols-7',
                  currentSlots.length === 8 && 'grid-cols-4 sm:grid-cols-8',
                  currentSlots.length === 9 && 'grid-cols-3 sm:grid-cols-9',
                  currentSlots.length === 12 && 'grid-cols-4 sm:grid-cols-6 md:grid-cols-12',
                  currentSlots.length >= 16 && 'grid-cols-4 sm:grid-cols-8 md:grid-cols-16'
                )}
              >
                {currentSlots.map((slot) => {
                  const isOffbeat = slot.label === '&'
                  const isRest = slot.isRest || slot.chord === '%'
                  const hasChord = !!slot.chord && !isRest
                  const isActive = activeSlotIndex === slot.index

                  return (
                    <div
                      key={slot.index}
                      className={cn(
                        'flex flex-col gap-1.5 p-2 rounded-xl border transition-all text-center',
                        isActive
                          ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/30 dark:bg-primary-950/20'
                          : hasChord
                          ? 'border-primary-300 dark:border-primary-800/80 bg-white dark:bg-slate-900'
                          : isRest
                          ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60'
                      )}
                    >
                      {/* Cabecera del Slot: Etiqueta y Controles Rápidos */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span
                          className={cn(
                            'font-mono px-1.5 py-0.5 rounded text-[10px] font-black',
                            isOffbeat
                              ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-950'
                              : 'text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {slot.label}
                        </span>

                        <div className="flex items-center gap-0.5">
                          {/* Toggle Acento */}
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

                          {/* Toggle Silencio / Corte */}
                          <button
                            type="button"
                            onClick={() => handleToggleSlotRest(slot.index)}
                            className={cn(
                              'w-4 h-4 rounded text-[9px] font-black flex items-center justify-center transition-colors',
                              isRest
                                ? 'bg-rose-500 text-white'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                            )}
                            title="Silencio / Corte (%)"
                          >
                            %
                          </button>

                          {/* Borrar acorde */}
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

                      {/* Botón Selector Interactivo del Slot */}
                      <button
                        type="button"
                        onClick={() => handleOpenChordModalForSlot(slot.index)}
                        className={cn(
                          'w-full py-2.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center group active:scale-95 shadow-2xs cursor-pointer',
                          hasChord
                            ? 'border-primary-200 dark:border-primary-800/80 bg-primary-50/50 dark:bg-primary-950/40 hover:border-primary-400 hover:bg-primary-100/50 dark:hover:bg-primary-900/40'
                            : isRest
                            ? 'border-rose-200 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/40 hover:border-rose-400'
                            : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        )}
                        title={`Tocar para seleccionar acorde para ${slot.label}`}
                      >
                        {hasChord ? (
                          <span className="font-mono font-black text-xs sm:text-sm text-primary-700 dark:text-primary-300 group-hover:text-primary-800 dark:group-hover:text-primary-200 whitespace-nowrap min-w-0">
                            {slot.chord}
                          </span>
                        ) : isRest ? (
                          <span className="font-mono font-black text-xs text-rose-500 whitespace-nowrap min-w-0">
                            %
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-primary-600 whitespace-nowrap">
                            + Acorde
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Selector Rápido de Acordes en 1 Clic */}
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

      {/* 4. Letra Guía del Compás y Atajos de Cadencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-3 border-t border-slate-200 dark:border-slate-800">
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
              onUpdateMeasure({
                ...selectedMeasure,
                guideLyric: e.target.value,
              })
            }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Insignia / Atajos Rápidos de Cadencia */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-purple-500" /> Insignia de Cadencia en este compás:
            </label>
            {selectedMeasure.cadence && (
              <button
                type="button"
                onClick={() => handleSelectCadence(null)}
                className="text-[11px] text-red-500 hover:underline font-semibold"
              >
                Quitar Cadencia
              </button>
            )}
          </div>

          {/* Botones de 1 clic para cadencias frecuentes */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_CADENCES.slice(0, 6).map((cad) => {
              const isActive = selectedMeasure.cadence === cad.type || selectedMeasure.cadence === cad.id
              return (
                <button
                  key={cad.id}
                  type="button"
                  onClick={() => handleSelectCadence(cad)}
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
  )
}
