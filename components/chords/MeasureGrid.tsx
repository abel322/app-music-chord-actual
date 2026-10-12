'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Measure, ChordBeat } from '@/types/measure'
import { getBeatsPerMeasure, duplicateMeasure, applyProgressionFromMeasure } from '@/lib/measure-utils'
import { HarmonicProgression, getProgressionChords } from '@/lib/harmonic-theory'
import { MeasureCell } from './measure-cell'
import { MeasureInspector } from './measure-inspector'
import { Plus } from 'lucide-react'

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
  const gridContainerRef = useRef<HTMLDivElement>(null)

  // Deselección automática al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!selectedMeasureId) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      // Si el clic ocurrió dentro de nuestro contenedor (grid de compases + panel inspector), no cerrar
      if (gridContainerRef.current?.contains(target)) {
        return
      }

      // Si el clic ocurrió dentro de un modal / popover / portal / dropdown, no cerrar
      if (
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[role="dialog"]') ||
        target.closest('[role="menu"]') ||
        target.closest('.chord-picker-modal') ||
        target.closest('.chord-picker-popover')
      ) {
        return
      }

      // Clic exterior detectado: deseleccionar y cerrar panel inspector
      setSelectedMeasureId(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedMeasureId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedMeasureId])

  const selectedMeasure = measures.find((m) => m.id === selectedMeasureId)

  // Actualizar un compás individual
  const handleUpdateMeasure = (updated: Measure) => {
    onUpdateMeasures(measures.map((m) => (m.id === updated.id ? updated : m)))
  }

  // Duplicar compás
  const handleDuplicate = (measureId: string) => {
    const duplicatedList = duplicateMeasure(measures, measureId)
    onUpdateMeasures(duplicatedList)
  }

  // Dividir el compás en 2 acordes
  const handleSplitMeasure = (measureId: string, chord1: string, chord2: string) => {
    const measure = measures.find((m) => m.id === measureId)
    if (!measure) return

    const midBeat = Math.ceil(beatsPerMeasure / 2) + 1
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
      division: 'half',
      slots: [
        { index: 0, label: 'Mitad 1 (T. 1)', chord: chord1 || 'C' },
        { index: 1, label: 'Mitad 2 (T. 3)', chord: chord2 || 'G' },
      ],
      beats: newBeats,
    })
  }

  // Aplicar progresión armónica hacia adelante desde este compás
  const handleApplyProgressionFromHere = (measureId: string, prog: HarmonicProgression) => {
    const chords = getProgressionChords(prog, currentKey)
    const updated = applyProgressionFromMeasure(measures, measureId, chords, timeSignature)
    onUpdateMeasures(updated)
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
    <div ref={gridContainerRef} className="space-y-4">
      {/* Rejilla de Compases: 4 Compases por Fila en Desktop, 2 en Móvil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {measures.map((measure, index) => {
          const isSelected = selectedMeasureId === measure.id
          const prevMeasure = index > 0 ? measures[index - 1] : null

          return (
            <MeasureCell
              key={measure.id}
              measure={measure}
              timeSignature={timeSignature}
              beatsPerMeasure={beatsPerMeasure}
              currentKey={currentKey}
              isSelected={isSelected}
              isEditing={isEditing}
              prevMeasure={prevMeasure}
              onClick={() => {
                if (isEditing) setSelectedMeasureId(measure.id)
              }}
              onDuplicate={isEditing ? handleDuplicate : undefined}
              onRemove={isEditing && onRemoveMeasure ? onRemoveMeasure : undefined}
            />
          )
        })}
      </div>

      {/* Inspector Detallado del Compás Seleccionado en Modo Edición */}
      {isEditing && selectedMeasure && (
        <MeasureInspector
          selectedMeasure={selectedMeasure}
          measures={measures}
          currentKey={currentKey}
          timeSignature={timeSignature}
          diatonicChords={diatonicChords}
          onUpdateMeasure={handleUpdateMeasure}
          onDuplicate={handleDuplicate}
          onSplitMeasure={handleSplitMeasure}
          onApplyProgression={handleApplyProgressionFromHere}
          onToggleRepeat={handleToggleRepeat}
          onToggleVolta={handleToggleVolta}
          onClose={() => setSelectedMeasureId(null)}
        />
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
