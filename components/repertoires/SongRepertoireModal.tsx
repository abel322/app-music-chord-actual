'use client'

import React, { useState } from 'react'
import { FolderPlus, X, Check, Folder, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RepertoireData } from '@/types/repertoire'

interface SongRepertoireModalProps {
  isOpen: boolean
  onClose: () => void
  song: {
    id: string
    title: string
    artist: string | null
    key: string | null
  }
  repertoires: RepertoireData[]
  onToggleSongInRepertoire: (repertoireId: string, songId: string, willInclude: boolean) => Promise<void>
  onOpenCreateRepertoire: () => void
}

export function SongRepertoireModal({
  isOpen,
  onClose,
  song,
  repertoires,
  onToggleSongInRepertoire,
  onOpenCreateRepertoire,
}: SongRepertoireModalProps) {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const handleToggle = async (repId: string, currentIncluded: boolean) => {
    setLoadingMap((prev) => ({ ...prev, [repId]: true }))
    try {
      await onToggleSongInRepertoire(repId, song.id, !currentIncluded)
    } finally {
      setLoadingMap((prev) => ({ ...prev, [repId]: false }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/40 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Asignar a Repertorios
            </span>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white truncate max-w-[280px]">
              {song.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Carpetas con Checkboxes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {repertoires.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 space-y-3">
              <Folder className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-700" />
              <p>Aún no has creado carpetas o repertorios.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {repertoires.map((rep) => {
                const isIncluded = rep.songs.some((s) => s.songId === song.id)
                const isLoading = loadingMap[rep.id]

                return (
                  <div
                    key={rep.id}
                    onClick={() => !isLoading && handleToggle(rep.id, isIncluded)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isIncluded
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                    } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          isIncluded
                            ? 'bg-indigo-600 text-white'
                            : 'border-2 border-gray-300 dark:border-slate-700'
                        }`}
                      >
                        {isIncluded && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="truncate">
                        <span className="font-bold text-xs text-gray-900 dark:text-white block truncate">
                          📂 {rep.name}
                        </span>
                        {rep.description && (
                          <span className="text-[10px] text-gray-400 truncate block">
                            {rep.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 ml-2">
                      {rep.songs.length} {rep.songs.length === 1 ? 'canción' : 'canciones'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenCreateRepertoire()
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nueva Carpeta</span>
            </button>
          </div>
        </div>

        {/* Pie */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/40 flex items-center justify-end shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Listo
          </Button>
        </div>
      </div>
    </div>
  )
}
