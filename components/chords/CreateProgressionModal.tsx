'use client'

import React, { useState, useMemo } from 'react'
import { X, Sparkles, Plus, Check, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { degreeToChord, HarmonicProgression } from '@/lib/harmonic-theory'
import { saveCustomProgression } from '@/lib/custom-harmonics'
import { cn } from '@/lib/utils'

interface CreateProgressionModalProps {
  isOpen: boolean
  onClose: () => void
  currentKey?: string
  onCreated?: (progression: HarmonicProgression) => void
}

const GENRE_OPTIONS: Array<HarmonicProgression['genre']> = [
  'Pop',
  'Jazz',
  'Rock',
  'Gospel',
  'Balada',
  'Latino',
  'Modal',
  'Personalizada',
]

const QUICK_DEGREE_BUTTONS = [
  'I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°',
  'i', '♭II', 'bIII', 'iv', 'v', '♭VI', '♭VII',
  'V7', 'Imaj7', 'ii7', 'IVmaj7', 'vi7', 'iiø7'
]

export function CreateProgressionModal({
  isOpen,
  onClose,
  currentKey = 'C',
  onCreated,
}: CreateProgressionModalProps) {
  const [name, setName] = useState('')
  const [degreesInput, setDegreesInput] = useState('')
  const [genre, setGenre] = useState<HarmonicProgression['genre']>('Pop')
  const [barsCount, setBarsCount] = useState<number>(4)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Parsear grados introducidos (separa por flechas, guiones, comas o espacios)
  const parsedDegrees = useMemo(() => {
    return degreesInput
      .replace(/->/g, ' ')
      .replace(/→/g, ' ')
      .replace(/-/g, ' ')
      .replace(/,/g, ' ')
      .split(/\s+/)
      .map((d) => d.trim())
      .filter(Boolean)
  }, [degreesInput])

  // Acordes reales calculados en la tonalidad actual
  const previewChords = useMemo(() => {
    return parsedDegrees.map((deg) => degreeToChord(deg, currentKey))
  }, [parsedDegrees, currentKey])

  if (!isOpen) return null

  const handleAddDegree = (deg: string) => {
    setDegreesInput((prev) => {
      const clean = prev.trim()
      if (!clean) return deg
      return `${clean} - ${deg}`
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Por favor indica un nombre para la progresión.')
      return
    }
    if (parsedDegrees.length < 2) {
      setError('Introduce al menos 2 grados armónicos (ej: I - V - vi - IV).')
      return
    }

    setError(null)
    const newProg = saveCustomProgression({
      name: name.trim(),
      degrees: parsedDegrees,
      genre,
      barsCount: barsCount || parsedDegrees.length,
      description: description.trim() || `Progresión personalizada de ${parsedDegrees.length} compases`,
    })

    if (onCreated) {
      onCreated(newProg)
    }

    // Reset y cerrar
    setName('')
    setDegreesInput('')
    setDescription('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Nueva Progresión Armónica
              </h2>
              <p className="text-xs text-slate-500">
                Define una secuencia en grados romanos con transposición automática.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la Progresión */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Nombre Descriptivo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pop Elevado, Gospel Turnaround, Royal Road Soul..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Grados Armónicos (Números Romanos) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Grados Armónicos (Números Romanos) *
              </label>
              <span className="text-[11px] text-slate-400">
                Separados por guion o espacio
              </span>
            </div>
            <input
              type="text"
              value={degreesInput}
              onChange={(e) => setDegreesInput(e.target.value)}
              placeholder="Ej: I - V - vi - IV  o  ii7 -> V7 -> Imaj7"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {/* Atajos Rápidos de Grados */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                Insertar grado con un clic:
              </span>
              <div className="flex flex-wrap gap-1">
                {QUICK_DEGREE_BUTTONS.map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => handleAddDegree(deg)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/60 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    +{deg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vista Previa Interactiva en Tonalidad Activa */}
          {parsedDegrees.length > 0 && (
            <div className="p-3.5 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200/80 dark:border-primary-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-primary-700 dark:text-primary-300">
                <span className="flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" /> Vista Previa en Tono {currentKey}:
                </span>
                <span className="text-[10px] bg-primary-200/60 dark:bg-primary-900/60 px-2 py-0.5 rounded-full font-mono">
                  {parsedDegrees.length} acordes
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {parsedDegrees.map((deg, idx) => {
                  const chord = previewChords[idx] || deg
                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[55px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/80 text-center shadow-sm"
                    >
                      <span className="block font-mono text-sm font-black text-slate-900 dark:text-white">
                        {chord}
                      </span>
                      <span className="block font-mono text-[10px] font-bold text-primary-600 dark:text-primary-400">
                        {deg}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Categoría / Género y Longitud en Compases */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Género / Estilo
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Compases de Duración
              </label>
              <select
                value={barsCount}
                onChange={(e) => setBarsCount(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={2}>2 Compases</option>
                <option value={4}>4 Compases</option>
                <option value={8}>8 Compases</option>
                <option value={12}>12 Compases</option>
                <option value={16}>16 Compases</option>
              </select>
            </div>
          </div>

          {/* Descripción opcional */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Notas o Descripción (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Ideal para puentes emotivos o cambios de tono"
              className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" size="sm" className="gap-1.5 font-bold">
              <Check className="w-4 h-4" />
              <span>Guardar Progresión</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
