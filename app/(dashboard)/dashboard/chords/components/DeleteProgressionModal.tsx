'use client'

import React from 'react'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { ProgressionDef } from '@/lib/data/chordProgressions'

interface DeleteProgressionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  progression: ProgressionDef | null
}

export function DeleteProgressionModal({
  isOpen,
  onClose,
  onConfirm,
  progression,
}: DeleteProgressionModalProps) {
  if (!isOpen || !progression) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-md w-full p-6 transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              ¿Eliminar progresión?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            ¿Estás seguro de que deseas eliminar la progresión{' '}
            <strong className="font-semibold text-gray-900 dark:text-white">
              «{progression.name}»
            </strong>
            ? Esta acción no se puede deshacer.
          </p>

          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {progression.genre}
            </span>
            <span>•</span>
            <span>Tono: {progression.key}</span>
            <span>•</span>
            <span>{progression.bpm} BPM</span>
            <span>•</span>
            <span>{progression.chords.length} acordes</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            id="btn-cancel-delete"
            data-testid="cancel-delete-btn"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-delete"
            data-testid="confirm-delete-btn"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sí, eliminar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
