'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  Music, 
  Check, 
  Sparkles, 
  SlidersHorizontal,
  Clock,
  Compass,
  FileText,
  ChevronDown,
  ChevronUp,
  Youtube
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapTempoButton } from '@/components/ui/TapTempoButton'
import { MeasureGrid } from '@/components/chords/MeasureGrid'
import { ProgressionPicker } from '@/components/chords/ProgressionPicker'
import { CadencePicker } from '@/components/chords/CadencePicker'
import { SectionKeyControl } from '@/components/chords/SectionKeyControl'
import { SectionRepeatControl } from '@/components/chords/SectionRepeatControl'
import { SectionNavigationStickyBar } from '@/components/chords/SectionNavigationStickyBar'
import { LeadSheetPlaybackControls } from '@/components/chords/LeadSheetPlaybackControls'
import { SectionCard } from '@/components/chords/SectionCard'
import { YouTubeLinkModal } from '@/components/songs/YouTubeLinkModal'
import { useLeadSheetPlayback } from '@/lib/hooks/useLeadSheetPlayback'
import { SectionMeasures, Measure } from '@/types/measure'

import { 
  ensureSectionMeasures, 
  generateMeasures, 
  applyProgressionToMeasures, 
  applyCadenceToSectionMeasures,
  transposeSectionMeasures,
  transposeSingleSectionMeasures,
  getBeatsPerMeasure,
  getSectionBadge,
  getSectionDefaultName,
  cloneSectionMeasures,
  getSectionChordsPreview,
  buildFullLyricsText
} from '@/lib/measure-utils'
import { updateSectionsTimeSignature } from '@/lib/rhythm-utils'
import { POPULAR_PROGRESSIONS, getProgressionChords, HarmonicProgression, CadenceDefinition } from '@/lib/harmonic-theory'
import { getDiatonicChords } from '@/lib/music-theory'
import { getSemitoneDiff } from '@/lib/transpose'
import { createSongAction, updateSongAction } from '@/app/actions/songs'
import { cn } from '@/lib/utils'

