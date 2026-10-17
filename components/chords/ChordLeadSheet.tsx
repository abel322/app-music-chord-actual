'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText, 
  RotateCcw, 
  SlidersHorizontal, 
  Music, 
  Layers, 
  Trash2, 
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapTempoButton } from '@/components/ui/TapTempoButton'
import { MeasureGrid } from '@/components/chords/MeasureGrid'
import { ProgressionPicker } from '@/components/chords/ProgressionPicker'
import { CadencePicker } from '@/components/chords/CadencePicker'
import { SectionKeyControl } from '@/components/chords/SectionKeyControl'
import { SectionNavigationStickyBar } from '@/components/chords/SectionNavigationStickyBar'
import { LeadSheetPlaybackControls } from '@/components/chords/LeadSheetPlaybackControls'
import { useLeadSheetPlayback } from '@/lib/hooks/useLeadSheetPlayback'
import { SectionMeasures, Measure } from '@/types/measure'
import { 
  ensureSectionMeasures, 
  transposeSectionMeasures, 
  transposeSingleSectionMeasures,
  generateMeasures,
  applyProgressionToMeasures,
  applyCadenceToSectionMeasures,
  getSectionBadge,
  getSectionDefaultName,
  cloneSectionMeasures,
  getSectionChordsPreview
} from '@/lib/measure-utils'
import { updateSectionsTimeSignature } from '@/lib/rhythm-utils'
import { getDiatonicChords } from '@/lib/music-theory'
import { transposeChord, getSemitoneDiff } from '@/lib/transpose'
import { POPULAR_PROGRESSIONS, getProgressionChords, HarmonicProgression, CadenceDefinition } from '@/lib/harmonic-theory'
import { updateSongAction } from '@/app/actions/songs'
import { cn } from '@/lib/utils'

interface SongData {
  id: string
  title: string
  artist: string | null
  key: string | null
  timeSignature: string | null
  tempo: number | null
  sections: any
  content?: string
  lyrics?: string
}

interface ChordLeadSheetProps {
  song: SongData
}

const SECTION_OPTIONS = [
  { value: 'intro', label: 'Intro' },
  { value: 'verse', label: 'Estrofa' },
  { value: 'prechorus', label: 'Pre-Coro' },
  { value: 'chorus', label: 'Coro' },
  { value: 'bridge', label: 'Puente' },
  { value: 'interlude', label: 'Interludio' },
  { value: 'solo', label: 'Solo' },
  { value: 'outro', label: 'Outro' },
]

