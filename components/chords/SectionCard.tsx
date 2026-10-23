'use client'

import React from 'react'
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SectionMeasures, Measure } from '@/types/measure'
import { getSectionBadge, getSectionChordsPreview } from '@/lib/measure-utils'
import { getDiatonicChords } from '@/lib/music-theory'
import { cn } from '@/lib/utils'
import { SectionKeyControl } from '@/components/chords/SectionKeyControl'
import { SectionRepeatControl } from '@/components/chords/SectionRepeatControl'
import { ProgressionPicker } from '@/components/chords/ProgressionPicker'
import { CadencePicker } from '@/components/chords/CadencePicker'
import { MeasureGrid } from '@/components/chords/MeasureGrid'

export interface SectionCardProps {
  section: SectionMeasures
  index: number
  totalSections: number
  isAdmin: boolean
  isEditing: boolean
  isCollapsed: boolean
  globalKey: string
  globalTimeSignature: string
  isPlaying?: boolean
  activeMeasureId?: string | null
  measureDurationMs?: number
  onToggleCollapse: (sectionId: string) => void
  onUpdateLabel?: (sectionId: string, label: string) => void
  onUpdateSectionKey?: (sectionId: string, newKey: string | null, transposeChords: boolean) => void
  onUpdateRepeatCount?: (sectionId: string, count: number) => void
  onApplyProgression?: (sectionId: string, prog: any) => void
  onApplySectionCadence?: (sectionId: string, cad: any) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  onDuplicate?: (sectionId: string) => void
  onRemove?: (sectionId: string) => void
  onUpdateGuideLyrics?: (sectionId: string, lyrics: string) => void
  onMeasureClick?: (measure: Measure) => void
  onUpdateMeasures?: (sectionId: string, measures: Measure[]) => void
  onAddMeasures?: (sectionId: string, count: number) => void
  onRemoveMeasure?: (sectionId: string, measureId: string) => void
  isOverlay?: boolean
}

