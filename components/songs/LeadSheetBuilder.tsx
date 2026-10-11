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
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MeasureGrid } from '@/components/chords/MeasureGrid'
import { ProgressionPicker } from '@/components/chords/ProgressionPicker'
import { CadencePicker } from '@/components/chords/CadencePicker'
import { SectionMeasures, Measure } from '@/types/measure'
import { 
  ensureSectionMeasures, 
  generateMeasures, 
  applyProgressionToMeasures, 
  transposeSectionMeasures 
} from '@/lib/measure-utils'
import { POPULAR_PROGRESSIONS, getProgressionChords, HarmonicProgression, CadenceDefinition } from '@/lib/harmonic-theory'
import { getDiatonicChords } from '@/lib/music-theory'
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
  { value: 'instrumental', label: 'Instrumental' },
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

  // Estados de proceso
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
          measures: generateMeasures(4, 1, initialData?.timeSignature || '4/4', [initialData?.key || 'C']),
        },
        {
          id: `sec-verse-${Date.now()}`,
          type: 'verse',
          label: 'Estrofa 1',
          timeSignature: initialData?.timeSignature || '4/4',
          instruments: [],
          measures: generateMeasures(4, 5, initialData?.timeSignature || '4/4', [initialData?.key || 'C']),
        },
      ]
    }

    return rawSections.map((sec, idx) =>
      ensureSectionMeasures(sec, idx, initialData?.timeSignature || '4/4', counter)
    )
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

  // Actualizar los compases de una sección específica
  const handleUpdateSectionMeasures = (sectionId: string, updatedMeasures: Measure[]) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, measures: updatedMeasures } : sec))
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
    const progressionChords = getProgressionChords(prog, key)
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        return {
          ...sec,
          measures: applyProgressionToMeasures(sec.measures, progressionChords, sec.timeSignature || timeSignature),
        }
      })
    )
  }

  // Marcar cadencia en el compás final de la sección
  const handleApplySectionCadence = (sectionId: string, cad: CadenceDefinition | null) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId || sec.measures.length === 0) return sec
        const lastIdx = sec.measures.length - 1
        const updatedMeasures = [...sec.measures]
        updatedMeasures[lastIdx] = {
          ...updatedMeasures[lastIdx],
          cadence: cad ? cad.id || cad.type : undefined,
          cadenceLabel: cad ? `${cad.name} (${cad.degrees})` : undefined,
          cadenceColor: cad ? cad.colorBadge : undefined,
        }
        return { ...sec, measures: updatedMeasures }
      })
    )
  }

  // Añadir nueva sección completa
  const handleAddSection = (type: string) => {
    const typeObj = SECTION_TYPES.find((s) => s.value === type)
    const countSameType = sections.filter((s) => s.type === type).length
    const label = `${typeObj?.label || 'Sección'} ${countSameType + 1}`

    const allMeasuresCount = sections.reduce((acc, s) => acc + s.measures.length, 0)
    const newMeasures = generateMeasures(4, allMeasuresCount + 1, timeSignature, [key])

    const newSection: SectionMeasures = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      timeSignature,
      instruments: [],
      measures: newMeasures,
    }

    setSections([...sections, newSection])
  }

  // Duplicar una sección completa
  const handleDuplicateSection = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId)
    if (!sec) return

    const duplicated: SectionMeasures = {
      ...sec,
      id: `sec-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `${sec.label} (Copia)`,
      measures: sec.measures.map((m) => ({
        ...m,
        id: `m-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    }

    setSections([...sections, duplicated])
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
    if (index === 0) return
    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    setSections(updated)
  }

  // Mover sección abajo
  const handleMoveSectionDown = (index: number) => {
    if (index >= sections.length - 1) return
    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
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
      // Extraer letras de guía de los compases para alimentar el campo lyrics si está vacío
      const extractedLyrics = sections
        .flatMap((s) => [
          `[${s.label}]`,
          ...s.measures.map((m) => m.guideLyric?.trim()).filter(Boolean),
          '',
        ])
        .join('\n')
        .trim()

      const payload = {
        title: title.trim(),
        artist: artist.trim() || undefined,
        key,
        timeSignature,
        tempo,
        genre: genre.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        lyrics: initialData?.lyrics || (extractedLyrics.length > 0 ? extractedLyrics : undefined),
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
              onChange={(e) => setTimeSignature(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="4/4">4/4 (Cuatro Tiempos)</option>
              <option value="3/4">3/4 (Tres Tiempos / Vals)</option>
              <option value="2/4">2/4 (Dos Tiempos)</option>
              <option value="6/8">6/8 (Compuesto / Balada)</option>
              <option value="12/8">12/8 (Blues / Soul)</option>
            </select>
          </div>

          {/* Tempo BPM */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tempo (BPM)
            </label>
            <input
              type="number"
              min={30}
              max={280}
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
            />
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
        </div>
      </div>

      {/* Secciones y Constructor de Lead Sheet por Compases */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-500" />
              <span>Estructura de Secciones por Compases</span>
            </h2>
            <p className="text-xs text-slate-500">
              Cada sección contiene compases interactivos de 4 tiempos con detección automática de cadencias armónicas.
            </p>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {sections.length} {sections.length === 1 ? 'Sección' : 'Secciones'}
          </span>
        </div>

        {sections.map((section, index) => {
          return (
            <div
              key={section.id}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-all"
            >
              {/* Barra de Título de la Sección, Progresiones y Acciones */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs uppercase">
                    {section.type.slice(0, 3)}
                  </div>

                  <input
                    type="text"
                    value={section.label}
                    onChange={(e) => {
                      const updatedLabel = e.target.value
                      setSections(
                        sections.map((s) =>
                          s.id === section.id ? { ...s, label: updatedLabel } : s
                        )
                      )
                    }}
                    className="font-black text-base sm:text-lg text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 -ml-1"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    ({section.measures.length} compases)
                  </span>
                </div>

                {/* Acciones de Sección y Selector de Progresiones */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Selector Desacoplado de Progresiones */}
                  <ProgressionPicker
                    currentKey={key}
                    buttonLabel="✦ Progresión de Sección"
                    buttonVariant="subtle"
                    onSelectProgression={(prog) => handleApplyProgression(section.id, prog)}
                  />

                  {/* Selector Desacoplado de Cadencias al cierre de sección */}
                  <CadencePicker
                    buttonLabel="✦ Cadencia Final"
                    buttonVariant="subtle"
                    onSelectCadence={(cad) => handleApplySectionCadence(section.id, cad)}
                  />

                  {/* Duplicar Sección */}
                  <button
                    type="button"
                    onClick={() => handleDuplicateSection(section.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Duplicar sección completa"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Mover Arriba / Abajo */}
                  <button
                    type="button"
                    onClick={() => handleMoveSectionUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                    title="Mover sección arriba"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSectionDown(index)}
                    disabled={index === sections.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                    title="Mover sección abajo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Eliminar Sección */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(section.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Eliminar sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rejilla de Compases Interactiva */}
              <MeasureGrid
                measures={section.measures}
                timeSignature={section.timeSignature || timeSignature}
                currentKey={key}
                diatonicChords={diatonicChords}
                isEditing={true}
                onUpdateMeasures={(updated) => handleUpdateSectionMeasures(section.id, updated)}
                onAddMeasures={(count) => handleAddMeasuresToSection(section.id, count)}
                onRemoveMeasure={(measureId) => handleRemoveMeasure(section.id, measureId)}
              />
            </div>
          )
        })}
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
    </form>
  )
}
