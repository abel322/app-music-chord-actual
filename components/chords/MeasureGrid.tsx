'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Measure, ChordBeat, LyricMeasureSegment } from '@/types/measure'
import {
  getBeatsPerMeasure,
  duplicateMeasure,
  duplicateMultipleMeasures,
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
import { Plus, Copy, Trash2 } from 'lucide-react'
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
  viewMode?: 'stage' | 'wide'
  isEditing?: boolean
  activeMeasureId?: string | null
  isPlaying?: boolean
  measureDurationMs?: number
  sectionName?: string
  sectionRepeatCount?: number
  currentRepeat?: number
  totalRepeats?: number
  nextSectionName?: string | null
  lyricSegments?: LyricMeasureSegment[]
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
  viewMode = 'stage',
  isEditing = false,
  activeMeasureId = null,
  isPlaying = false,
  measureDurationMs,
  sectionName,
  sectionRepeatCount = 1,
  currentRepeat = 1,
  totalRepeats,
  nextSectionName,
  lyricSegments,
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
  // Selección múltiple de compases para acciones en lote
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])
  const lastSelectedIdRef = useRef<string | null>(null)

  // Cierre opcional con tecla Escape en teclados físicos (limpia selección múltiple o cierra modal)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedBatchIds.length > 0) {
          setSelectedBatchIds([])
        } else if (selectedMeasureId) {
          setSelectedMeasureId(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedMeasureId, selectedBatchIds.length])

  const selectedMeasure = measures.find((m) => m.id === selectedMeasureId)

  // Actualizar un compás individual
  const handleUpdateMeasure = (updated: Measure) => {
    onUpdateMeasures(measures.map((m) => (m.id === updated.id ? updated : m)))
  }

  // Duplicar compás individual
  const handleDuplicate = (measureId: string) => {
    const duplicatedList = duplicateMeasure(measures, measureId)
    onUpdateMeasures(duplicatedList)
  }

  // Agrupar compases en bloques (sistemas musicales: 8 en modo stage, 4 en modo wide)
  const isStage = viewMode !== 'wide'
  const hasLyricSegments = Boolean(lyricSegments && lyricSegments.length > 0)
  // Si tiene segmentos de letra por compás, agrupamos en 4 compases por fila para que cada bloque alinee con su segmento
  const rowChunk = hasLyricSegments ? 4 : isStage ? 8 : 4

  const rows = useMemo(() => {
    const result: Measure[][] = []
    for (let i = 0; i < measures.length; i += rowChunk) {
      result.push(measures.slice(i, i + rowChunk))
    }
    return result
  }, [measures, rowChunk])

  // Duplicar los compases de una fila específica (insertándolos inmediatamente a continuación)
  const handleDuplicateRow = (rowIdx: number) => {
    const startIdx = rowIdx * rowChunk
    const rowMeasures = measures.slice(startIdx, startIdx + rowChunk)
    if (rowMeasures.length === 0) return
    const insertAt = startIdx + rowMeasures.length
    const updated = duplicateMultipleMeasures(measures, rowMeasures, insertAt)
    onUpdateMeasures(updated)
  }

  // Duplicar los últimos 4 compases de la sección
  const handleDuplicateLast4 = () => {
    if (measures.length < 4) return
    const last4 = measures.slice(-4)
    const updated = duplicateMultipleMeasures(measures, last4)
    onUpdateMeasures(updated)
  }

  // Alternar selección de un compás (soporte para Shift + Clic)
  const handleToggleSelectMeasure = (measureId: string, event?: React.MouseEvent) => {
    setSelectedBatchIds((prev) => {
      if (event?.shiftKey && lastSelectedIdRef.current) {
        const startIdx = measures.findIndex((m) => m.id === lastSelectedIdRef.current)
        const endIdx = measures.findIndex((m) => m.id === measureId)
        if (startIdx !== -1 && endIdx !== -1) {
          const from = Math.min(startIdx, endIdx)
          const to = Math.max(startIdx, endIdx)
          const rangeIds = measures.slice(from, to + 1).map((m) => m.id)
          return Array.from(new Set([...prev, ...rangeIds]))
        }
      }

      lastSelectedIdRef.current = measureId
      if (prev.includes(measureId)) {
        return prev.filter((id) => id !== measureId)
      } else {
        return [...prev, measureId]
      }
    })
  }

  // Duplicar compases seleccionados en lote
  const handleDuplicateSelected = () => {
    if (selectedBatchIds.length === 0) return
    const selectedMeasures = measures.filter((m) => selectedBatchIds.includes(m.id))
    if (selectedMeasures.length === 0) return

    const lastIdx = Math.max(...selectedBatchIds.map((id) => measures.findIndex((m) => m.id === id)))
    const insertAt = lastIdx !== -1 ? lastIdx + 1 : measures.length

    const updated = duplicateMultipleMeasures(measures, selectedMeasures, insertAt)
    onUpdateMeasures(updated)
    setSelectedBatchIds([])
  }

  // Eliminar compases seleccionados en lote
  const handleRemoveSelected = () => {
    if (selectedBatchIds.length === 0) return
    if (measures.length - selectedBatchIds.length < 1) {
      alert('Una sección debe conservar al menos 1 compás.')
      return
    }
    if (!confirm(`¿Eliminar los ${selectedBatchIds.length} compases seleccionados?`)) {
      return
    }

    const updated = measures
      .filter((m) => !selectedBatchIds.includes(m.id))
      .map((m, idx) => ({ ...m, measureNumber: idx + 1 }))

    onUpdateMeasures(updated)
    setSelectedBatchIds([])
  }

  const handleClearSelection = () => {
    setSelectedBatchIds([])
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
    const desktopCols = viewMode === 'wide' ? 4 : 8
    const mobileCols = viewMode === 'wide' ? 2 : 4

    for (let i = 0; i < measures.length; i++) {
      const m = measures[i]
      if (!m.cadence && !m.cadenceLabel && m.cadenceRole !== 'end') continue

      const rawLabel = m.cadenceLabel || m.cadence
      const { full: label, short: shortLabel } = getCadenceDisplayLabels(m.cadence, rawLabel)

      const isLastInRowDesktop = (i + 1) % desktopCols === 0 || i === measures.length - 1
      const isLastInRowMobile = (i + 1) % mobileCols === 0 || i === measures.length - 1

      // Si este compás está marcado expresamente como 'end' (receptor)
      if (m.cadenceRole === 'end') {
        const prevIdx = i - 1
        const prevM = prevIdx >= 0 ? measures[prevIdx] : null
        const wrapsOnDesktop = prevIdx >= 0 && prevIdx % desktopCols === desktopCols - 1
        const wrapsOnMobile = prevIdx >= 0 && prevIdx % mobileCols === mobileCols - 1
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
      const wrapsOnDesktop = i % desktopCols === desktopCols - 1
      const wrapsOnMobile = i % mobileCols === mobileCols - 1
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
        const nextIsLastDesktop = (i + 2) % desktopCols === 0 || i + 1 === measures.length - 1
        const nextIsLastMobile = (i + 2) % mobileCols === 0 || i + 1 === measures.length - 1
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
  }, [measures, timeSignature, viewMode])

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
          <div className={cn("w-full max-w-full", isPlaying ? "space-y-2" : "space-y-6")}>
            {rows.map((rowMeasures, rowIdx) => {
              const startIdx = rowIdx * rowChunk
              const hasBracket = rowMeasures.some((m) => cadenceBrackets[m.id])
              const rowStartMeasure = startIdx + 1
              const rowEndMeasure = startIdx + rowMeasures.length

              // Segmento de letra para este bloque de compases
              const matchingSegment = hasLyricSegments
                ? lyricSegments?.find(
                    (s) =>
                      (s.startMeasure <= rowStartMeasure && s.endMeasure >= rowStartMeasure) ||
                      (s.startMeasure >= rowStartMeasure && s.startMeasure <= rowEndMeasure)
                  )
                : null

              return (
                <div key={rowIdx} className="space-y-1 relative group/row">
                  {/* Franja de letra asignada a esta línea de compases (ej. C.1 - C.4 o C.5 - C.8) */}
                  {matchingSegment && matchingSegment.text.trim() && (
                    <div className="w-full whitespace-normal break-words leading-snug text-xs sm:text-sm text-cyan-100/95 bg-slate-900/85 px-3 py-1.5 rounded-t-lg border-x border-t border-slate-800 italic shadow-xs flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {matchingSegment.text.trim()}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded shrink-0 not-italic select-none">
                        C.{matchingSegment.startMeasure}–{matchingSegment.endMeasure}
                      </span>
                    </div>
                  )}

                  {/* Encabezado sutil de línea / sistema musical (Oculto cuando isPlaying === true o si ya tiene franja de letra) */}
                  {!isPlaying && (!matchingSegment || !matchingSegment.text.trim()) && (
                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500 dark:text-slate-400 text-[10px] tracking-wider uppercase">
                          Línea {rowIdx + 1}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          (C.{startIdx + 1} – C.{startIdx + rowMeasures.length})
                        </span>
                      </div>

                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(rowIdx)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 transition-all opacity-80 hover:opacity-100 cursor-pointer shadow-2xs"
                          title={`Duplicar estos ${rowMeasures.length} compases (C.${startIdx + 1}–C.${startIdx + rowMeasures.length})`}
                        >
                          <Copy className="w-3 h-3" />
                          <span className="truncate">Duplicar <span className="hidden sm:inline">estos </span>{rowMeasures.length} compases</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Grid de compases de esta línea */}
                  <div className={cn(
                    'grid w-full max-w-full pb-1',
                    hasLyricSegments
                      ? 'grid-cols-4 gap-1.5 sm:gap-2'
                      : (isStage ? 'grid-cols-4 md:grid-cols-8 gap-1.5 sm:gap-2' : 'grid-cols-2 md:grid-cols-4 gap-x-2.5 sm:gap-x-3.5'),
                    hasBracket ? 'pt-7 sm:pt-8 gap-y-8 sm:gap-y-9' : isStage ? (isPlaying ? 'pt-0 gap-y-1 sm:gap-y-1.5' : 'pt-1 gap-y-1.5 sm:gap-y-2') : 'pt-5 gap-y-7'
                  )}>
                    {rowMeasures.map((measure, mIdx) => {
                      const globalIndex = startIdx + mIdx
                      const isSelected = selectedMeasureId === measure.id
                      const isSelectedForBatch = selectedBatchIds.includes(measure.id)
                      const isActive = false
                      const prevMeasure = globalIndex > 0 ? measures[globalIndex - 1] : null
                      const bracket = cadenceBrackets[measure.id]
                      const isFirst = globalIndex === 0
                      const isLast = globalIndex === measures.length - 1
                      const sectionRepeatStart = isFirst && (sectionRepeatCount ?? 1) > 1 && !measure.repeatStart
                      const sectionRepeatEnd = isLast && (sectionRepeatCount ?? 1) > 1 && !measure.repeatEnd ? sectionRepeatCount : undefined

                      return (
                        <SortableMeasureCell
                          key={measure.id}
                          id={measure.id}
                          measure={measure}
                          timeSignature={timeSignature}
                          viewMode={viewMode}
                          beatsPerMeasure={beatsPerMeasure}
                          currentKey={currentKey}
                          isSelected={isSelected}
                          isSelectedForBatch={isSelectedForBatch}
                          isEditing={isEditing}
                          isActive={isActive}
                          isPlaying={isPlaying}
                          currentRepeat={currentRepeat}
                          totalRepeats={totalRepeats ?? sectionRepeatCount ?? 1}
                          nextSectionName={nextSectionName}
                          measureDurationMs={measureDurationMs}
                          prevMeasure={prevMeasure}
                          cadenceBracket={bracket}
                          sectionRepeatStart={sectionRepeatStart}
                          sectionRepeatEnd={sectionRepeatEnd}
                          onClick={() => {
                            if (isEditing) setSelectedMeasureId(measure.id)
                            onMeasureClick?.(measure)
                          }}
                          onToggleSelect={handleToggleSelectMeasure}
                          onDuplicate={isEditing ? handleDuplicate : undefined}
                          onRemove={isEditing && onRemoveMeasure ? onRemoveMeasure : undefined}
                          onRemoveCadence={isEditing ? handleRemoveCadence : undefined}
                        />
                      )
                    })}
                  </div>
                </div>
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

      {/* Barra de Acciones Flotante de Selección Múltiple (2 o más compases) */}
      {isEditing && selectedBatchIds.length >= 1 && (
        <div className="sticky bottom-3 z-30 flex items-center justify-between gap-3 p-3 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border border-purple-500/50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold text-purple-200">
              <strong className="text-white font-mono text-sm">{selectedBatchIds.length}</strong>{' '}
              {selectedBatchIds.length === 1 ? 'compás seleccionado' : 'compases seleccionados'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Duplicar los compases seleccionados en orden correlativo"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicar ({selectedBatchIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleRemoveSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Eliminar los compases seleccionados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar ({selectedBatchIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Botones rápidos para añadir compases en Modo Edición */}
      {isEditing && (
        <div className="flex flex-wrap items-center gap-2 mt-3 w-full">
          <span className="text-xs text-slate-400 font-semibold w-full sm:w-auto">Agregar compases a la sección:</span>
          {measures.length >= 4 && (
            <button
              type="button"
              onClick={handleDuplicateLast4}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Duplica los últimos 4 compases de la sección y los añade al final con numeración correlativa"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>📋 Duplicar últimos 4 compases</span>
            </button>
          )}
          {onAddMeasures && (
            <>
              <button
                type="button"
                onClick={() => onAddMeasures(4)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> +4 Compases
              </button>
              <button
                type="button"
                onClick={() => onAddMeasures(8)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> +8 Compases
              </button>
              <button
                type="button"
                onClick={() => onAddMeasures(1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> +1 Compás
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