export function SectionCard({
  section,
  index,
  totalSections,
  isAdmin,
  isEditing,
  isCollapsed,
  globalKey,
  globalTimeSignature,
  isPlaying = false,
  activeMeasureId = null,
  measureDurationMs,
  onToggleCollapse,
  onUpdateLabel,
  onUpdateSectionKey,
  onUpdateRepeatCount,
  onApplyProgression,
  onApplySectionCadence,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  onUpdateGuideLyrics,
  onMeasureClick,
  onUpdateMeasures,
  onAddMeasures,
  onRemoveMeasure,
  isOverlay = false,
}: SectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    disabled: !isAdmin || isOverlay,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const effectiveKey = section.keySignature || globalKey
  const sectionDiatonicChords = React.useMemo(() => {
    try {
      const res = getDiatonicChords(effectiveKey)
      return res.inKey.map((c) => `${c.root}${c.type}`)
    } catch {
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']
    }
  }, [effectiveKey])

  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  // Vista en DragOverlay mientras se arrastra (Tarjeta activa elevada)
  if (isOverlay) {
    return (
      <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-2xl ring-2 ring-purple-500 scale-[1.02] border border-purple-500/50 z-50 pointer-events-none cursor-grabbing opacity-95 transition-transform">
        <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1 -ml-1 text-purple-600 dark:text-purple-400">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs uppercase shrink-0">
                {getSectionBadge(section.type, section.label)}
              </div>
              <div>
                <h2 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                  {section.label}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-slate-400">
                    {section.measures.length} compases • {section.timeSignature || globalTimeSignature}
                  </span>
                  {section.repeatCount && section.repeatCount > 1 && (
                    <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md text-xs">
                      🔁 {section.repeatCount}x ({section.measures.length * section.repeatCount} compases)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de acordes para arrastre ultra fluido */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-400 text-[11px]">Acordes:</span>
          <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/80 text-xs">
            {getSectionChordsPreview(section)}
          </span>
        </div>
      </div>
    )
  }

  // Placeholder en la lista mientras la tarjeta está siendo arrastrada
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border-2 border-dashed border-purple-400/60 dark:border-purple-500/50 rounded-2xl bg-purple-500/10 min-h-[120px] transition-all flex items-center justify-center p-6 text-purple-600 dark:text-purple-300 font-semibold text-xs tracking-wider uppercase"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          <span>Soltar aquí ({section.label})</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`section-${section.id}`}
      className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all scroll-mt-28"
    >
      {/* Encabezado de la Sección */}
      <div
        className={cn(
          'pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2',
          isAdmin && 'touch-pan-y'
        )}
        {...(isAdmin ? attributes : {})}
        {...(isAdmin ? listeners : {})}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            {/* Tirador de Arrastre (GripVertical) solo para Administrador */}
            {isAdmin && (
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="p-1 -ml-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-grab active:cursor-grabbing touch-none rounded transition-colors shrink-0"
                title="Arrastrar para mover sección (en móvil mantén presionado)"
                aria-label="Reordenar sección"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}

            {/* Botón Acordeón Colapsar / Expandir */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse(section.id)
              }}
              onPointerDown={stopPropagation}
              onTouchStart={stopPropagation}
              onMouseDown={stopPropagation}
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors"
              title={isCollapsed ? 'Desplegar compases de esta sección' : 'Plegar compases de esta sección'}
              aria-label={isCollapsed ? 'Desplegar sección' : 'Plegar sección'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs uppercase shrink-0">
              {getSectionBadge(section.type, section.label)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <input
                    type="text"
                    value={section.label}
                    onChange={(e) => onUpdateLabel?.(section.id, e.target.value)}
                    onPointerDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    onMouseDown={stopPropagation}
                    className="font-black text-lg text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 -ml-1 leading-tight"
                  />
                ) : (
                  <h2 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                    {section.label}
                  </h2>
                )}

                {/* Badge de modulación en modo lectura */}
                {!isEditing && onUpdateSectionKey && (
                  <div
                    onPointerDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    onMouseDown={stopPropagation}
                  >
                    <SectionKeyControl
                      section={section}
                      globalKey={globalKey}
                      isEditing={false}
                      onUpdateSectionKey={onUpdateSectionKey}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-[11px] font-medium text-slate-400">
                  {section.measures.length} compases • {section.timeSignature || globalTimeSignature}
                </span>
                <div
                  onPointerDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  onMouseDown={stopPropagation}
                >
                  <SectionRepeatControl
                    repeatCount={section.repeatCount}
                    measuresCount={section.measures.length}
                    isEditing={isEditing}
                    onUpdateRepeatCount={(count) => onUpdateRepeatCount?.(section.id, count)}
                  />
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div
              onPointerDown={stopPropagation}
              onTouchStart={stopPropagation}
              onMouseDown={stopPropagation}
              className="flex items-center gap-2 flex-wrap justify-end"
            >
              {/* Controles de Tonalidad de Sección */}
              {onUpdateSectionKey && (
                <SectionKeyControl
                  section={section}
                  globalKey={globalKey}
                  isEditing={true}
                  onUpdateSectionKey={onUpdateSectionKey}
                />
              )}

              {/* Selector Desacoplado de Progresiones */}
              {onApplyProgression && (
                <ProgressionPicker
                  currentKey={effectiveKey}
                  buttonLabel="✦ Progresión de Sección"
                  buttonVariant="subtle"
                  onSelectProgression={(prog) => onApplyProgression(section.id, prog)}
                />
              )}

              {/* Selector Desacoplado de Cadencias al cierre de sección */}
              {onApplySectionCadence && (
                <CadencePicker
                  currentKey={effectiveKey}
                  currentCadenceId={section.measures[section.measures.length - 1]?.cadence}
                  buttonLabel="✦ Cadencia Final"
                  buttonVariant="subtle"
                  onSelectCadence={(cad) => onApplySectionCadence(section.id, cad)}
                />
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Mover Arriba */}
                <button
                  type="button"
                  onClick={() => onMoveUp?.(index)}
                  disabled={index === 0}
                  className={cn(
                    'p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700',
                    index === 0 && 'opacity-30 cursor-not-allowed pointer-events-none'
                  )}
                  title="Mover sección arriba"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* Mover Abajo */}
                <button
                  type="button"
                  onClick={() => onMoveDown?.(index)}
                  disabled={index === totalSections - 1}
                  className={cn(
                    'p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700',
                    index === totalSections - 1 && 'opacity-30 cursor-not-allowed pointer-events-none'
                  )}
                  title="Mover sección abajo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Duplicar Sección */}
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => onDuplicate(section.id)}
                    className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    title="Duplicar sección"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}

                {/* Eliminar Sección */}
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(section.id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    title="Eliminar sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vista Colapsada vs Vista Expandida */}
        {isCollapsed ? (
          /* Línea Resumen Compacta en Acordeón */
          <div className="pt-1 flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-400 text-[11px]">Acordes:</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/80 text-xs">
                {getSectionChordsPreview(section)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleCollapse(section.id)}
              onPointerDown={stopPropagation}
              onTouchStart={stopPropagation}
              onMouseDown={stopPropagation}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Desplegar compases</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            {/* Letra de Guía Rítmica / Frase Lírica de la Sección */}
            {isEditing ? (
              <div className="pt-0.5">
                <input
                  type="text"
                  value={section.guideLyrics || ''}
                  onChange={(e) => onUpdateGuideLyrics?.(section.id, e.target.value)}
                  onPointerDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  onMouseDown={stopPropagation}
                  placeholder="Añadir frase de letra de guía para esta sección (ej: 'Vengo a rendirme a tus pies...')"
                  className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 italic focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>
            ) : (
              section.guideLyrics?.trim() ? (
                <p className="text-xs sm:text-sm text-slate-400 italic mb-2 tracking-wide">
                  {section.guideLyrics.trim()}
                </p>
              ) : null
            )}
          </>
        )}
      </div>

      {/* Rejilla de Compases de esta sección (Solo si no está colapsada) */}
      {!isCollapsed && onUpdateMeasures && onAddMeasures && onRemoveMeasure && (
        <MeasureGrid
          measures={section.measures}
          timeSignature={section.timeSignature || globalTimeSignature}
          currentKey={effectiveKey}
          diatonicChords={sectionDiatonicChords}
          isEditing={isEditing}
          activeMeasureId={activeMeasureId}
          isPlaying={isPlaying}
          measureDurationMs={measureDurationMs}
          sectionName={section.label}
          sectionRepeatCount={section.repeatCount}
          onMeasureClick={(clickedMeasure) => onMeasureClick?.(clickedMeasure)}
          onUpdateMeasures={(updatedMeasures) => onUpdateMeasures(section.id, updatedMeasures)}
          onAddMeasures={(count) => onAddMeasures(section.id, count)}
          onRemoveMeasure={(measureId) => onRemoveMeasure(section.id, measureId)}
        />
      )}
    </div>
  )
}
