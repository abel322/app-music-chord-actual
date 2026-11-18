'use client'

import React, { useState, useEffect } from 'react'
import { Settings, X, ArrowUp, ArrowDown, Trash2, Plus, Check, Search, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RepertoireData, RepertoireSongItem } from '@/types/repertoire'

interface SongOption {
  id: string
  title: string
  artist: string | null
  key: string | null
}

interface ManageRepertoireModalProps {
  isOpen: boolean
  onClose: () => void
  repertoire: RepertoireData
  allSongs: SongOption[]
  onRepertoireUpdated: (updated: RepertoireData) => void
  onRepertoireDeleted: (deletedId: string) => void
}

const COLOR_OPTIONS = [
  { value: 'indigo', label: 'Índigo', bg: 'bg-indigo-600', ring: 'ring-indigo-400' },
  { value: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
  { value: 'violet', label: 'Violeta', bg: 'bg-violet-600', ring: 'ring-violet-400' },
  { value: 'amber', label: 'Ámbar', bg: 'bg-amber-600', ring: 'ring-amber-400' },
  { value: 'rose', label: 'Rosa', bg: 'bg-rose-600', ring: 'ring-rose-400' },
  { value: 'sky', label: 'Cielo', bg: 'bg-sky-600', ring: 'ring-sky-400' },
]

export function ManageRepertoireModal({
  isOpen,
  onClose,
  repertoire,
  allSongs,
  onRepertoireUpdated,
  onRepertoireDeleted,
}: ManageRepertoireModalProps) {
  const [name, setName] = useState(repertoire.name)
  const [description, setDescription] = useState(repertoire.description || '')
  const [color, setColor] = useState(repertoire.color || 'indigo')
  const [songsList, setSongsList] = useState<RepertoireSongItem[]>(repertoire.songs || [])
  const [addSongSearch, setAddSongSearch] = useState('')
  const [isAddingSong, setIsAddingSong] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setName(repertoire.name)
    setDescription(repertoire.description || '')
    setColor(repertoire.color || 'indigo')
    setSongsList(repertoire.songs || [])
  }, [repertoire])

  if (!isOpen) return null

  // Canciones disponibles para añadir que no estén ya en el repertorio
  const existingSongIds = new Set(songsList.map((s) => s.songId))
  const availableToAdd = allSongs.filter(
    (s) =>
      !existingSongIds.has(s.id) &&
      (s.title.toLowerCase().includes(addSongSearch.toLowerCase()) ||
        (s.artist && s.artist.toLowerCase().includes(addSongSearch.toLowerCase())))
  )

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= songsList.length) return

    const copy = [...songsList]
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp

    // Reasignar order consecutivo
    const reordered = copy.map((item, idx) => ({ ...item, order: idx }))
    setSongsList(reordered)
  }

  const handleRemoveSong = (songId: string) => {
    const filtered = songsList.filter((s) => s.songId !== songId)
    const reordered = filtered.map((item, idx) => ({ ...item, order: idx }))
    setSongsList(reordered)
  }

  const handleAddSong = (song: SongOption) => {
    const newItem: RepertoireSongItem = {
      id: `temp-${Date.now()}-${song.id}`,
      repertoireId: repertoire.id,
      songId: song.id,
      order: songsList.length,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        tempo: 120,
        timeSignature: '4/4',
      },
    }
    setSongsList([...songsList, newItem])
    setIsAddingSong(false)
    setAddSongSearch('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('El nombre no puede estar vacío')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/repertoires/${repertoire.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim().toUpperCase(),
          description: description.trim() || null,
          color,
          orderedSongIds: songsList.map((s) => s.songId),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el repertorio')
      }

      onRepertoireUpdated(data.repertoire)
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al comunicarse con el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la carpeta «${repertoire.name}»? (Las canciones no se borrarán de la biblioteca general).`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/repertoires/${repertoire.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }

      onRepertoireDeleted(repertoire.id)
      onClose()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la carpeta')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Gestionar Carpeta: {repertoire.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ajusta el orden del concierto, añade o retira canciones.
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-semibold text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Descripción o Fecha
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Culto Dominical 10:00 AM"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color */}
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

          {/* Lista de Canciones en Orden de Ejecución */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Secuencia de Concierto ({songsList.length} canciones)
              </label>
              <button
                type="button"
                onClick={() => setIsAddingSong(!isAddingSong)}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Canción</span>
              </button>
            </div>

            {/* Selector desplegable para añadir canciones */}
            {isAddingSong && (
              <div className="p-3 mb-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={addSongSearch}
                    onChange={(e) => setAddSongSearch(e.target.value)}
                    placeholder="Buscar canción de la biblioteca..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white"
                    autoFocus
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-gray-100 dark:divide-slate-800">
                  {availableToAdd.length === 0 ? (
                    <p className="text-center py-2 text-xs text-gray-400">
                      No hay canciones disponibles para añadir.
                    </p>
                  ) : (
                    availableToAdd.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleAddSong(s)}
                        className="flex items-center justify-between p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg cursor-pointer text-xs transition-colors"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-gray-900 dark:text-white block truncate">
                            {s.title}
                          </span>
                          {s.artist && (
                            <span className="text-[10px] text-gray-400 block truncate">
                              {s.artist}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                          {s.key || 'C'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Lista ordenada */}
            {songsList.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                Esta carpeta está vacía. Añade canciones con el botón superior.
              </p>
            ) : (
              <div className="space-y-1.5">
                {songsList.map((item, idx) => (
                  <div
                    key={item.songId}
                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-950/60 border border-gray-200/80 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Badge #1, #2, #3 */}
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-gray-900 dark:text-white block truncate">
                          {item.song.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          {item.song.artist && <span>{item.song.artist}</span>}
                          <span className="font-mono font-bold text-indigo-500">
                            {item.song.key || 'C'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botones de subir / bajar */}
                      <button
                        type="button"
                        onClick={() => handleMoveSong(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"
                        title="Subir posición"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSong(idx, 'down')}
                        disabled={idx === songsList.length - 1}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"
                        title="Bajar posición"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSong(item.songId)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors ml-1"
                        title="Quitar del repertorio"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pie de Acciones */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Eliminando...' : 'Eliminar Carpeta'}</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving || isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isDeleting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
