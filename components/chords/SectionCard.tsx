'use client'

import React, { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Plus,
  Scissors,
  Link2,
} from 'lucide-react'
import { SectionMeasures, Measure, SectionLyricPass, LyricMeasureSegment } from '@/types/measure'
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
  viewMode?: 'stage' | 'wide'
  isPlaying?: boolean
  activeMeasureId?: string | null
  currentBeatIndex?: number | null
  measureDurationMs?: number
  currentRepeat?: number
  totalRepeats?: number
  currentPassIndex?: number
  totalPasses?: number
  onAdvancePass?: (sectionId: string) => void
  onSelectPass?: (sectionId: string, passIndex: number) => void
  onUpdateLyricPasses?: (sectionId: string, passes: SectionLyricPass[], repeatCycles?: number) => void
  nextSectionName?: string | null
  isSectionActive?: boolean
  onToggleCollapse: (sectionId: string) => void
  onSectionFocus?: (sectionId: string) => void
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
  viewMode = 'stage',
  isPlaying = false,
  activeMeasureId = null,
  currentBeatIndex = null,
  measureDurationMs,
  currentRepeat,
  totalRepeats,
  currentPassIndex,
  totalPasses,
  onAdvancePass,
  onSelectPass,
  onUpdateLyricPasses,
  nextSectionName,
  isSectionActive,
  onToggleCollapse,
  onSectionFocus,
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
  const [activeEditPassIdx, setActiveEditPassIdx] = useState(0)

  const effectiveKey = section.keySignature || globalKey
  const sectionDiatonicChords = React.useMemo(() => {
    try {
      const res = getDiatonicChords(effectiveKey)
      return res.inKey.map((c) => `${c.root}${c.type}`)
    } catch {
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']
    }
  }, [effectiveKey])

  // Normalizar vueltas de letra (SectionLyricPass[])
  const effectiveLyricPasses: SectionLyricPass[] = useMemo(() => {
    if (section.lyricPasses && section.lyricPasses.length > 0) {
      return section.lyricPasses
    }
    if ((section.lyrics && section.lyrics.trim().length > 0) || (section.segments && section.segments.length > 0)) {
      return [
        {
          id: 'pass-1',
          label: 'Vuelta 1',
          lyrics: section.lyrics?.trim() || '',
          segments: section.segments,
        },
      ]
    }
    return []
  }, [section.lyricPasses, section.lyrics, section.segments])

  const passesCount = Math.max(1, effectiveLyricPasses.length)
  const cyclesCount = Math.max(
    1,
    section.repeatCycles ||
      (effectiveLyricPasses.length > 1
        ? Math.max(1, Math.round((section.repeatCount || 1) / passesCount))
        : section.repeatCount || 1)
  )
  const calculatedTotalPasses = totalPasses ?? passesCount * cyclesCount
  const effectiveCurrentPassIndex = currentPassIndex ?? 0
  const activePassIndexInCycle =
    effectiveLyricPasses.length > 0
      ? effectiveCurrentPassIndex % effectiveLyricPasses.length
      : 0
  const activePassLyrics =
    effectiveLyricPasses[activePassIndexInCycle]?.lyrics ?? section.lyrics ?? ''

  // Segmentos activos para la vuelta en curso (o de la sección)
  const activePassSegments =
    effectiveLyricPasses[activePassIndexInCycle]?.segments || section.segments || []
  const hasActiveSegments =
    activePassSegments.length > 0 && activePassSegments.some((s) => s.text.trim().length > 0)

  // Segmentos de la vuelta en edición activa
  const currentEditPass =
    effectiveLyricPasses[activeEditPassIdx] || effectiveLyricPasses[0] || null
  const currentEditSegments = currentEditPass?.segments || []
  const hasEditSegments = currentEditSegments.length > 0

  const hasAnyLyrics =
    effectiveLyricPasses.some((p) => p.lyrics.trim().length > 0 || (p.segments && p.segments.length > 0)) ||
    !!(section.lyrics && section.lyrics.trim().length > 0) ||
    hasActiveSegments
  const lineCount = hasAnyLyrics
    ? activePassLyrics.trim().split('\n').filter(Boolean).length || 1
    : 0

  const isThisSectionActive =
    isSectionActive ??
    (isPlaying && Boolean(activeMeasureId && section.measures.some((m) => m.id === activeMeasureId)))
  const isCurrentlyPlayingSection = Boolean(isThisSectionActive && isPlaying)
  const effectiveCurrentRepeat = isThisSectionActive ? effectiveCurrentPassIndex + 1 : 1
  const effectiveTotalRepeats = calculatedTotalPasses
  const effectiveNextSectionName = nextSectionName
  const effectiveIsCollapsed = isPlaying ? false : isCollapsed

  const blockSummary = useMemo(() => {
    const totalMeasures = section.measures.length * calculatedTotalPasses
    if (passesCount <= 1) {
      return `Repetir ${cyclesCount}x • ${cyclesCount} ${cyclesCount === 1 ? 'vuelta' : 'vueltas'} (${totalMeasures} compases)`
    }
    const cycleLetters = effectiveLyricPasses
      .map((_, i) => String.fromCharCode(65 + i))
      .join('→')
    return `Ciclo ${cycleLetters} × ${cyclesCount}x • ${calculatedTotalPasses} vueltas (${totalMeasures} compases)`
  }, [passesCount, cyclesCount, calculatedTotalPasses, section.measures.length, effectiveLyricPasses])

  const handleUpdateCurrentPassLyrics = (newLyrics: string) => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: '' }]

    const targetIdx = Math.max(0, Math.min(activeEditPassIdx, currentPasses.length - 1))
    currentPasses[targetIdx] = {
      ...currentPasses[targetIdx],
      lyrics: newLyrics,
    }

    onUpdateLyricPasses?.(section.id, currentPasses, cyclesCount)
    if (targetIdx === 0) {
      onUpdateLyrics?.(section.id, newLyrics)
    }
  }

  const handleSplitCurrentPassIntoSegments = () => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]

    const targetIdx = Math.max(0, Math.min(activeEditPassIdx, currentPasses.length - 1))
    const currentPass = currentPasses[targetIdx]
    const currentLyrics = currentPass?.lyrics || ''
    const lines = currentLyrics
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const totalMeasures = Math.max(4, section.measures.length)
    const numBlocks = Math.max(1, Math.ceil(totalMeasures / 4))
    const linesPerBlock = Math.max(1, Math.ceil(lines.length / numBlocks))

    const newSegments: LyricMeasureSegment[] = []
    for (let i = 0; i < totalMeasures; i += 4) {
      const start = i + 1
      const end = Math.min(totalMeasures, i + 4)
      const blockIdx = Math.floor(i / 4)
      const blockLines = lines.slice(blockIdx * linesPerBlock, (blockIdx + 1) * linesPerBlock)
      newSegments.push({
        id: `seg-${Date.now()}-${blockIdx + 1}`,
        startMeasure: start,
        endMeasure: end,
        text: blockLines.join('\n'),
      })
    }

    currentPasses[targetIdx] = {
      ...currentPass,
      segments: newSegments,
      lyrics: newSegments.map((s) => s.text).filter(Boolean).join('\n'),
    }

    onUpdateLyricPasses?.(section.id, currentPasses, cyclesCount)
    if (targetIdx === 0) {
      onUpdateLyrics?.(section.id, currentPasses[0].lyrics)
    }
  }

  const handleJoinSegmentsIntoSingleBlock = () => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]

    const targetIdx = Math.max(0, Math.min(activeEditPassIdx, currentPasses.length - 1))
    const currentPass = currentPasses[targetIdx]
    const joinedText = currentPass.segments
      ? currentPass.segments.map((s) => s.text).filter(Boolean).join('\n')
      : currentPass.lyrics

    currentPasses[targetIdx] = {
      ...currentPass,
      segments: undefined,
      lyrics: joinedText,
    }

    onUpdateLyricPasses?.(section.id, currentPasses, cyclesCount)
    if (targetIdx === 0) {
      onUpdateLyrics?.(section.id, joinedText)
    }
  }

  const handleUpdateSegmentText = (segId: string, newText: string) => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]

    const targetIdx = Math.max(0, Math.min(activeEditPassIdx, currentPasses.length - 1))
    const currentPass = currentPasses[targetIdx]
    const currentSegments = currentPass.segments || []

    const updatedSegments = currentSegments.map((s) =>
      s.id === segId ? { ...s, text: newText } : s
    )

    currentPasses[targetIdx] = {
      ...currentPass,
      segments: updatedSegments,
      lyrics: updatedSegments.map((s) => s.text).filter(Boolean).join('\n'),
    }

    onUpdateLyricPasses?.(section.id, currentPasses, cyclesCount)
    if (targetIdx === 0) {
      onUpdateLyrics?.(section.id, currentPasses[0].lyrics)
    }
  }

  const handleUpdateSegmentRange = (segId: string, start: number, end: number) => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]

    const targetIdx = Math.max(0, Math.min(activeEditPassIdx, currentPasses.length - 1))
    const currentPass = currentPasses[targetIdx]
    const currentSegments = currentPass.segments || []

    const updatedSegments = currentSegments.map((s) =>
      s.id === segId ? { ...s, startMeasure: Math.max(1, start), endMeasure: Math.max(start, end) } : s
    )

    currentPasses[targetIdx] = {
      ...currentPass,
      segments: updatedSegments,
    }

    onUpdateLyricPasses?.(section.id, currentPasses, cyclesCount)
  }

  const handleAddSegmentBlock = () => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]

    const targetIdx = Math.max(0, Math.min(activeEditPassIdx, currentPasses.length - 1))
    const currentPass = currentPasses[targetIdx]
    const currentSegments = currentPass.segments || []

    const lastSeg = currentSegments[currentSegments.length - 1]
    const nextStart = lastSeg ? lastSeg.endMeasure + 1 : 1
    const nextEnd = nextStart + 3
    const newSeg: LyricMeasureSegment = {
      id: `seg-${Date.now()}-${currentSegments.length + 1}`,
      startMeasure: nextStart,
      endMeasure: nextEnd,
      text: '',
    }

    const updatedSegments = [...currentSegments, newSeg]
    currentPasses[targetIdx] = {
      ...currentPass,
      segments: updatedSegments,
    }

    onUpdateLyricPasses?.(section.id, currentPasses, cyclesCount)
  }

  const handleRemoveSegmentBlock = (segId: string) => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]

    const targetIdx = Math.max(0, Math.min(activeEditPassIdx, currentPasses.length - 1))
    const currentPass = currentPasses[targetIdx]
    const currentSegments = currentPass.segments || []
    if (currentSegments.length <= 1) return

    const updatedSegments = currentSegments.filter((s) => s.id !== segId)
    currentPasses[targetIdx] = {
      ...currentPass,
      segments: updatedSegments,
      lyrics: updatedSegments.map((s) => s.text).filter(Boolean).join('\n'),
    }

    onUpdateLyricPasses?.(section.id, currentPasses, cyclesCount)
    if (targetIdx === 0) {
      onUpdateLyrics?.(section.id, currentPasses[0].lyrics)
    }
  }

  const handleAddLyricPass = () => {
    const currentPasses: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? [...effectiveLyricPasses]
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]

    const nextNumber = currentPasses.length + 1
    const newPass: SectionLyricPass = {
      id: `pass-${Date.now()}-${nextNumber}`,
      label: `Vuelta ${nextNumber}`,
      lyrics: '',
    }
    const nextPasses = [...currentPasses, newPass]
    onUpdateLyricPasses?.(section.id, nextPasses, cyclesCount)
    setActiveEditPassIdx(nextPasses.length - 1)
  }

  const handleRemoveLyricPass = (passIdxToRemove: number) => {
    if (effectiveLyricPasses.length <= 1) return
    const filtered = effectiveLyricPasses.filter((_, idx) => idx !== passIdxToRemove)
    const renamed = filtered.map((p, idx) => ({
      ...p,
      label: `Vuelta ${idx + 1}`,
    }))
    onUpdateLyricPasses?.(section.id, renamed, cyclesCount)
    setActiveEditPassIdx((prev) => Math.max(0, Math.min(prev, renamed.length - 1)))
    if (renamed[0]) {
      onUpdateLyrics?.(section.id, renamed[0].lyrics)
    }
  }

  const handleSelectCycle = (newCycles: number) => {
    const passes: SectionLyricPass[] =
      effectiveLyricPasses.length > 0
        ? effectiveLyricPasses
        : [{ id: 'pass-1', label: 'Vuelta 1', lyrics: section.lyrics || '' }]
    onUpdateLyricPasses?.(section.id, passes, newCycles)
    onUpdateRepeatCount?.(section.id, passes.length * newCycles)
  }

  return (
    <div
      id={`section-${section.id}`}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('input, textarea, select, button')) return
        onSectionFocus?.(section.id)
      }}
      className={cn(
        'rounded-2xl transition-all scroll-mt-20 relative',
        isThisSectionActive
          ? 'ring-2 ring-cyan-400 border-2 border-cyan-400/80 bg-slate-900/95 shadow-[0_0_25px_rgba(34,211,238,0.15)]'
          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm'
      )}
    >
      {/* 2. Cabecera de Sección Adhesiva (Sticky Section Header Contextual) */}
      <div className={cn(
        "sticky top-[76px] z-30 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b rounded-t-2xl flex items-center justify-between text-white shadow-sm transition-all",
        isPlaying ? "py-1 px-2.5 min-h-[28px] gap-2" : "py-1.5 px-3 flex-wrap gap-2.5",
        isThisSectionActive ? "border-cyan-500/40" : "border-slate-800/80"
      )}>
        {isPlaying ? (
          /* MODO EN REPRODUCCIÓN: Barra superior miniaturizada a 1 sola línea delgada (py-1 px-2.5 min-h-[28px]) */
          <>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <div className="w-5 h-5 rounded bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-300 font-bold text-[9px] uppercase shrink-0">
                {getSectionBadge(section.type, section.label)}
              </div>

              <h2 className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[240px] uppercase">
                {section.label}
              </h2>

              {isThisSectionActive && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-sm shrink-0">
                  ● EN CURSO
                </span>
              )}
            </div>

            {/* Selector de repeticiones reemplazado por badge estático pequeño o contador grande de vuelta */}
            <div className="flex items-center gap-1.5 shrink-0">
              {calculatedTotalPasses > 1 ? (
                <button
                  type="button"
                  onClick={() => onAdvancePass?.(section.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono font-black text-xs shadow-xs cursor-pointer select-none active:scale-95 transition-all',
                    effectiveCurrentPassIndex === calculatedTotalPasses - 1
                      ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  )}
                  title="Toca para avanzar a la siguiente vuelta"
                >
                  <span>{effectiveCurrentPassIndex === calculatedTotalPasses - 1 ? '⚠️ VUELTA' : 'VUELTA'}</span>
                  <span className="text-sm font-black">
                    {effectiveCurrentPassIndex + 1}/{calculatedTotalPasses}
                  </span>
                  {effectiveCurrentPassIndex === calculatedTotalPasses - 1 && effectiveNextSectionName && (
                    <span className="text-[10px] opacity-90 hidden sm:inline">→ {effectiveNextSectionName}</span>
                  )}
                </button>
              ) : (
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold select-none bg-slate-800 text-slate-400 border border-slate-700/60"
                  title="1 vuelta"
                >
                  1x
                </span>
              )}
            </div>
          </>
        ) : (
          /* MODO PAUSADO / NORMAL: Cabecera completa con controles de edición, letra y selector de repeticiones */
          <>
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              {/* Botón Acordeón Colapsar / Expandir */}
              <button
                type="button"
                onClick={() => onToggleCollapse(section.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title={effectiveIsCollapsed ? 'Desplegar compases de esta sección' : 'Plegar compases de esta sección'}
                aria-label={effectiveIsCollapsed ? 'Desplegar sección' : 'Plegar sección'}
              >
                {effectiveIsCollapsed ? (
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
                      onChange={(e) => onUpdateLabel?.(section.id, e.target.value.toUpperCase())}
                      className="font-black text-base sm:text-lg text-white bg-slate-800/80 border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1.5 -ml-1 leading-tight max-w-[130px] sm:max-w-[200px] uppercase"
                    />
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-black text-base sm:text-lg text-white leading-tight truncate uppercase">
                        {section.label}
                      </h2>
                      {isThisSectionActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-sm animate-pulse shrink-0">
                          ● EN CURSO
                        </span>
                      )}
                    </div>
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

                  <div>
                    <SectionRepeatControl
                      repeatCount={section.repeatCycles || section.repeatCount}
                      measuresCount={section.measures.length}
                      isEditing={isEditing}
                      onUpdateRepeatCount={(count) => handleSelectCycle(count)}
                    />
                  </div>

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
                {/* Badge grande interactivo VUELTA X / Total en modo normal si hay más de 1 vuelta */}
                {calculatedTotalPasses > 1 && (
                  <button
                    type="button"
                    onClick={() => onAdvancePass?.(section.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-xs border',
                      effectiveCurrentPassIndex === calculatedTotalPasses - 1
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border-purple-700/80'
                    )}
                    title="Clic para avanzar a la siguiente vuelta"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Vuelta</span>
                    <span className="text-sm font-extrabold">{effectiveCurrentPassIndex + 1}</span>
                    <span className="text-purple-400">/</span>
                    <span className="text-xs text-purple-300">{calculatedTotalPasses}</span>
                  </button>
                )}

                {hasAnyLyrics && (
                  <button
                    type="button"
                    onClick={() => setIsLyricsOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/80 hover:bg-purple-900/60 transition-colors shrink-0 cursor-pointer"
                    title="Ver o editar vueltas de letra lírica de esta sección"
                  >
                    <span>📝 Letra</span>
                    <span className="text-[10px] font-bold">
                      ({effectiveLyricPasses.length > 1 ? `${effectiveLyricPasses.length} vueltas` : lineCount})
                    </span>
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
          </>
        )}
      </div>

      {/* Franja compacta de referencia de letra (Siempre visible si hay letra, sin opacar compases) */}
      {!effectiveIsCollapsed && (hasAnyLyrics || hasActiveSegments) && (
        hasActiveSegments ? (
          effectiveLyricPasses.length > 1 ? (
            <div className="px-2.5 py-1 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 shrink-0">
                {effectiveLyricPasses.map((p, pIdx) => {
                  const isActive = pIdx === activePassIndexInCycle
                  return (
                    <button
                      key={p.id || pIdx}
                      type="button"
                      onClick={() => onSelectPass?.(section.id, pIdx)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border select-none',
                        isActive
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-xs'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      )}
                      title={`Mostrar letra de ${p.label}`}
                    >
                      {p.label || `Vuelta ${pIdx + 1}`}
                    </button>
                  )
                })}
                {calculatedTotalPasses > 1 && (
                  <button
                    type="button"
                    onClick={() => onAdvancePass?.(section.id)}
                    className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer select-none"
                    title="Avanzar a la siguiente vuelta"
                  >
                    Sig. →
                  </button>
                )}
              </div>
              <span className="text-[11px] font-mono text-cyan-400/80 italic hidden sm:inline">
                Letra dividida por compases (ver abajo)
              </span>
            </div>
          ) : null
        ) : (
          <div className="px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-2.5">
            {/* Selector táctil de vueltas si la sección tiene más de 1 vuelta de letra definida */}
            {effectiveLyricPasses.length > 1 && (
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {effectiveLyricPasses.map((p, pIdx) => {
                  const isActive = pIdx === activePassIndexInCycle
                  return (
                    <button
                      key={p.id || pIdx}
                      type="button"
                      onClick={() => onSelectPass?.(section.id, pIdx)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border select-none',
                        isActive
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-xs'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      )}
                      title={`Mostrar letra de ${p.label}`}
                    >
                      {p.label || `Vuelta ${pIdx + 1}`}
                    </button>
                  )
                })}
                {calculatedTotalPasses > 1 && (
                  <button
                    type="button"
                    onClick={() => onAdvancePass?.(section.id)}
                    className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer select-none"
                    title="Avanzar a la siguiente vuelta"
                  >
                    Sig. →
                  </button>
                )}
              </div>
            )}

            {/* Letra de la vuelta activa - Multilínea completa sin truncar */}
            {activePassLyrics.trim() ? (
              <div className="text-xs sm:text-sm leading-snug text-cyan-100/95 italic whitespace-normal break-words flex-1 min-w-0">
                {activePassLyrics.trim()}
              </div>
            ) : (
              <div className="text-[11px] sm:text-xs text-slate-500 italic">
                (Sin letra para esta vuelta)
              </div>
            )}
          </div>
        )
      )}

      {/* Cuerpo de la Sección */}
      <div className={cn(isPlaying ? "p-2 sm:p-3 space-y-1.5" : "p-3 sm:p-5 space-y-3")}>
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
                  hasAnyLyrics
                    ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
                )}
                title={hasAnyLyrics ? 'Ver o editar vueltas de letra de esta sección' : 'Añadir vueltas de letra a esta sección'}
              >
                <span>📝 Letra de la sección</span>
                {hasAnyLyrics && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-900 text-purple-200">
                    {effectiveLyricPasses.length > 1 ? `${effectiveLyricPasses.length} vueltas` : lineCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
        {/* Área Desplegable de Letra de la Sección con Soporte para Múltiples Vueltas y Ciclos */}
        {!isPlaying && isLyricsOpen && (
          <div className="pt-2 pb-2 border-b border-slate-100 dark:border-slate-800/80 animate-in fade-in space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>📝 Vueltas de Letra de {section.label}</span>
                </span>
                <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                  • {effectiveLyricPasses.length} {effectiveLyricPasses.length === 1 ? 'vuelta configurada' : 'vueltas configuradas'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLyricsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Pestañas de selección de Vuelta (Vuelta 1, Vuelta 2...) y Botón Añadir Vuelta */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {effectiveLyricPasses.length === 0 ? (
                <button
                  type="button"
                  onClick={handleAddLyricPass}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-600 text-white hover:bg-primary-500 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Vuelta 1</span>
                </button>
              ) : (
                <>
                  {effectiveLyricPasses.map((pass, pIdx) => {
                    const isSelected = pIdx === activeEditPassIdx
                    return (
                      <div key={pass.id || pIdx} className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveEditPassIdx(pIdx)
                            onSelectPass?.(section.id, pIdx)
                          }}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          )}
                        >
                          <span>{pass.label || `Vuelta ${pIdx + 1}`}</span>
                          {pass.lyrics?.trim() && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          )}
                        </button>

                        {/* Botón eliminar vuelta adicional (no permitir eliminar la 1ra vuelta si es la única) */}
                        {isEditing && effectiveLyricPasses.length > 1 && pIdx === activeEditPassIdx && pIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLyricPass(pIdx)}
                            className="ml-1 p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors cursor-pointer"
                            title={`Eliminar ${pass.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Botón para añadir una nueva vuelta de letra */}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAddLyricPass}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-300 border border-dashed border-purple-400/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer flex items-center gap-1"
                      title="Añadir una vuelta de letra adicional para la misma armonía (ej: Vuelta 2)"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Añadir Vuelta de Letra (Vuelta {effectiveLyricPasses.length + 1})</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Selector de Ciclos de Repetición y Resumen del Bloque */}
            <div className="p-2.5 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Ciclos de Repetición:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 6, 8].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleSelectCycle(c)}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer border',
                        cyclesCount === c
                          ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      {c}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen exacto del bloque */}
              <div className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                {blockSummary}
              </div>
            </div>

            {/* Editor de la letra de la vuelta activa */}
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 flex-wrap gap-1.5">
                  <span>
                    Editando letra para: <strong className="text-purple-400">{effectiveLyricPasses[activeEditPassIdx]?.label || `Vuelta ${activeEditPassIdx + 1}`}</strong> ({section.measures.length} compases de armonía)
                  </span>

                  {/* Acciones para Dividir por Líneas de Compases o Unir */}
                  {hasEditSegments ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAddSegmentBlock}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/70 transition-colors cursor-pointer"
                        title="Añadir otro bloque de compases a esta sección"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Añadir Bloque</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleJoinSegmentsIntoSingleBlock}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        title="Unir todos los bloques de compases en un solo campo de letra general"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Unir en un solo bloque</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSplitCurrentPassIntoSegments}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-700/80 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Dividir automáticamente la letra en bloques (ej. Compases 1-4, 5-8...)"
                    >
                      <Scissors className="w-3.5 h-3.5 text-cyan-300" />
                      <span>✂️ Dividir Letra por Líneas de Compases (cada 4 compases)</span>
                    </button>
                  )}
                </div>

                {hasEditSegments ? (
                  /* Formulario de edición por segmentos / bloques de compases */
                  <div className="space-y-2 pt-1">
                    {currentEditSegments.map((seg, sIdx) => (
                      <div
                        key={seg.id || sIdx}
                        className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                            <span className="w-5 h-5 rounded-md bg-purple-600/20 text-purple-400 text-[10px] font-black flex items-center justify-center border border-purple-500/30">
                              {sIdx + 1}
                            </span>
                            <span className="text-[11px]">Compases</span>
                            <input
                              type="number"
                              min={1}
                              max={section.measures.length}
                              value={seg.startMeasure}
                              onChange={(e) =>
                                handleUpdateSegmentRange(
                                  seg.id,
                                  parseInt(e.target.value, 10) || 1,
                                  seg.endMeasure
                                )
                              }
                              className="w-11 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <span className="text-slate-400">–</span>
                            <input
                              type="number"
                              min={seg.startMeasure}
                              max={section.measures.length + 16}
                              value={seg.endMeasure}
                              onChange={(e) =>
                                handleUpdateSegmentRange(
                                  seg.id,
                                  seg.startMeasure,
                                  parseInt(e.target.value, 10) || seg.startMeasure
                                )
                              }
                              className="w-11 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>

                          {currentEditSegments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSegmentBlock(seg.id)}
                              className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors cursor-pointer"
                              title="Eliminar este bloque de compases"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <textarea
                          value={seg.text}
                          onChange={(e) => handleUpdateSegmentText(seg.id, e.target.value)}
                          placeholder={`Escribe aquí la letra para los compases ${seg.startMeasure} a ${seg.endMeasure} (ej. versos de esta línea)...`}
                          rows={Math.max(2, Math.min(5, (seg.text || '').split('\n').length + 1))}
                          className="w-full bg-white dark:bg-slate-900/80 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-sans leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y transition-all"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Formulario de bloque único general */
                  <textarea
                    value={effectiveLyricPasses[activeEditPassIdx]?.lyrics || ''}
                    onChange={(e) => handleUpdateCurrentPassLyrics(e.target.value)}
                    placeholder={`Escribe aquí la letra para ${effectiveLyricPasses[activeEditPassIdx]?.label || 'esta vuelta'}...`}
                    rows={Math.max(3, Math.min(8, (effectiveLyricPasses[activeEditPassIdx]?.lyrics || '').split('\n').length + 1))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-sans leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y transition-all"
                  />
                )}
              </div>
            ) : (
              /* Modo visualización no edición */
              hasEditSegments ? (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 px-0.5 flex items-center justify-between">
                    <span>
                      Letra de: <strong className="text-purple-400">{effectiveLyricPasses[activeEditPassIdx]?.label || `Vuelta ${activeEditPassIdx + 1}`}</strong>
                    </span>
                    <span className="text-cyan-400 font-mono text-[10px] font-bold bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                      Dividida por líneas de compases
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {currentEditSegments.map((seg, sIdx) => (
                      <div
                        key={seg.id || sIdx}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                          <span>Compases {seg.startMeasure} – {seg.endMeasure}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                          {seg.text?.trim() || (
                            <span className="italic text-slate-400">Sin letra asignada para estos compases</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400 px-0.5">
                    Letra de: <strong className="text-purple-400">{effectiveLyricPasses[activeEditPassIdx]?.label || `Vuelta ${activeEditPassIdx + 1}`}</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {effectiveLyricPasses[activeEditPassIdx]?.lyrics?.trim() || (
                      <span className="italic text-slate-400">Sin letra asignada para esta vuelta</span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Vista Colapsada vs Vista Expandida */}
        {effectiveIsCollapsed ? (
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
                viewMode={viewMode}
                isEditing={isEditing}
                activeMeasureId={isCurrentlyPlayingSection ? activeMeasureId : null}
                currentBeatIndex={isCurrentlyPlayingSection ? currentBeatIndex : null}
                isPlaying={isPlaying}
                measureDurationMs={measureDurationMs}
                sectionName={section.label}
                sectionRepeatCount={section.repeatCount}
                currentRepeat={effectiveCurrentRepeat}
                totalRepeats={effectiveTotalRepeats}
                nextSectionName={effectiveNextSectionName}
                lyricSegments={activePassSegments}
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
