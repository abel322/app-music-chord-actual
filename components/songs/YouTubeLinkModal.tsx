'use client'

import React, { useState, useEffect } from 'react'
import { Youtube, ExternalLink, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getYouTubeVideoId, getYouTubeThumbnailUrl } from '@/lib/youtube'
import { cn } from '@/lib/utils'

interface YouTubeLinkModalProps {
  isOpen: boolean
  initialUrl?: string | null
  songTitle?: string
  onClose: () => void
  onSave: (url: string | null) => Promise<void> | void
}

export function YouTubeLinkModal({
  isOpen,
  initialUrl = '',
  songTitle = 'la canción',
  onClose,
  onSave,
}: YouTubeLinkModalProps) {
  const [url, setUrl] = useState(initialUrl || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl || '')
      setError(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, initialUrl, onClose])

  if (!isOpen) return null

  const videoId = getYouTubeVideoId(url)
  const thumbnailUrl = getYouTubeThumbnailUrl(url)
  const isValid = Boolean(videoId)
  const hasInput = url.trim().length > 0

  const handleSave = async () => {
    if (hasInput && !isValid) {
      setError('Por favor ingresa un enlace de YouTube válido (ej. youtube.com/watch?v=... o youtu.be/...)')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave(hasInput ? url.trim() : null)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el enlace de YouTube')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    setError(null)
    try {
      setUrl('')
      await onSave(null)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar el enlace de YouTube')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <Youtube className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Enlace de YouTube
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Vincula un video o pista de audio para {songTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>URL del Video</span>
              {isValid && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 normal-case">
                  <Check className="w-3 h-3" /> ID: {videoId}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError(null)
                }}
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2',
                  error
                    ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-red-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-red-500'
                )}
                autoFocus
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                  title="Limpiar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Previsualización en Tiempo Real */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Previsualización de Miniatura
            </span>

            {isValid && thumbnailUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-200 dark:border-slate-800 shadow-md group">
                <img
                  src={thumbnailUrl}
                  alt="Miniatura de YouTube"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
                    title="Probar enlace en YouTube"
                  >
                    <Youtube className="w-4 h-4 fill-current" />
                    <span>Ver en YouTube</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                  <Youtube className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs">
                  {hasInput
                    ? 'El enlace ingresado no parece ser un formato válido de YouTube.'
                    : 'Pega un enlace de YouTube arriba para ver la miniatura previa que se mostrará en el catálogo.'}
                </p>
                <span className="text-[10px] text-slate-400 mt-1">
                  Formatos soportados: watch?v=, youtu.be, /shorts/
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-2 flex-wrap">
          {initialUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isSaving}
              className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar enlace</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-md shadow-red-900/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
