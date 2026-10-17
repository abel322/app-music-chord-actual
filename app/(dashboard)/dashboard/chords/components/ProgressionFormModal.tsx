'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, Music2, Sparkles, AlertCircle } from 'lucide-react'
import { ProgressionDef, GENRES } from '@/lib/data/chordProgressions'
import { parseChordInput } from '@/lib/chord-voicing'

const AVAILABLE_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const PRESET_GENRES = GENRES.filter((g) => g !== 'All')

interface ProgressionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (progression: ProgressionDef) => void
  progressionToEdit?: ProgressionDef | null
  existingGenres?: string[]
}

export function ProgressionFormModal({
  isOpen,
  onClose,
  onSave,
  progressionToEdit,
  existingGenres = [],
}: ProgressionFormModalProps) {
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('Lo-Fi / Chill')
  const [customGenre, setCustomGenre] = useState('')
  const [isCustomGenre, setIsCustomGenre] = useState(false)
  const [key, setKey] = useState('C')
  const [bpm, setBpm] = useState(120)
  const [chordSequence, setChordSequence] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Lista combinada de géneros para sugerir
  const allGenresList = useMemo(() => {
    const combined = new Set([...PRESET_GENRES, ...existingGenres.filter((g) => g !== 'All')])
    return Array.from(combined)
  }, [existingGenres])

  // Cargar datos cuando se abre para editar o crear
  useEffect(() => {
    if (!isOpen) return

    if (progressionToEdit) {
      setName(progressionToEdit.name)
      setKey(progressionToEdit.key || 'C')
      setBpm(progressionToEdit.bpm || 120)
      setChordSequence(progressionToEdit.chords.map((c) => c.name).join(', '))

      if (PRESET_GENRES.includes(progressionToEdit.genre)) {
        setGenre(progressionToEdit.genre)
        setIsCustomGenre(false)
        setCustomGenre('')
      } else {
        setGenre('custom')
        setIsCustomGenre(true)
        setCustomGenre(progressionToEdit.genre)
      }
    } else {
      // Estado inicial limpio para nueva progresión
      setName('')
      setGenre('Lo-Fi / Chill')
      setIsCustomGenre(false)
      setCustomGenre('')
      setKey('C')
      setBpm(120)
      setChordSequence('')
    }
    setError(null)
  }, [isOpen, progressionToEdit])

  // Previsualización en tiempo real de acordes
  const parsedChords = useMemo(() => {
    return parseChordInput(chordSequence)
  }, [chordSequence])

  if (!isOpen) return null

  const isEditing = Boolean(progressionToEdit)
  const modalTitle = isEditing
    ? `Editar Progresión: ${progressionToEdit?.name || ''}`
    : 'Nueva Progresión'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Por favor, ingresa un título para la progresión.')
      return
    }

    const finalGenre = isCustomGenre ? customGenre.trim() : genre.trim()
    if (!finalGenre) {
      setError('Por favor, selecciona o escribe un género.')
      return
    }

    if (parsedChords.length === 0) {
      setError('Debes ingresar al menos un acorde válido (ej. "Ebmaj9, G7#5, Cm9, Fm9, Bb13").')
      return
    }

    const parsedBpm = Number(bpm)
    const validBpm = isNaN(parsedBpm) ? 120 : Math.min(240, Math.max(40, parsedBpm))

    const newProgression: ProgressionDef = {
      id: progressionToEdit ? progressionToEdit.id : `prog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      genre: finalGenre,
      key,
      bpm: validBpm,
      chords: parsedChords,
    }

    onSave(newProgression)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-lg w-full p-6 sm:p-8 overflow-y-auto max-h-[90vh] transition-all">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {modalTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Personaliza acordes, tonalidad y tempo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de error si falla validación */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Título */}
          <div>
            <label
              htmlFor="input-progression-title"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Título de la Progresión <span className="text-purple-500">*</span>
            </label>
            <input
              id="input-progression-title"
              data-testid="progression-title-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Gospel Praise, Late Night Study..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm"
            />
          </div>

          {/* 2. Género / Categoría */}
          <div>
            <label
              htmlFor="select-progression-genre"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Género / Categoría <span className="text-purple-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                id="select-progression-genre"
                data-testid="progression-genre-select"
                value={isCustomGenre ? 'custom' : genre}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomGenre(true)
                  } else {
                    setIsCustomGenre(false)
                    setGenre(e.target.value)
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm"
              >
                {allGenresList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="custom">+ Escribir otro género...</option>
              </select>

              {isCustomGenre && (
                <input
                  id="input-custom-genre"
                  data-testid="custom-genre-input"
                  type="text"
                  required
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Nombre del nuevo género..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm"
                />
              )}
            </div>
          </div>

          {/* 3. Tonalidad (Key) y 4. BPM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="select-progression-key"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Tonalidad (Key)
              </label>
              <select
                id="select-progression-key"
                data-testid="progression-key-select"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm"
              >
                {AVAILABLE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="input-progression-bpm"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
              >
                BPM (Tempo)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-progression-bpm"
                  data-testid="progression-bpm-input"
                  type="number"
                  min={40}
                  max={240}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* 5. Secuencia de Acordes */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="input-chord-sequence"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Secuencia de Acordes <span className="text-purple-500">*</span>
              </label>
              <span className="text-xs text-gray-400">
                Separados por comas o espacios
              </span>
            </div>
            <input
              id="input-chord-sequence"
              data-testid="chord-sequence-input"
              type="text"
              required
              value={chordSequence}
              onChange={(e) => setChordSequence(e.target.value)}
              placeholder="Ej. Ebmaj9, G7#5, Cm9, Fm9, Bb13"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm font-mono"
            />

            {/* Previsualización en tiempo real */}
            <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                <Music2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Previsualización en tiempo real ({parsedChords.length} acordes):</span>
              </div>

              {parsedChords.length > 0 ? (
                <div
                  id="preview-chord-pills"
                  data-testid="preview-chord-pills"
                  className="flex flex-wrap gap-2"
                >
                  {parsedChords.map((chord, idx) => (
                    <span
                      key={`${chord.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs animate-in fade-in zoom-in-95 duration-150"
                    >
                      <span>{chord.name}</span>
                      <span className="text-[10px] opacity-60">
                        ({chord.notes.length} notas)
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Escribe los acordes arriba para ver la vista previa (ej. Ebmaj9, G7#5, Cm9, Fm9, Bb13)
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              id="btn-cancel-progression"
              data-testid="cancel-progression-btn"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-progression"
              data-testid="save-progression-btn"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              Guardar Progresión
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