interface LeadSheetBuilderProps {
  initialData?: {
    id?: string
    title?: string
    artist?: string | null
    key?: string | null
    timeSignature?: string | null
    tempo?: number | null
    genre?: string | null
    youtubeUrl?: string | null
    sections?: any
    lyrics?: string | null
    content?: string | null
  }
  isEditing?: boolean
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro' },
  { value: 'verse', label: 'Estrofa' },
  { value: 'prechorus', label: 'Pre-Coro' },
  { value: 'chorus', label: 'Coro' },
  { value: 'bridge', label: 'Puente' },
  { value: 'interlude', label: 'Interludio' },
  { value: 'solo', label: 'Solo' },
  { value: 'outro', label: 'Outro' },
]

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function LeadSheetBuilder({ initialData, isEditing = false }: LeadSheetBuilderProps) {
  const router = useRouter()

  // Datos Generales de la Canción
  const [title, setTitle] = useState(initialData?.title || '')
  const [artist, setArtist] = useState(initialData?.artist || '')
  const [key, setKey] = useState(initialData?.key || 'C')
  const [timeSignature, setTimeSignature] = useState(initialData?.timeSignature || '4/4')
  const [tempo, setTempo] = useState<number>(initialData?.tempo || 120)
  const [genre, setGenre] = useState(initialData?.genre || '')
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl || '')
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false)

  // Estados de proceso
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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

  // Secciones estructuradas con Compases (Lead Sheet)
  const [sections, setSections] = useState<SectionMeasures[]>(() => {
    const rawSections = Array.isArray(initialData?.sections) ? initialData.sections : []
    const counter = { current: 1 }

    if (rawSections.length === 0) {
      // Plantilla base inicial: Intro de 4 compases y Estrofa 1 de 4 compases
      return [
        {
          id: `sec-intro-${Date.now()}`,
          type: 'intro',
          label: 'Intro',
          timeSignature: initialData?.timeSignature || '4/4',
          instruments: [],
          guideLyrics: '',
          measures: generateMeasures(4, 1, initialData?.timeSignature || '4/4', [initialData?.key || 'C']),
        },
        {
          id: `sec-verse-${Date.now()}`,
          type: 'verse',
          label: 'Estrofa 1',
          timeSignature: initialData?.timeSignature || '4/4',
          instruments: [],
          guideLyrics: '',
          measures: generateMeasures(4, 5, initialData?.timeSignature || '4/4', [initialData?.key || 'C']),
        },
      ]
    }

    return rawSections.map((sec, idx) =>
      ensureSectionMeasures(sec, idx, initialData?.timeSignature || '4/4', counter)
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
    totalDurationFormatted,
    togglePlay,
    stop,
    toggleMute,
    jumpToMeasureId,
  } = useLeadSheetPlayback({
    sections,
    tempo,
    defaultTimeSignature: timeSignature,
    onMeasureChange: (_flatIndex, measure, sectionId) => {
      setCollapsedSections((prev) => {
        if (prev[sectionId]) {
          return { ...prev, [sectionId]: false }
        }
        return prev
      })
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

  // Acordes diatónicos de la tonalidad actual
  const diatonicChords = useMemo(() => {
    try {
      const res = getDiatonicChords(key)
      return res.inKey.map((c) => `${c.root}${c.type}`)
    } catch {
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']
    }
  }, [key])

  // Cambiar Tonalidad Global y Transponer Compases
  const handleKeyChange = (newKey: string) => {
    if (newKey === key) return
    const oldIndex = MUSICAL_KEYS.indexOf(key)
    const newIndex = MUSICAL_KEYS.indexOf(newKey)
    if (oldIndex !== -1 && newIndex !== -1) {
      const semitones = (newIndex - oldIndex + 12) % 12
      setSections((prev) => transposeSectionMeasures(prev, semitones))
    }
    setKey(newKey)
  }

  // Cambiar Cifra de Compás y actualizar todas las secciones y compases en cascada
  const handleTimeSignatureChange = (newTimeSig: string) => {
    setTimeSignature(newTimeSig)
    setSections((prev) => updateSectionsTimeSignature(prev, newTimeSig))
  }

  // Actualizar los compases de una sección específica
  const handleUpdateSectionMeasures = (sectionId: string, updatedMeasures: Measure[]) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, measures: updatedMeasures } : sec))
    )
  }

  // Modificar multiplicador de repeticiones de una sección (1x, 2x, 4x...)
  const handleUpdateSectionRepeatCount = (sectionId: string, count: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, repeatCount: count } : s))
    )
  }

  // Modificar tempo específico (BPM override) de una sección
  const handleUpdateSectionTempo = (sectionId: string, newTempo: number | null) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, tempoOverride: newTempo } : s))
    )
  }

  // Cambiar Tonalidad Específica de una Sección (con opción de transposición armónica de compases)
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
        const prevEffective = sec.keySignature || key
        const newEffective = newKey || key
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
        const lastNum = sec.measures.length > 0 ? sec.measures[sec.measures.length - 1].measureNumber : 0
        const newMeasures = generateMeasures(count, lastNum + 1, sec.timeSignature || timeSignature)
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
        const renumbered = filtered.map((m, idx) => ({ ...m, measureNumber: idx + 1 }))
        return { ...sec, measures: renumbered }
      })
    )
  }

  // Aplicar una Progresión a una sección completa
  const handleApplyProgression = (sectionId: string, prog: HarmonicProgression | string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        const secKey = sec.keySignature || key
        const progressionChords = getProgressionChords(prog, secKey)
        return {
          ...sec,
          measures: applyProgressionToMeasures(sec.measures, progressionChords, sec.timeSignature || timeSignature),
        }
      })
    )
  }

  // Marcar e inyectar cadencia armónica en el compás final de la sección
  const handleApplySectionCadence = (sectionId: string, cad: CadenceDefinition | null) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId || sec.measures.length === 0) return sec
        const secKey = sec.keySignature || key
        return {
          ...sec,
          measures: applyCadenceToSectionMeasures(sec.measures, cad, secKey, sec.timeSignature || timeSignature),
        }
      })
    )
  }

  // Añadir nueva sección completa
  const handleAddSection = (type: string) => {
    const defaultName = getSectionDefaultName(type)
    const countSameType = sections.filter((s) => {
      if (type === 'interlude' || type === 'instrumental') {
        return s.type === 'interlude' || s.type === 'instrumental'
      }
      return s.type === type
    }).length
    const label = `${defaultName} ${countSameType + 1}`

    const allMeasuresCount = sections.reduce((acc, s) => acc + s.measures.length, 0)
    const newMeasures = generateMeasures(4, allMeasuresCount + 1, timeSignature, [key])

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
    if (sections.length <= 1) {
      alert('La canción debe tener al menos una sección.')
      return
    }
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

  // Guardar Canción (Creación o Edición)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('El título de la canción es obligatorio.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const fullLyrics = buildFullLyricsText(sections) || initialData?.lyrics || undefined

      const payload = {
        title: title.trim(),
        artist: artist.trim() || undefined,
        key,
        timeSignature,
        tempo,
        genre: genre.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        lyrics: fullLyrics,
        sections: sections as any,
      }

      let songId = initialData?.id

      if (isEditing && songId) {
        await updateSongAction(songId, payload)
      } else {
        const result = await createSongAction(payload as any)
        songId = result.song.id
      }

      // Redirigir a la vista especializada de Acordes (Lead Sheet)
      router.push(`/dashboard/songs/chords/${songId}`)
      router.refresh()
    } catch (err: any) {
      console.error('Error al guardar canción:', err)
      setErrorMessage(err.message || 'Error al guardar la canción. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-7xl mx-auto pb-28">
      {/* Header Superior y Botón de Volver */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/songs/chords">
            <Button variant="ghost" size="sm" type="button" className="text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Cancelar</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{isEditing ? 'Editar Lead Sheet' : 'Nueva Canción (Lead Sheet Builder)'}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                Sistema por Compases
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Construye la partitura armónica estructurada con compases, divisiones de tiempo y cadencias.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Enlace de YouTube */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsYouTubeModalOpen(true)}
            className={cn(
              'gap-1.5 text-xs font-bold transition-all shadow-xs',
              youtubeUrl
                ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-red-600 dark:hover:text-red-400'
            )}
            title={youtubeUrl ? 'Ver o editar enlace de YouTube vinculado' : 'Vincular enlace de YouTube'}
          >
            <Youtube className={cn('w-3.5 h-3.5 text-red-600 dark:text-red-500', youtubeUrl && 'fill-current')} />
            <span>{youtubeUrl ? 'YouTube' : 'Enlace YouTube'}</span>
          </Button>

          <Button
            type="submit"
            variant="gradient"
            size="sm"
            disabled={isLoading}
            className="text-xs font-bold gap-1.5 shadow-md shadow-primary-900/20 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear y Abrir Lead Sheet'}</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-semibold animate-in fade-in">
          {errorMessage}
        </div>
      )}

      {/* Metadatos Generales de la Canción */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white font-black text-base">
          <Music className="w-5 h-5 text-primary-500" />
          <span>Información General de la Canción</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Título */}
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Título de la Canción *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Inolvidable, Bohemian Rhapsody..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Artista */}
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Artista / Intérprete
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ej: Queen, Reik, Hillsong..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Tonalidad */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tonalidad</span>
              <span className="text-[10px] text-primary-500 lowercase">transpone acordes</span>
            </label>
            <select
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {MUSICAL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k} (Mayor)
                </option>
              ))}
            </select>
          </div>

          {/* Cifra de Compás */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cifra de Compás
            </label>
            <select
              value={timeSignature}
              onChange={(e) => handleTimeSignatureChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="4/4">4/4 (Cuatro Tiempos)</option>
              <option value="3/4">3/4 (Tres Tiempos / Vals)</option>
              <option value="2/4">2/4 (Dos Tiempos)</option>
              <option value="6/8">6/8 (Compuesto / Balada)</option>
              <option value="12/8">12/8 (Blues / Soul)</option>
            </select>
          </div>

          {/* Tempo BPM con Botón Tap Tempo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tempo (BPM)</span>
              <span className="text-[10px] text-primary-500 font-mono font-bold">{tempo} BPM</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={30}
                max={280}
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
              />
              <TapTempoButton onTempoChange={(bpm) => setTempo(bpm)} currentTempo={tempo} timeSignature={timeSignature} />
            </div>
          </div>

          {/* Género */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Género (Opcional)
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Pop, Rock, Balada, Jazz..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Enlace de YouTube */}
          <div className="space-y-1 md:col-span-2 lg:col-span-4">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Enlace de YouTube</span>
              {youtubeUrl && (
                <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Video vinculado
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsYouTubeModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 gap-1.5"
                title="Abrir asistente de enlace y miniatura de YouTube"
              >
                <Youtube className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">Previsualizar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Fija de Navegación Rápida por Secciones (Quick Jump) */}
      <SectionNavigationStickyBar
        sections={sections}
        collapsedSections={collapsedSections}
        onToggleCollapseAll={handleToggleCollapseAll}
        onSelectSection={handleSelectSectionJump}
      />

      {/* Secciones y Constructor de Lead Sheet por Compases */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-500" />
              <span>Estructura de Secciones por Compases</span>
            </h2>
            <p className="text-xs text-slate-500">
              Cada sección contiene compases interactivos de {getBeatsPerMeasure(timeSignature)} tiempos ({timeSignature}) con detección automática de cadencias armónicas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <LeadSheetPlaybackControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              currentMeasureNumber={currentMeasure?.measure.measureNumber || 1}
              currentBeat={currentBeat}
              beatsCount={currentMeasure?.beatsCount || 4}
              currentSectionLabel={currentMeasure?.sectionLabel}
              totalMeasuresCount={totalMeasuresCount}
              currentFlatMeasureIndex={currentFlatMeasureIndex}
              iteration={currentMeasure?.iteration}
              repeatCount={currentMeasure?.repeatCount}
              measureIndexInSection={currentMeasure?.measureIndexInSection}
              totalMeasuresInSection={currentMeasure?.totalMeasuresInSection}
              totalDurationFormatted={totalDurationFormatted}
              onTogglePlay={togglePlay}
              onStop={stop}
              onToggleMute={toggleMute}
            />
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {sections.length} {sections.length === 1 ? 'Sección' : 'Secciones'}
            </span>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              totalSections={sections.length}
              isAdmin={true}
              isEditing={true}
              isCollapsed={!!collapsedSections[section.id]}
              globalKey={key}
              globalTimeSignature={timeSignature}
              globalTempo={tempo}
              isPlaying={isPlaying}
              activeMeasureId={currentMeasure?.measure.id || null}
              measureDurationMs={currentMeasure?.durationMs}
              onToggleCollapse={handleToggleCollapse}
              onUpdateLabel={(secId, newLabel) => {
                setSections(
                  sections.map((s) => (s.id === secId ? { ...s, label: newLabel } : s))
                )
              }}
              onUpdateSectionKey={handleUpdateSectionKey}
              onUpdateSectionTempo={handleUpdateSectionTempo}
              onUpdateRepeatCount={handleUpdateSectionRepeatCount}
              onApplyProgression={handleApplyProgression}
              onApplySectionCadence={handleApplySectionCadence}
              onMoveUp={handleMoveSectionUp}
              onMoveDown={handleMoveSectionDown}
              onDuplicate={handleDuplicateSection}
              onRemove={handleRemoveSection}
              onUpdateGuideLyrics={(secId, newLyrics) => {
                setSections(
                  sections.map((s) => (s.id === secId ? { ...s, guideLyrics: newLyrics } : s))
                )
              }}
              onUpdateLyrics={(secId, newLyrics) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === secId ? { ...s, lyrics: newLyrics } : s))
                )
              }}
              onMeasureClick={(clickedMeasure) => {
                jumpToMeasureId(clickedMeasure.id)
              }}
              onUpdateMeasures={(secId, updated) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === secId ? { ...s, measures: updated } : s))
                )
              }}
              onAddMeasures={handleAddMeasuresToSection}
              onRemoveMeasure={handleRemoveMeasure}
            />
          ))}
        </div>
      </div>

      {/* Barra de Creación de Nuevas Secciones */}
      <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Añadir una nueva sección a la estructura armónica:
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {SECTION_TYPES.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddSection(opt.value)}
              className="text-xs font-bold gap-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-500"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ {opt.label}</span>
            </Button>
          ))}
        </div>
      </div>
      {/* Modal Asistente de Enlace de YouTube */}
      <YouTubeLinkModal
        isOpen={isYouTubeModalOpen}
        initialUrl={youtubeUrl}
        songTitle={title || 'la canción'}
        onClose={() => setIsYouTubeModalOpen(false)}
        onSave={(newUrl) => setYoutubeUrl(newUrl || '')}
      />
    </form>
  )
}
