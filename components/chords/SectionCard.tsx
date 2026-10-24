'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from 'lucide-react'
import { SectionMeasures, Measure } from '@/types/measure'
import { getSectionBadge, getSectionChordsPreview } from '@/lib/measure-utils'
import { getDiatonicChords } from '@/lib/music-theory'
import { cn } from '@/lib/utils'
import { SectionKeyControl } from '@/components/chords/SectionKeyControl'
import { SectionRepeatControl } from '@/components/chords/SectionRepeatControl'
import { SectionTempoControl } from '@/components/chords/SectionTempoControl'
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
  globalTempo?: number
  isPlaying?: boolean
  activeMeasureId?: string | null
  measureDurationMs?: number
  onToggleCollapse: (sectionId: string) => void
  onUpdateLabel?: (sectionId: string, label: string) => void
  onUpdateSectionKey?: (sectionId: string, newKey: string | null, transposeChords: boolean) => void
  onUpdateSectionTempo?: (sectionId: string, tempo: number | null) => void
  onUpdateRepeatCount?: (sectionId: string, count: number) => void
  onApplyProgression?: (sectionId: string, prog: any) => void
  onApplySectionCadence?: (sectionId: string, cad: any) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  onDuplicate?: (sectionId: string) => void
  onRemove?: (sectionId: string) => void
  onUpdateGuideLyrics?: (sectionId: string, lyrics: string) => void
  onUpdateLyrics?: (sectionId: string, lyrics: string) => void
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
  globalTempo = 120,
  isPlaying = false,
  activeMeasureId = null,
  measureDurationMs,
  onToggleCollapse,
  onUpdateLabel,
  onUpdateSectionKey,
  onUpdateSectionTempo,
  onUpdateRepeatCount,
  onApplyProgression,
  onApplySectionCadence,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  onUpdateGuideLyrics,
  onUpdateLyrics,
  onMeasureClick,
  onUpdateMeasures,
  onAddMeasures,
  onRemoveMeasure,
}: SectionCardProps) {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false)

  const effectiveKey = section.keySignature || globalKey
  const sectionDiatonicChords = React.useMemo(() => {
    try {
      const res = getDiatonicChords(effectiveKey)
      return res.inKey.map((c) => `${c.root}${c.type}`)
    } catch {
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']
    }
  }, [effectiveKey])

  const hasLyrics = !!(section.lyrics && section.lyrics.trim().length > 0)
  const lineCount = hasLyrics ? section.lyrics!.trim().split('\n').filter(Boolean).length : 0

  return (
    <div
      id={`section-${section.id}`}
      className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all scroll-mt-28"
    >
      {/* Encabezado de la Sección */}
      <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            {/* Botón Acordeón Colapsar / Expandir */}
            <button
              type="button"
              onClick={() => onToggleCollapse(section.id)}
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
                    className="font-black text-lg text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 -ml-1 leading-tight"
                  />
                ) : (
                  <h2 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                    {section.label}
                  </h2>
                )}

                {/* Badge de modulación en modo lectura */}
                {!isEditing && onUpdateSectionKey && (
                  <div>
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
                <div>
                  <SectionRepeatControl
                    repeatCount={section.repeatCount}
                    measuresCount={section.measures.length}
                    isEditing={isEditing}
                    onUpdateRepeatCount={(count) => onUpdateRepeatCount?.(section.id, count)}
                  />
                </div>
                {/* Badge visible de tempo personalizado */}
                {section.tempoOverride && (
                  <div>
                    <SectionTempoControl
                      sectionId={section.id}
                      tempoOverride={section.tempoOverride}
                      globalTempo={globalTempo}
                      isEditing={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra de herramientas en modo edición */}
          {isEditing && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Controles de Tonalidad de Sección */}
              {onUpdateSectionKey && (
                <SectionKeyControl
                  section={section}
                  globalKey={globalKey}
                  isEditing={true}
                  onUpdateSectionKey={onUpdateSectionKey}
                />
              )}

              {/* Controles de Tempo de Sección (BPM Override) */}
              {onUpdateSectionTempo && (
                <SectionTempoControl
                  sectionId={section.id}
                  tempoOverride={section.tempoOverride}
                  globalTempo={globalTempo}
                  isEditing={true}
                  onUpdateSectionTempo={onUpdateSectionTempo}
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

              {/* Botón Discreto para Letra de la Sección (Single Source of Truth) */}
              <button
                type="button"
                onClick={() => setIsLyricsOpen((prev) => !prev)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 cursor-pointer shadow-xs',
                  hasLyrics
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80 hover:bg-purple-100'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600 hover:border-purple-300 dark:hover:text-purple-300'
                )}
                title={hasLyrics ? 'Ver o editar letra lírica de esta sección' : 'Añadir letra lírica a esta sección'}
              >
                <span>📝 Letra de la sección</span>
                {hasLyrics ? (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    {lineCount} {lineCount === 1 ? 'verso' : 'versos'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">(vacío)</span>
                )}
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Botones discretos de reordenamiento (solo para Administrador) */}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => onMoveUp?.(index)}
                      disabled={index === 0}
                      className={cn(
                        'p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700',
                        index === 0 && 'opacity-30 cursor-not-allowed pointer-events-none'
                      )}
                      title="Mover sección arriba (↑)"
                      aria-label="Mover sección arriba"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onMoveDown?.(index)}
                      disabled={index === totalSections - 1}
                      className={cn(
                        'p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700',
                        index === totalSections - 1 && 'opacity-30 cursor-not-allowed pointer-events-none'
                      )}
                      title="Mover sección abajo (↓)"
                      aria-label="Mover sección abajo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Duplicar Sección */}
                {isAdmin && onDuplicate && (
                  <button
                    type="button"
                    onClick={() => onDuplicate(section.id)}
                    className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    title="Duplicar sección"
                    aria-label="Duplicar sección"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}

                {/* Eliminar Sección */}
                {isAdmin && onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(section.id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    title="Eliminar sección"
                    aria-label="Eliminar sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Botones discretos en modo lectura (solo para Administrador o con Letra) */}
          {!isEditing && (
            <div className="flex items-center gap-2 shrink-0 justify-end flex-wrap">
              {/* Botón Ver Letra en Lectura si existe */}
              {hasLyrics && (
                <button
                  type="button"
                  onClick={() => setIsLyricsOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition-colors shrink-0 cursor-pointer"
                  title="Ver letra lírica de esta sección"
                >
                  <span>📝 Letra</span>
                  <span className="text-[10px] font-bold">({lineCount})</span>
                </button>
              )}

              {/* Botones de movimiento de sección */}
              {isAdmin && (onMoveUp || onMoveDown) && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {onMoveUp && (
                    <button
                      type="button"
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      className={cn(
                        'p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-800',
                        index === 0 && 'opacity-30 cursor-not-allowed pointer-events-none'
                      )}
                      title="Mover sección arriba (↑)"
                      aria-label="Mover sección arriba"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}
                  {onMoveDown && (
                    <button
                      type="button"
                      onClick={() => onMoveDown(index)}
                      disabled={index === totalSections - 1}
                      className={cn(
                        'p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-800',
                        index === totalSections - 1 && 'opacity-30 cursor-not-allowed pointer-events-none'
                      )}
                      title="Mover sección abajo (↓)"
                      aria-label="Mover sección abajo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Área Desplegable de Letra de la Sección (Single Source of Truth) */}
        {isLyricsOpen && (
          <div className="pt-2.5 pb-1 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>📝 Letra de {section.label}</span>
                </span>
                {hasLyrics ? (
                  <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                    • {lineCount} {lineCount === 1 ? 'verso' : 'versos'}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    (Sección actualmente considerada instrumental)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsLyricsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={section.lyrics || ''}
                onChange={(e) => onUpdateLyrics?.(section.id, e.target.value)}
                placeholder="Escribe o pega aquí la letra para esta sección (ej. versos del coro)..."
                rows={Math.max(3, Math.min(10, (section.lyrics || '').split('\n').length + 1))}
                className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-sans leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y transition-all"
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {section.lyrics?.trim() || (
                  <span className="italic text-slate-400">Sin letra asignada (Sección instrumental)</span>
                )}
              </div>
            )}
          </div>
        )}

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
