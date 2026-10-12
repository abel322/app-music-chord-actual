'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Loader2, X } from 'lucide-react'
import { deleteSongAction } from '@/app/actions/songs'

interface SongToDelete {
  id: string
  title: string
}

interface DeleteSongModalProps {
  isOpen: boolean
  song: SongToDelete | null
  onClose: () => void
  onSuccess: (deletedSongId: string, songTitle: string) => void
}

export function DeleteSongModal({
  isOpen,
  song,
  onClose,
  onSuccess,
}: DeleteSongModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cerrar al pulsar Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isDeleting) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isDeleting, onClose])

  if (!isOpen || !song) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      // 1. Intentar Server Action
      try {
        await deleteSongAction(song.id)
      } catch (err: any) {
        // Fallback a endpoint REST /api/songs/[id]
        const res = await fetch(`/api/songs/${song.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudo eliminar la canción')
        }
      }

      onSuccess(song.id, song.title)
      onClose()
    } catch (err: any) {
      console.error('Error al eliminar canción:', err)
      setError(err.message || 'Ocurrió un error inesperado al eliminar la canción.')
    } finally {
      setIsDeleting(false)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => {
        if (!isDeleting) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-song-title"
    >
      <div
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl scale-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar X superior */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
          title="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado Visual */}
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 id="delete-song-title" className="text-lg font-bold text-slate-900 dark:text-white">
          ¿Eliminar canción?
        </h3>

        {/* Mensaje Descriptivo */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          ¿Estás seguro de que deseas eliminar{' '}
          <strong className="font-semibold text-slate-900 dark:text-white">
            «{song.title}»
          </strong>
          ? Esta acción es permanente y borrará tanto la letra completa como toda la estructura armónica y compases asociados.
        </p>

        {/* Mensaje de error si falla */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Botonera de Acciones */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Sí, eliminar canción</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (mounted && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}
