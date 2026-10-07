'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Music,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  DEFAULT_PRESET_INSTRUMENTS,
  type Section,
  type SongInput,
} from '@/lib/validations/song'
import { SectionInstrumentPicker } from '@/components/songs/SectionInstrumentPicker'
import { createSongAction, updateSongAction } from '@/app/actions/songs'

const SECTION_OPTIONS = [
  { value: 'intro', label: 'Intro' },
  { value: 'verse', label: 'Verso / Estrofa' },
  { value: 'prechorus', label: 'Pre-Coro' },
  { value: 'chorus', label: 'Coro' },
  { value: 'bridge', label: 'Puente' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'solo', label: 'Solo' },
  { value: 'outro', label: 'Outro' },
]

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

interface SongFormProps {
  initialData?: Partial<SongInput> & { id?: string }
  isEditing?: boolean
}

export function SongForm({ initialData, isEditing = false }: SongFormProps) {
  const router = useRouter()

  // Estado general de la canción
  const [title, setTitle] = useState(initialData?.title || '')
  const [artist, setArtist] = useState(initialData?.artist || '')
  const [key, setKey] = useState(initialData?.key || 'C')
  const [timeSignature, setTimeSignature] = useState(initialData?.timeSignature || '4/4')
  const [tempo, setTempo] = useState<number>(initialData?.tempo || 120)
  const [genre, setGenre] = useState(initialData?.genre || '')

  // Pool global de instrumentos disponibles en este formulario (compartido entre secciones)
  const [availableInstruments, setAvailableInstruments] = useState<string[]>(() => {
    const existingFromSections = (initialData?.sections || []).flatMap(
      (sec) => sec.instruments || []
    )
    return Array.from(
      new Set([
        ...DEFAULT_PRESET_INSTRUMENTS,
        ...(initialData?.instruments || []),
        ...existingFromSections,
      ])
    )
  })

  // Secciones de la canción con soporte de array de instrumentos por sección
  const [sections, setSections] = useState<Section[]>(() => {
    if (initialData?.sections && initialData.sections.length > 0) {
      return initialData.sections.map((s, idx) => ({
        id: s.id || `sec-${idx}-${Date.now()}`,
        type: s.type || 'verse',
        label: s.label || `Sección ${idx + 1}`,
        instruments: Array.isArray(s.instruments) ? s.instruments : [],
        timeSignature: s.timeSignature || timeSignature,
        lines: s.lines || [{ id: `l-${Date.now()}`, lyrics: '', chords: [] }],
      }))
    }
    // Sección por defecto si es nueva canción
    return [
      {
        id: `sec-${Date.now()}-1`,
        type: 'intro',
        label: 'Intro 1',
        instruments: ['Piano', 'Pad'],
        timeSignature: '4/4',
        lines: [{ id: `line-${Date.now()}-1`, lyrics: 'Instrumental', chords: [] }],
      },
      {
        id: `sec-${Date.now()}-2`,
        type: 'verse',
        label: 'Verso 1',
        instruments: ['Guitarra Acústica', 'Voz Lead'],
        timeSignature: '4/4',
        lines: [{ id: `line-${Date.now()}-2`, lyrics: 'Primera estrofa...', chords: [] }],
      },
    ]
  })

  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  /**
   * Agrega un nuevo instrumento al pool compartido para que todas las secciones lo vean.
   */
  const handleAddCustomInstrumentToPool = (newInstrument: string) => {
    const sanitized = newInstrument.trim()
    if (!sanitized) return

    setAvailableInstruments((prev) => {
      const exists = prev.some((i) => i.toLowerCase() === sanitized.toLowerCase())
      return exists ? prev : [...prev, sanitized]
    })
  }

  /**
   * Actualiza el array de instrumentos de una sección específica.
   */
  const handleUpdateSectionInstruments = (sectionId: string, updatedInstruments: string[]) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId ? { ...sec, instruments: updatedInstruments } : sec
      )
    )
  }

  /**
   * Agrega una nueva sección a la estructura.
   */
  const handleAddSection = (type: string) => {
    const matched = SECTION_OPTIONS.find((opt) => opt.value === type)
    const labelPrefix = matched?.label.split('/')[0].trim() || type
    const sameTypeCount = sections.filter((s) => s.type === type).length
    const label = `${labelPrefix} ${sameTypeCount + 1}`

    const newSection: Section = {
      id: `sec-${Date.now()}`,
      type,
      label,
      instruments: [], // Inicialmente sin instrumentos asignados
      timeSignature,
      lines: [{ id: `line-${Date.now()}`, lyrics: '', chords: [] }],
    }

    setSections((prev) => [...prev, newSection])
  }

  /**
   * Elimina una sección.
   */
  const handleRemoveSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
  }

  /**
   * Reordena secciones arriba/abajo.
   */
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sections.length) return

    setSections((prev) => {
      const copy = [...prev]
      const [item] = copy.splice(index, 1)
      copy.splice(targetIndex, 0, item)
      return copy
    })
  }

  /**
   * Manejo del Submit del formulario con Server Action y validación.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFeedback(null)

    try {
      // 1. Preparar el payload con el array de secciones e instrumentos limpios
      const payload: SongInput = {
        title: title.trim(),
        artist: artist.trim(),
        key,
        timeSignature,
        tempo: Number(tempo) || 120,
        genre: genre.trim() || undefined,
        // Instrumentos globales consolidados de todas las secciones
        instruments: Array.from(
          new Set(sections.flatMap((s) => s.instruments))
        ),
        // Secciones completas con su array de instrumentos por sección
        sections: sections.map((sec) => ({
          id: sec.id,
          type: sec.type,
          label: sec.label,
          instruments: sec.instruments || [],
          timeSignature: sec.timeSignature || timeSignature,
          lines: sec.lines || [],
        })),
        content: initialData?.content || '',
        lyrics: initialData?.lyrics || '',
      }

      // 2. Ejecutar Server Action (o fallback a API route según corresponda)
      if (isEditing && initialData?.id) {
        await updateSongAction(initialData.id, payload)
        setFeedback({ type: 'success', message: '¡Canción y secciones actualizadas con éxito!' })
      } else {
        const result = await createSongAction(payload)
        setFeedback({ type: 'success', message: '¡Canción guardada correctamente!' })
        if (result?.song?.id) {
          router.push(`/dashboard/songs/${result.song.id}`)
          return
        }
      }

      router.refresh()
    } catch (err: any) {
      console.error('Error al guardar canción:', err)
      setFeedback({
        type: 'error',
        message: err?.message || 'Ocurrió un error al guardar la canción.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      {/* Notificación de feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Datos Generales de la Canción */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700">
          <Music className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Información General de la Canción
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Título de la Canción *"
            placeholder="Ej. Amazing Grace, Eres Todopoderoso"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Artista / Banda"
            placeholder="Ej. Hillsong, En Espíritu y en Verdad"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tonalidad
            </label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500"
            >
              {MUSICAL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k} Mayor
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Compás
            </label>
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500"
            >
              {['2/4', '3/4', '4/4', '6/8', '12/8'].map((ts) => (
                <option key={ts} value={ts}>
                  {ts}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tempo (BPM)
            </label>
            <input
              type="number"
              min={40}
              max={240}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Género
            </label>
            <input
              type="text"
              placeholder="Worship, Balada..."
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Secciones con Selector de Instrumentos */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Estructura & Instrumentación por Sección
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold">
              {sections.length} secciones
            </span>
          </div>

          {/* Menú para agregar secciones */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 font-medium mr-1">Agregar:</span>
            {SECTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleAddSection(opt.value)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:border-primary-400 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Plus className="w-3 h-3 text-primary-500" />
                <span>{opt.label.split('/')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Secciones */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4 transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              {/* Encabezado de la sección */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={section.label}
                    onChange={(e) => {
                      const newLabel = e.target.value
                      setSections((prev) =>
                        prev.map((s) => (s.id === section.id ? { ...s, label: newLabel } : s))
                      )
                    }}
                    className="font-bold text-base text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none px-1"
                  />
                  <span className="text-xs text-gray-400 font-mono">
                    ({section.timeSignature || timeSignature})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => handleMoveSection(index, 'up')}
                    className="h-8 w-8 p-0"
                    title="Mover sección arriba"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === sections.length - 1}
                    onClick={() => handleMoveSection(index, 'down')}
                    className="h-8 w-8 p-0"
                    title="Mover sección abajo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSection(section.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Eliminar sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* SELECTOR DE INSTRUMENTOS DE LA SECCIÓN */}
              <div className="p-3 bg-gray-50/70 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                <SectionInstrumentPicker
                  selectedInstruments={section.instruments || []}
                  availableInstruments={availableInstruments}
                  onChange={(newInstruments) =>
                    handleUpdateSectionInstruments(section.id, newInstruments)
                  }
                  onAddCustomInstrument={handleAddCustomInstrumentToPool}
                />
              </div>

              {/* Letras / acordes simplificados para esta sección */}
              <div className="text-xs text-gray-500">
                <label className="block font-medium mb-1 text-gray-600 dark:text-gray-400">
                  Letra / Notas de la sección:
                </label>
                <textarea
                  rows={2}
                  value={section.lines?.[0]?.lyrics || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setSections((prev) =>
                      prev.map((s) =>
                        s.id === section.id
                          ? {
                              ...s,
                              lines: [{ id: s.lines?.[0]?.id || 'l1', lyrics: val, chords: [] }],
                            }
                          : s
                      )
                    )
                  }}
                  placeholder="Escribe la letra o acordes de esta sección..."
                  className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Guardado */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex items-center gap-2 px-6"
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Actualizar Canción' : 'Guardar Canción'}</span>
        </Button>
      </div>
    </form>
  )
}