const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function ChordLeadSheet({ song }: ChordLeadSheetProps) {
  const router = useRouter()
  const [currentKey, setCurrentKey] = useState(song.key || 'C')
  const [timeSignature, setTimeSignature] = useState(song.timeSignature || '4/4')
  const [tempo, setTempo] = useState<number>(song.tempo || 120)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [transposeSemitones, setTransposeSemitones] = useState(0)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  // Alternar colapso de una sección individual
  const handleToggleCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  // Alternar colapso global (Colapsar todo / Expandir todo)
  const handleToggleCollapseAll = () => {
    const allCollapsed = sections.length > 0 && sections.every((s) => collapsedSections[s.id])
    if (allCollapsed) {
      setCollapsedSections({})
    } else {
      const all: Record<string, boolean> = {}
      sections.forEach((s) => {
        all[s.id] = true
      })
      setCollapsedSections(all)
    }
  }

  // Salto rápido a sección con descolapso automático y desplazamiento suave
  const handleSelectSectionJump = (sectionId: string) => {
    if (collapsedSections[sectionId]) {
      setCollapsedSections((prev) => ({ ...prev, [sectionId]: false }))
    }
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 60)
  }

  // Normalizar las secciones a compases estructurados
  const [sections, setSections] = useState<SectionMeasures[]>(() => {
    const rawSections = Array.isArray(song.sections) ? song.sections : []
    const counter = { current: 1 }

    if (rawSections.length === 0) {
      return [
        {
          id: `sec-intro-${Date.now()}`,
          type: 'intro',
          label: 'Intro',
          timeSignature: song.timeSignature || '4/4',
          instruments: [],
          measures: generateMeasures(4, 1, song.timeSignature || '4/4', [song.key || 'C']),
        },
        {
          id: `sec-verse-${Date.now()}`,
          type: 'verse',
          label: 'Estrofa 1',
          timeSignature: song.timeSignature || '4/4',
          instruments: [],
          measures: generateMeasures(4, 5, song.timeSignature || '4/4', [song.key || 'C']),
        },
      ]
    }

    return rawSections.map((sec, idx) =>
      ensureSectionMeasures(sec, idx, song.timeSignature || '4/4', counter)
    )
  })

  // Hook de Reproducción y Seguimiento Temporal de Compases en Vivo
  const {
    isPlaying,
    currentFlatMeasureIndex,
    currentMeasure,
    currentBeat,
    isMuted,
    totalMeasuresCount,
    togglePlay,
    stop,
    toggleMute,
    jumpToMeasureId,
  } = useLeadSheetPlayback({
    sections,
    tempo,
    defaultTimeSignature: timeSignature,
    onMeasureChange: (_flatIndex, measure, sectionId) => {
      // Si una sección está colapsada y la reproducción entra en ella, expandir automáticamente
      setCollapsedSections((prev) => {
        if (prev[sectionId]) {
          return { ...prev, [sectionId]: false }
        }
        return prev
      })

      // Auto-desplazamiento suave (Follow Playhead):
      // Si el compás activo sale del viewport o se acerca al borde inferior de la pantalla:
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(`measure-cell-${measure.id}`)
          if (!el) return
          const rect = el.getBoundingClientRect()
          const viewportHeight = window.innerHeight || document.documentElement.clientHeight
          const isNearBottom = rect.bottom > viewportHeight - 140
          const isAboveTop = rect.top < 120
          if (isNearBottom || isAboveTop) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 50)
      })
    },
  })

  // Acordes diatónicos de la tonalidad actual para sugerencias
  const diatonicChords = useMemo(() => {
    try {
      const res = getDiatonicChords(currentKey)
      return res.inKey.map((c) => `${c.root}${c.type}`)
    } catch {
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']
    }
  }, [currentKey])

  // Transposición tonal en tiempo real (+ / - semitonos)
  const handleTranspose = (delta: number) => {
    const oldKeyIndex = ALL_KEYS.indexOf(currentKey)
    const newKeyIndex = (oldKeyIndex + delta + 12) % 12
    const newKey = ALL_KEYS[newKeyIndex]

    setSections((prev) => transposeSectionMeasures(prev, delta))
    setCurrentKey(newKey)
    setTransposeSemitones((prev) => prev + delta)
  }

  // Restablecer tono original
  const handleResetTranspose = () => {
    if (transposeSemitones === 0) return
    const reverseDelta = -transposeSemitones
    setSections((prev) => transposeSectionMeasures(prev, reverseDelta))
    setCurrentKey(song.key || 'C')
    setTransposeSemitones(0)
  }

  // Cambiar Cifra de Compás y actualizar todas las secciones y compases en cascada
  const handleTimeSignatureChange = (newTimeSig: string) => {
    setTimeSignature(newTimeSig)
    setSections((prev) => updateSectionsTimeSignature(prev, newTimeSig))
  }

  // Aplicar progresión a una sección completa
  const handleApplyProgression = (sectionId: string, prog: HarmonicProgression | string) => {
    const chords = getProgressionChords(prog, currentKey)
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        return {
          ...sec,
          measures: applyProgressionToMeasures(sec.measures, chords, sec.timeSignature || timeSignature),
        }
      })
    )
  }

  // Marcar e inyectar cadencia armónica en el compás final de la sección
  const handleApplySectionCadence = (sectionId: string, cad: CadenceDefinition | null) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId || sec.measures.length === 0) return sec
        return {
          ...sec,
          measures: applyCadenceToSectionMeasures(sec.measures, cad, currentKey, sec.timeSignature || timeSignature),
        }
      })
    )
  }

  // Actualizar compases de una sección específica
  const handleUpdateSectionMeasures = (sectionId: string, updatedMeasures: Measure[]) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, measures: updatedMeasures } : sec))
    )
  }

  // Cambiar Tonalidad Específica de una Sección (con opción de transposición de acordes)
  const handleUpdateSectionKey = (sectionId: string, newKey: string | null, transposeChords: boolean) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        if (!transposeChords) {
          return {
            ...sec,
            keySignature: newKey,
          }
        }
        const prevEffective = sec.keySignature || currentKey
        const newEffective = newKey || currentKey
        const semitones = getSemitoneDiff(prevEffective, newEffective)
        return transposeSingleSectionMeasures(sec, semitones, newKey)
      })
    )
  }

  // Añadir compases a una sección
  const handleAddMeasuresToSection = (sectionId: string, count: number) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        const lastMeasureNumber = sec.measures.length > 0 ? sec.measures[sec.measures.length - 1].measureNumber : 0
        const newMeasures = generateMeasures(count, lastMeasureNumber + 1, sec.timeSignature || timeSignature)
        return {
          ...sec,
          measures: [...sec.measures, ...newMeasures],
        }
      })
    )
  }

  // Eliminar un compás de una sección
  const handleRemoveMeasure = (sectionId: string, measureId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        const filtered = sec.measures.filter((m) => m.id !== measureId)
        // Renumerar compases
        const renumbered = filtered.map((m, idx) => ({ ...m, measureNumber: idx + 1 }))
        return { ...sec, measures: renumbered }
      })
    )
  }

  // Agregar una nueva sección completa (Intro, Estrofa, Coro, etc.)
  const handleAddSection = (type: string) => {
    const defaultName = getSectionDefaultName(type)
    const countSameType = sections.filter((s) => {
      if (type === 'interlude' || type === 'instrumental') {
        return s.type === 'interlude' || s.type === 'instrumental'
      }
      return s.type === type
    }).length
    const label = `${defaultName} ${countSameType + 1}`

    // Determinar siguiente número de compás
    const allMeasuresCount = sections.reduce((acc, s) => acc + s.measures.length, 0)
    const newMeasures = generateMeasures(4, allMeasuresCount + 1, timeSignature, [currentKey])

    const newSection: SectionMeasures = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      timeSignature,
      instruments: [],
      guideLyrics: '',
      measures: newMeasures,
    }

    setSections([...sections, newSection])
  }

  // Duplicar una sección completa inmediatamente después de la original
  const handleDuplicateSection = (sectionId: string) => {
    const originalIndex = sections.findIndex((s) => s.id === sectionId)
    if (originalIndex === -1) return

    const originalSection = sections[originalIndex]
    const duplicatedSection = cloneSectionMeasures(originalSection, sections)

    const updated = [...sections]
    updated.splice(originalIndex + 1, 0, duplicatedSection)
    setSections(updated)
  }

  // Eliminar una sección
  const handleRemoveSection = (sectionId: string) => {
    if (!confirm('¿Eliminar esta sección y todos sus compases?')) return
    setSections(sections.filter((s) => s.id !== sectionId))
  }

  // Mover sección arriba
  const handleMoveSectionUp = (index: number) => {
    if (index <= 0) return
    const updated = [...sections]
    const [moved] = updated.splice(index, 1)
    updated.splice(index - 1, 0, moved)
    setSections(updated)
  }

  // Mover sección abajo
  const handleMoveSectionDown = (index: number) => {
    if (index >= sections.length - 1) return
    const updated = [...sections]
    const [moved] = updated.splice(index, 1)
    updated.splice(index + 1, 0, moved)
    setSections(updated)
  }

  // Guardar en la base de datos
  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await updateSongAction(song.id, {
        key: currentKey,
        timeSignature,
        tempo,
        sections: sections as any,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error al guardar compases:', err)
      alert('Hubo un error al guardar los cambios armónicos.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Barra Superior de Control y Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/songs/chords">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Volver a Acordes</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{song.title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                Lead Sheet (Compases)
              </span>
            </h1>
            <p className="text-xs text-slate-500">{song.artist || 'Artista no especificado'}</p>
          </div>
        </div>

        {/* Grupo de Acciones Principales */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Enlace directo a la vista de Letras */}
          <Link href={`/dashboard/songs/lyrics/${song.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60">
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Letras</span>
            </Button>
          </Link>

          {/* Toggle Modo Edición */}
          <Button
            variant={isEditing ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Terminar Edición' : 'Editar Compases'}</span>
          </Button>

          {/* Guardar Cambios */}
          <Button
            variant="gradient"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold gap-1.5 shadow-md shadow-primary-900/20"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Lead Sheet'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Barra de Herramientas Musicales: Tonalidad, Transposición y Métrica */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white shadow-lg border border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Tonalidad con Badge Destacado */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tono:
            </span>
            <div className="px-3 py-1 rounded-xl bg-primary-600 font-mono text-base font-extrabold text-white shadow-md shadow-primary-900/40">
              {currentKey}
            </div>
          </div>

          {/* Botones de Transposición Rápida */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => handleTranspose(-1)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Bajar 1 semitono (♭)"
            >
              ♭ -1
            </button>
            <button
              type="button"
              onClick={() => handleTranspose(1)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Subir 1 semitono (#)"
            >
              ♯ +1
            </button>
            {transposeSemitones !== 0 && (
              <button
                type="button"
                onClick={handleResetTranspose}
                className="px-2 py-1 text-xs text-primary-400 hover:text-primary-300 underline font-medium"
                title="Restablecer tono original"
              >
                Reset ({transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones})
              </button>
            )}
          </div>

          {/* Compás (Métrica) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Compás:
            </span>
            {isEditing ? (
              <select
                value={timeSignature}
                onChange={(e) => handleTimeSignatureChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="2/4">2/4</option>
                <option value="6/8">6/8</option>
                <option value="12/8">12/8</option>
              </select>
            ) : (
              <span className="font-mono font-bold text-sm bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {timeSignature}
              </span>
            )}
          </div>

          {/* Tempo BPM */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tempo:
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={30}
                  max={280}
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
                  className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white text-center focus:outline-none"
                />
                <TapTempoButton
                  onTempoChange={(bpm) => setTempo(bpm)}
                  currentTempo={tempo}
                  timeSignature={timeSignature}
                  className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                />
              </div>
            ) : (
              <span className="font-mono font-bold text-sm bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {tempo} BPM
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Botonera de Control de Reproducción en Vivo (Live Playback Tracker) */}
          <LeadSheetPlaybackControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            currentMeasureNumber={currentMeasure?.measure.measureNumber || 1}
            currentBeat={currentBeat}
            beatsCount={currentMeasure?.beatsCount || 4}
            currentSectionLabel={currentMeasure?.sectionLabel}
            totalMeasuresCount={totalMeasuresCount}
            currentFlatMeasureIndex={currentFlatMeasureIndex}
            onTogglePlay={togglePlay}
            onStop={stop}
            onToggleMute={toggleMute}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden sm:inline">Formato Lead Sheet de Estudio</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-bold text-slate-300">
            4 Compases / Línea
          </span>
        </div>
      </div>

      {/* Barra Fija de Navegación Rápida por Secciones (Quick Jump) */}
      <SectionNavigationStickyBar
        sections={sections}
        collapsedSections={collapsedSections}
        onToggleCollapseAll={handleToggleCollapseAll}
        onSelectSection={handleSelectSectionJump}
      />

      {/* Secciones de la Canción con Rejilla de Compases */}
      <div className="space-y-6 sm:space-y-8">
        {sections.map((section, sIdx) => {
          const effectiveKey = section.keySignature || currentKey
          const isCollapsed = !!collapsedSections[section.id]
          let sectionDiatonicChords = diatonicChords
          if (section.keySignature && section.keySignature !== currentKey) {
            try {
              const res = getDiatonicChords(section.keySignature)
              sectionDiatonicChords = res.inKey.map((c) => `${c.root}${c.type}`)
            } catch {
              sectionDiatonicChords = diatonicChords
            }
          }

          return (
            <div
              key={section.id}
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
                      onClick={() => handleToggleCollapse(section.id)}
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
                            onChange={(e) => {
                              const val = e.target.value
                              setSections((prev) =>
                                prev.map((s) => (s.id === section.id ? { ...s, label: val } : s))
                              )
                            }}
                            className="font-black text-lg text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 -ml-1 leading-tight"
                          />
                        ) : (
                          <h2 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                            {section.label}
                          </h2>
                        )}

                        {/* Badge de modulación en modo lectura */}
                        {!isEditing && (
                          <SectionKeyControl
                            section={section}
                            globalKey={currentKey}
                            isEditing={false}
                            onUpdateSectionKey={handleUpdateSectionKey}
                          />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 block">
                        {section.measures.length} compases • {section.timeSignature || timeSignature}
                      </span>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Controles de Tonalidad de Sección (Selector + ♭ -1 / ♯ +1 + Badge) */}
                      <SectionKeyControl
                        section={section}
                        globalKey={currentKey}
                        isEditing={true}
                        onUpdateSectionKey={handleUpdateSectionKey}
                      />

                      {/* Selector Desacoplado de Progresiones */}
                      <ProgressionPicker
                        currentKey={effectiveKey}
                        buttonLabel="✦ Progresión de Sección"
                        buttonVariant="subtle"
                        onSelectProgression={(prog) => handleApplyProgression(section.id, prog)}
                      />

                      {/* Selector Desacoplado de Cadencias al cierre de sección */}
                      <CadencePicker
                        currentKey={effectiveKey}
                        currentCadenceId={section.measures[section.measures.length - 1]?.cadence}
                        buttonLabel="✦ Cadencia Final"
                        buttonVariant="subtle"
                        onSelectCadence={(cad) => handleApplySectionCadence(section.id, cad)}
                      />

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mover Arriba */}
                        <button
                          type="button"
                          onClick={() => handleMoveSectionUp(sIdx)}
                          disabled={sIdx === 0}
                          className={cn(
                            'p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700',
                            sIdx === 0 && 'opacity-30 cursor-not-allowed pointer-events-none'
                          )}
                          title="Mover sección arriba"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        {/* Mover Abajo */}
                        <button
                          type="button"
                          onClick={() => handleMoveSectionDown(sIdx)}
                          disabled={sIdx === sections.length - 1}
                          className={cn(
                            'p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700',
                            sIdx === sections.length - 1 && 'opacity-30 cursor-not-allowed pointer-events-none'
                          )}
                          title="Mover sección abajo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        {/* Duplicar Sección */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateSection(section.id)}
                          className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                          title="Duplicar sección"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Eliminar Sección */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(section.id)}
                          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                          title="Eliminar sección"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                      onClick={() => handleToggleCollapse(section.id)}
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
                          onChange={(e) => {
                            const val = e.target.value
                            setSections((prev) =>
                              prev.map((s) => (s.id === section.id ? { ...s, guideLyrics: val } : s))
                            )
                          }}
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
              {!isCollapsed && (
                <MeasureGrid
                  measures={section.measures}
                  timeSignature={section.timeSignature || timeSignature}
                  currentKey={effectiveKey}
                  diatonicChords={sectionDiatonicChords}
                  isEditing={isEditing}
                  activeMeasureId={currentMeasure?.measure.id || null}
                  isPlaying={isPlaying}
                  measureDurationMs={currentMeasure?.durationMs}
                  onMeasureClick={(clickedMeasure) => {
                    // Si el usuario hace clic en cualquier compás mientras está en reproducción, saltar de inmediato
                    jumpToMeasureId(clickedMeasure.id)
                  }}
                  onUpdateMeasures={(updatedMeasures) =>
                    handleUpdateSectionMeasures(section.id, updatedMeasures)
                  }
                  onAddMeasures={(count) => handleAddMeasuresToSection(section.id, count)}
                  onRemoveMeasure={(measureId) => handleRemoveMeasure(section.id, measureId)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Agregar Nueva Sección en Modo Edición */}
      {isEditing && (
        <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/30">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Añadir una nueva sección al Lead Sheet:
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {SECTION_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                onClick={() => handleAddSection(opt.value)}
                className="text-xs font-semibold gap-1 bg-white dark:bg-slate-900"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ {opt.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
