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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MeasureCell, MeasureCellProps, CadenceBracketInfo, CadenceWrapType } from './measure-cell'
import { MeasureEditModal } from './MeasureEditModal'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableMeasureCellProps extends MeasureCellProps {
  id: string
}

function SortableMeasureCell(props: SortableMeasureCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.id,
    disabled: !props.isEditing,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-full transition-shadow',
        isDragging && 'opacity-40 border-2 border-dashed border-purple-400 dark:border-purple-500 rounded-xl bg-purple-50/40 dark:bg-purple-950/30'
      )}
    >
      <MeasureCell
        {...props}
        dragHandleProps={props.isEditing ? { ...attributes, ...listeners } : undefined}
        isDragging={isDragging}
      />
    </div>
  )
}

interface MeasureGridProps {
  measures: Measure[]
  timeSignature?: string
  currentKey?: string
  diatonicChords?: string[]
  isEditing?: boolean
  activeMeasureId?: string | null
  isPlaying?: boolean
  measureDurationMs?: number
  sectionName?: string
  sectionRepeatCount?: number
  onUpdateMeasures: (updatedMeasures: Measure[]) => void
  onAddMeasures?: (count: number) => void
  onRemoveMeasure?: (measureId: string) => void
  onMeasureClick?: (measure: Measure) => void
}

export function MeasureGrid({
  measures,
  timeSignature = '4/4',
  currentKey = 'C',
  diatonicChords = [],
  isEditing = false,
  activeMeasureId = null,
  isPlaying = false,
  measureDurationMs,
  sectionName,
  sectionRepeatCount = 1,
  onUpdateMeasures,
  onAddMeasures,
  onRemoveMeasure,
  onMeasureClick,
}: MeasureGridProps) {
  const beatsPerMeasure = getBeatsPerMeasure(timeSignature)
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeMeasure = useMemo(
    () => measures.find((m) => m.id === activeId) || null,
    [measures, activeId]
  )

  // Sensores configurados para evitar conflictos con clic y scroll de pantalla
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 6,
    },
  })

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = measures.findIndex((m) => m.id === active.id)
      const newIndex = measures.findIndex((m) => m.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(measures, oldIndex, newIndex)
        // Renumeración secuencial de los compases manteniendo la integridad completa de datos
        const renumbered = reordered.map((m, idx) => ({
          ...m,
          measureNumber: idx + 1,
        }))
        onUpdateMeasures(renumbered)
      }
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

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
      {/* Rejilla de Compases con DnD Scoped a la Sección Actual */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={measures.map((m) => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2.5 sm:gap-x-3.5 gap-y-9 sm:gap-y-10 pt-9 sm:pt-10">
            {measures.map((measure, index) => {
              const isSelected = selectedMeasureId === measure.id
              const isActive = activeMeasureId === measure.id
              const prevMeasure = index > 0 ? measures[index - 1] : null
              const bracket = cadenceBrackets[measure.id]
              const isFirst = index === 0
              const isLast = index === measures.length - 1
              const sectionRepeatStart = isFirst && (sectionRepeatCount ?? 1) > 1 && !measure.repeatStart
              const sectionRepeatEnd = isLast && (sectionRepeatCount ?? 1) > 1 && !measure.repeatEnd ? sectionRepeatCount : undefined

              return (
                <SortableMeasureCell
                  key={measure.id}
                  id={measure.id}
                  measure={measure}
                  timeSignature={timeSignature}
                  beatsPerMeasure={beatsPerMeasure}
                  currentKey={currentKey}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  isActive={isActive}
                  isPlaying={isPlaying}
                  measureDurationMs={measureDurationMs}
                  prevMeasure={prevMeasure}
                  cadenceBracket={bracket}
                  sectionRepeatStart={sectionRepeatStart}
                  sectionRepeatEnd={sectionRepeatEnd}
                  onClick={() => {
                    if (isEditing) setSelectedMeasureId(measure.id)
                    onMeasureClick?.(measure)
                  }}
                  onDuplicate={isEditing ? handleDuplicate : undefined}
                  onRemove={isEditing && onRemoveMeasure ? onRemoveMeasure : undefined}
                  onRemoveCadence={isEditing ? handleRemoveCadence : undefined}
                />
              )
            })}
          </div>
        </SortableContext>

        {/* Feedback Visual: Celda flotante elevada durante el arrastre */}
        <DragOverlay adjustScale={false}>
          {activeMeasure ? (
            <div className="scale-105 opacity-90 shadow-2xl ring-2 ring-purple-500 rounded-xl bg-white dark:bg-slate-900 pointer-events-none cursor-grabbing">
              <MeasureCell
                measure={activeMeasure}
                timeSignature={timeSignature}
                beatsPerMeasure={beatsPerMeasure}
                currentKey={currentKey}
                isSelected={false}
                isEditing={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal / Bottom Sheet Flotante del Compás Seleccionado en Modo Edición */}
      {isEditing && selectedMeasure && (
        <MeasureEditModal
          isOpen={!!selectedMeasure}
          onClose={() => setSelectedMeasureId(null)}
          selectedMeasure={selectedMeasure}
          measures={measures}
          sectionName={sectionName}
          currentKey={currentKey}
          timeSignature={timeSignature}
          diatonicChords={diatonicChords}
          onUpdateMeasure={handleUpdateMeasure}
          onUpdateAllMeasures={onUpdateMeasures}
          onDuplicate={handleDuplicate}
          onRemoveMeasure={onRemoveMeasure ? (id) => onRemoveMeasure(id) : undefined}
          onSplitMeasure={handleSplitMeasure}
          onApplyProgression={handleApplyProgressionFromHere}
          onToggleRepeat={handleToggleRepeat}
          onToggleVolta={handleToggleVolta}
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
