'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Measure, ChordBeat } from '@/types/measure'
import {
  getBeatsPerMeasure,
  duplicateMeasure,
  applyProgressionFromMeasure,
  getCadenceStartPercent,
  getCadenceEndPercent,
  getCadenceDisplayLabels,
} from '@/lib/measure-utils'
import { HarmonicProgression, getProgressionChords } from '@/lib/harmonic-theory'
import { MeasureCell, CadenceBracketInfo, CadenceWrapType } from './measure-cell'
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

  // Cierre opcional con tecla Escape en teclados físicos (sin click outside para evitar cierres accidentales)
  useEffect(() => {
    if (!selectedMeasureId) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedMeasureId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
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
        { index: 0, label: 'T. 1-2', chord: chord1 || 'C' },
        { index: 1, label: 'T. 3-4', chord: chord2 || 'G' },
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

  // Eliminar cadencia de un compás (y de su par si es un enlace inter-compás)
  const handleRemoveCadence = (measureId: string) => {
    const idx = measures.findIndex((m) => m.id === measureId)
    if (idx === -1) return

    const bracket = cadenceBrackets[measureId]
    const pairedId = bracket?.pairedMeasureId

    const updated = measures.map((m, i) => {
      if (m.id === measureId || (pairedId && m.id === pairedId)) {
        return {
          ...m,
          cadence: undefined,
          cadenceLabel: undefined,
          cadenceColor: undefined,
          cadenceRole: undefined,
        }
      }
      // Limpieza de seguridad por enlace contiguo si existía
      if (idx !== -1 && ((i === idx + 1 && m.cadenceRole === 'end') || (i === idx - 1 && m.cadenceRole === 'start'))) {
        return {
          ...m,
          cadence: undefined,
          cadenceLabel: undefined,
          cadenceColor: undefined,
          cadenceRole: undefined,
        }
      }
      return m
    })

    onUpdateMeasures(updated)
  }

  // Calcular corchetes flotantes superiores de cadencias MANUALES con geometría y wrap precisos
  const cadenceBrackets = useMemo(() => {
    const map: Record<string, CadenceBracketInfo> = {}

    for (let i = 0; i < measures.length; i++) {
      const m = measures[i]
      if (!m.cadence && !m.cadenceLabel && m.cadenceRole !== 'end') continue

      const rawLabel = m.cadenceLabel || m.cadence
      const { full: label, short: shortLabel } = getCadenceDisplayLabels(m.cadence, rawLabel)

      const isLastInRowDesktop = (i + 1) % 4 === 0 || i === measures.length - 1
      const isLastInRowMobile = (i + 1) % 2 === 0 || i === measures.length - 1

      // Si este compás está marcado expresamente como 'end' (receptor)
      if (m.cadenceRole === 'end') {
        const prevIdx = i - 1
        const prevM = prevIdx >= 0 ? measures[prevIdx] : null
        const wrapsOnDesktop = prevIdx >= 0 && prevIdx % 4 === 3
        const wrapsOnMobile = prevIdx >= 0 && prevIdx % 2 === 1
        const wrapType: CadenceWrapType = wrapsOnDesktop
          ? 'both'
          : wrapsOnMobile
            ? 'mobile-only'
            : 'none'

        map[m.id] = {
          role: 'end',
          endPercent: getCadenceEndPercent(m, timeSignature),
          wrapType,
          pairedMeasureId: prevM?.id,
          isLastInRowDesktop,
          isLastInRowMobile,
        }
        continue
      }

      // Si está marcado explícitamente como 'single' O es el último compás de la sección
      if (m.cadenceRole === 'single' || i === measures.length - 1) {
        map[m.id] = {
          role: 'single',
          label,
          shortLabel,
          startPercent: getCadenceStartPercent(m, timeSignature),
          endPercent: getCadenceEndPercent(m, timeSignature),
          isLastInRowDesktop,
          isLastInRowMobile,
        }
        continue
      }

      // Inter-compás: Este compás es el emisor (tensión) y enlaza con el compás siguiente (i + 1)
      const nextM = measures[i + 1]
      const wrapsOnDesktop = i % 4 === 3
      const wrapsOnMobile = i % 2 === 1
      const wrapType: CadenceWrapType = wrapsOnDesktop
        ? 'both'
        : wrapsOnMobile
          ? 'mobile-only'
          : 'none'

      const startPercent = getCadenceStartPercent(m, timeSignature)
      const endPercent = nextM ? getCadenceEndPercent(nextM, timeSignature) : 25

      // Registrar compás emisor (tensión)
      map[m.id] = {
        role: 'start',
        label,
        shortLabel,
        startPercent,
        endPercent,
        wrapType,
        pairedMeasureId: nextM?.id,
        isLastInRowDesktop,
        isLastInRowMobile,
      }

      // Registrar compás receptor (resolución)
      if (nextM && !map[nextM.id]) {
        const nextIsLastDesktop = (i + 2) % 4 === 0 || i + 1 === measures.length - 1
        const nextIsLastMobile = (i + 2) % 2 === 0 || i + 1 === measures.length - 1
        map[nextM.id] = {
          role: 'end',
          endPercent,
          wrapType,
          pairedMeasureId: m.id,
          isLastInRowDesktop: nextIsLastDesktop,
          isLastInRowMobile: nextIsLastMobile,
        }
      }
    }

    return map
  }, [measures, timeSignature])

  return (
    <div className="space-y-4">
      {/* Rejilla de Compases: 4 Compases por Fila en Desktop, 2 en Móvil con espacio superior para corchetes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2.5 sm:gap-x-3.5 gap-y-9 sm:gap-y-10 pt-9 sm:pt-10">
        {measures.map((measure, index) => {
          const isSelected = selectedMeasureId === measure.id
          const prevMeasure = index > 0 ? measures[index - 1] : null
          const bracket = cadenceBrackets[measure.id]

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
              cadenceBracket={bracket}
              onClick={() => {
                if (isEditing) setSelectedMeasureId(measure.id)
              }}
              onDuplicate={isEditing ? handleDuplicate : undefined}
              onRemove={isEditing && onRemoveMeasure ? onRemoveMeasure : undefined}
              onRemoveCadence={isEditing ? handleRemoveCadence : undefined}
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
          onUpdateAllMeasures={onUpdateMeasures}
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
