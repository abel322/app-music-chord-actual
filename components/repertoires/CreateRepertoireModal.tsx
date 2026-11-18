'use client'

import React, { useState } from 'react'
import { FolderPlus, X, Check, Search, Music, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RepertoireData } from '@/types/repertoire'

interface SongOption {
  id: string
  title: string
  artist: string | null
  key: string | null
}

interface CreateRepertoireModalProps {
  isOpen: boolean
  onClose: () => void
  allSongs: SongOption[]
  onRepertoireCreated: (newRep: RepertoireData) => void
}

const COLOR_OPTIONS = [
  { value: 'indigo', label: 'Índigo', bg: 'bg-indigo-600', ring: 'ring-indigo-400' },
  { value: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
  { value: 'violet', label: 'Violeta', bg: 'bg-violet-600', ring: 'ring-violet-400' },
  { value: 'amber', label: 'Ámbar', bg: 'bg-amber-600', ring: 'ring-amber-400' },
  { value: 'rose', label: 'Rosa', bg: 'bg-rose-600', ring: 'ring-rose-400' },
  { value: 'sky', label: 'Cielo', bg: 'bg-sky-600', ring: 'ring-sky-400' },
]

export function CreateRepertoireModal({
  isOpen,
  onClose,
  allSongs,
  onRepertoireCreated,
}: CreateRepertoireModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('indigo')
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [songSearch, setSongSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredSongs = allSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      (s.artist && s.artist.toLowerCase().includes(songSearch.toLowerCase())) ||
      (s.key && s.key.toLowerCase().includes(songSearch.toLowerCase()))
  )

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('Por favor ingresa un nombre para la carpeta o repertorio.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/repertoires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim().toUpperCase(),
          description: description.trim() || null,
          color,
          songIds: selectedSongIds,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la carpeta')
      }

      onRepertoireCreated(data.repertoire)
      setName('')
      setDescription('')
      setSelectedSongIds([])
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al comunicarse con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Nueva Carpeta / Repertorio
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organiza setlists para conciertos y presentaciones en vivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Nombre de la Carpeta *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Ej: CONCIERTO DOMINGO, ADORACIÓN, ACÚSTICO..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-gray-900 dark:text-white uppercase placeholder:normal-case placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Descripción o Fecha del Evento <span className="font-normal text-gray-400">(Opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Culto de Jóvenes 19:00 hrs • 8 Canciones"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color del Repertorio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Etiqueta de Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all flex items-center justify-center text-white cursor-pointer ${
                    color === c.value ? `ring-3 ${c.ring} scale-110 shadow-sm` : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {color === c.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Selección de Canciones Iniciales */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Incluir Canciones ({selectedSongIds.length})
              </label>
              {selectedSongIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSongIds([])}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Deseleccionar todas
                </button>
              )}
            </div>

            {/* Búsqueda rápida de canciones */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder="Filtrar canciones..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Lista scrollable de canciones */}
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-gray-200 dark:border-slate-800 p-1.5 bg-gray-50/50 dark:bg-slate-950/40 divide-y divide-gray-100 dark:divide-slate-800/60">
              {filteredSongs.length === 0 ? (
                <p className="text-center py-4 text-xs text-gray-400">
                  No se encontraron canciones coincidentes.
                </p>
              ) : (
                filteredSongs.map((s) => {
                  const isSelected = selectedSongIds.includes(s.id)
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSongSelection(s.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800/60 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="truncate">
                          <span className="truncate block">{s.title}</span>
                          {s.artist && (
                            <span className="text-[10px] text-gray-400 font-normal truncate block">
                              {s.artist}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                        {s.key || 'C'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              {isSubmitting ? 'Creando...' : 'Crear Carpeta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
