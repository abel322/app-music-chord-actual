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
  currentRepeat?: number
  totalRepeats?: number
  nextSectionName?: string | null
  isSectionActive?: boolean
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
  currentRepeat,
  totalRepeats,
  nextSectionName,
  isSectionActive,
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

  const isThisSectionActive =
    isSectionActive ??
    (isPlaying && Boolean(activeMeasureId && section.measures.some((m) => m.id === activeMeasureId)))
  const effectiveCurrentRepeat = isThisSectionActive ? (currentRepeat ?? 1) : 1
  const effectiveTotalRepeats = totalRepeats ?? section.repeatCount ?? 1
  const effectiveNextSectionName = nextSectionName

  return (
    <div
      id={`section-${section.id}`}
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all scroll-mt-28 relative"
    >
      {/* 2. Cabecera de Sección Adhesiva (Sticky Section Header Contextual) */}
      <div className="sticky top-12 z-30 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md py-2 px-3 border-b border-slate-800/80 rounded-t-2xl flex items-center justify-between gap-2.5 text-white shadow-sm flex-wrap">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Botón Acordeón Colapsar / Expandir */}
          <button
            type="button"
            onClick={() => onToggleCollapse(section.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title={isCollapsed ? 'Desplegar compases de esta sección' : 'Plegar compases de esta sección'}
            aria-label={isCollapsed ? 'Desplegar sección' : 'Plegar sección'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-300" />
            )}
          </button>

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-300 font-bold text-xs uppercase shrink-0">
            {getSectionBadge(section.type, section.label)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditing ? (
                <input
                  type="text"
                  value={section.label}
                  onChange={(e) => onUpdateLabel?.(section.id, e.target.value)}
                  className="font-black text-base sm:text-lg text-white bg-slate-800/80 border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1.5 -ml-1 leading-tight max-w-[130px] sm:max-w-[200px]"
                />
              ) : (
                <h2 className="font-black text-base sm:text-lg text-white leading-tight truncate">
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
              <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                {section.measures.length} compases • {section.timeSignature || globalTimeSignature}
              </span>

              {/* Monitor / Badge de Vueltas en Reproducción Activa */}
              {isThisSectionActive && isPlaying && effectiveTotalRepeats > 1 ? (
                effectiveCurrentRepeat === effectiveTotalRepeats ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-xs font-black shadow-md animate-pulse shrink-0">
                    <span>⚠️ ÚLTIMA VUELTA</span>
                    {effectiveNextSectionName && (
                      <span className="bg-amber-300 px-1.5 py-0.2 rounded text-[10px] font-black">
                        → Viene {effectiveNextSectionName}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-700 text-white rounded-full text-xs font-bold shadow-md shrink-0">
                    <span>🔁 Vuelta {effectiveCurrentRepeat}/{effectiveTotalRepeats}</span>
                  </div>
                )
              ) : (
                <div>
                  <SectionRepeatControl
                    repeatCount={section.repeatCount}
                    measuresCount={section.measures.length}
                    isEditing={isEditing}
                    onUpdateRepeatCount={(count) => onUpdateRepeatCount?.(section.id, count)}
                  />
                </div>
              )}

              {/* Badge visible de tempo personalizado solo en modo lectura para evitar duplicidad */}
              {!isEditing && section.tempoOverride && (
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

        {/* Acciones de administración de sección en la cabecera (Reordenar / Duplicar / Eliminar) */}
        {isEditing && (
          <div className="flex items-center gap-1 shrink-0 justify-end">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => onMoveUp?.(index)}
                  disabled={index === 0}
                  className={cn(
                    'p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 cursor-pointer',
                    index === 0 && 'opacity-30 cursor-not-allowed pointer-events-none'
                  )}
                  title="Mover sección arriba (↑)"
                  aria-label="Mover sección arriba"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onMoveDown?.(index)}
                  disabled={index === totalSections - 1}
                  className={cn(
                    'p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 cursor-pointer',
                    index === totalSections - 1 && 'opacity-30 cursor-not-allowed pointer-events-none'
                  )}
                  title="Mover sección abajo (↓)"
                  aria-label="Mover sección abajo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Duplicar Sección */}
            {isAdmin && onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(section.id)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                title="Duplicar sección"
                aria-label="Duplicar sección"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Eliminar Sección */}
            {isAdmin && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(section.id)}
                className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                title="Eliminar sección"
                aria-label="Eliminar sección"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Botones discretos en modo lectura */}
        {!isEditing && (
          <div className="flex items-center gap-2 shrink-0 justify-end flex-wrap">
            {hasLyrics && (
              <button
                type="button"
                onClick={() => setIsLyricsOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/80 hover:bg-purple-900/60 transition-colors shrink-0 cursor-pointer"
                title="Ver letra lírica de esta sección"
              >
                <span>📝 Letra</span>
                <span className="text-[10px] font-bold">({lineCount})</span>
              </button>
            )}

            {isAdmin && (onMoveUp || onMoveDown) && (
              <div className="flex items-center gap-1 shrink-0">
                {onMoveUp && (
                  <button
                    type="button"
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                    className={cn(
                      'p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700',
                      index === 0 && 'opacity-30 cursor-not-allowed pointer-events-none'
                    )}
                    title="Mover sección arriba (↑)"
                    aria-label="Mover sección arriba"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    type="button"
                    onClick={() => onMoveDown(index)}
                    disabled={index === totalSections - 1}
                    className={cn(
                      'p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700',
                      index === totalSections - 1 && 'opacity-30 cursor-not-allowed pointer-events-none'
                    )}
                    title="Mover sección abajo (↓)"
                    aria-label="Mover sección abajo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cuerpo de la Sección */}
      <div className="p-3 sm:p-5 space-y-3">
        {/* Barra de Herramientas de Edición de Sección (Visible solo en Modo Edición / Admin) */}
        {isEditing && (
          <div className="w-full bg-slate-900/40 dark:bg-slate-950/40 rounded-xl p-2.5 my-2 border border-slate-800/80 space-y-2">
            {/* FILA 1: Tono y Tempo de la sección */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Selector de Tono local */}
              {onUpdateSectionKey && (
                <div className="flex items-center gap-1 flex-wrap">
                  <SectionKeyControl
                    section={section}
                    globalKey={globalKey}
                    isEditing={true}
                    onUpdateSectionKey={onUpdateSectionKey}
                  />
                </div>
              )}

              {/* Control de Tempo local */}
              {onUpdateSectionTempo && (
                <div className="flex items-center gap-1 flex-wrap">
                  <SectionTempoControl
                    sectionId={section.id}
                    tempoOverride={section.tempoOverride}
                    globalTempo={globalTempo}
                    isEditing={true}
                    onUpdateSectionTempo={onUpdateSectionTempo}
                  />
                </div>
              )}
            </div>

            {/* FILA 2: Acciones avanzadas (Progresión, Cadencia, Letra) con flex-wrap */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800/60">
              {/* Botón Progresión */}
              {onApplyProgression && (
                <div className="w-full sm:w-auto">
                  <ProgressionPicker
                    currentKey={effectiveKey}
                    buttonLabel="✨ Progresión"
                    buttonVariant="subtle"
                    className="w-full sm:w-auto"
                    onSelectProgression={(prog) => onApplyProgression(section.id, prog)}
                  />
                </div>
              )}

              {/* Botón Cadencia */}
              {onApplySectionCadence && (
                <div className="w-full sm:w-auto">
                  <CadencePicker
                    currentKey={effectiveKey}
                    currentCadenceId={section.measures[section.measures.length - 1]?.cadence}
                    buttonLabel="🏷️ Cadencia"
                    buttonVariant="subtle"
                    className="w-full sm:w-auto"
                    onSelectCadence={(cad) => onApplySectionCadence(section.id, cad)}
                  />
                </div>
              )}

              {/* Botón Letra de la Sección */}
              <button
                type="button"
                onClick={() => setIsLyricsOpen((prev) => !prev)}
                className={cn(
                  'col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer w-full sm:w-auto',
                  hasLyrics
                    ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
                )}
                title={hasLyrics ? 'Ver o editar letra lírica de esta sección' : 'Añadir letra lírica a esta sección'}
              >
                <span>📝 Letra de la sección</span>
                {hasLyrics && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-900 text-purple-200">
                    {lineCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
        {/* Área Desplegable de Letra de la Sección (Single Source of Truth) */}
        {isLyricsOpen && (
          <div className="pt-2 pb-1 border-b border-slate-100 dark:border-slate-800/80 animate-in fade-in space-y-2">
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
                <p className="text-xs sm:text-sm text-slate-400 italic mb-1 tracking-wide">
                  {section.guideLyrics.trim()}
                </p>
              ) : null
            )}

            {/* Rejilla de Compases de esta sección (Solo si no está colapsada) */}
            {onUpdateMeasures && onAddMeasures && onRemoveMeasure && (
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
                currentRepeat={effectiveCurrentRepeat}
                totalRepeats={effectiveTotalRepeats}
                nextSectionName={effectiveNextSectionName}
                onMeasureClick={(clickedMeasure) => onMeasureClick?.(clickedMeasure)}
                onUpdateMeasures={(updatedMeasures) => onUpdateMeasures(section.id, updatedMeasures)}
                onAddMeasures={(count) => onAddMeasures(section.id, count)}
                onRemoveMeasure={(measureId) => onRemoveMeasure(section.id, measureId)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
