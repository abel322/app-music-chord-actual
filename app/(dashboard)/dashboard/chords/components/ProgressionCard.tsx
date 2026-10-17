'use client'

import React, { useState, useEffect } from 'react'
import { ProgressionDef } from '@/lib/data/chordProgressions'
import { synth } from '@/lib/audioUtils'
import { Play, Square, Pencil, Trash2 } from 'lucide-react'

interface ProgressionCardProps {
  progression: ProgressionDef
  onEdit?: (progression: ProgressionDef) => void
  onDelete?: (progression: ProgressionDef) => void
}

export function ProgressionCard({ progression, onEdit, onDelete }: ProgressionCardProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [activeChordIndex, setActiveChordIndex] = useState<number | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      synth.stopProgression()
    }
  }, [])

  const handlePlayChord = (index: number, duration?: number) => {
    const chord = progression.chords[index]
    if (chord && chord.notes && chord.notes.length > 0) {
      synth.playChord(chord.notes, duration || 2000)
    }
  }

  const toggleLoop = () => {
    if (isPlaying) {
      stopLoop()
    } else {
      startLoop()
    }
  }

  const startLoop = () => {
    if (progression.chords.length === 0) return

    setIsPlaying(true)
    synth.playProgression(
      progression.chords,
      progression.bpm,
      (index: number) => {
        setActiveChordIndex(index)
      }
    )
  }

  const stopLoop = () => {
    setIsPlaying(false)
    setActiveChordIndex(null)
    synth.stopProgression()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-800 transition-colors">
      <div className="flex justify-between items-start mb-4 gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {progression.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {progression.genre}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button
              type="button"
              id={`btn-edit-${progression.id}`}
              data-testid={`edit-progression-${progression.id}`}
              onClick={() => onEdit(progression)}
              title="Editar progresión"
              aria-label="Editar progresión"
              className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              id={`btn-delete-${progression.id}`}
              data-testid={`delete-progression-${progression.id}`}
              onClick={() => onDelete(progression)}
              title="Eliminar progresión"
              aria-label="Eliminar progresión"
              className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            id={`btn-play-${progression.id}`}
            data-testid={`play-progression-${progression.id}`}
            onClick={toggleLoop}
            className={`p-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
            aria-label={isPlaying ? 'Stop Loop' : 'Play Loop'}
          >
            {isPlaying ? (
              <Square className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-wider">
        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          Key: {progression.key}
        </span>
        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          BPM: {progression.bpm}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {progression.chords.map((chord, idx) => {
          const isActive = activeChordIndex === idx
          return (
            <button
              key={`${chord.name}-${idx}`}
              onMouseDown={() => {
                if (!isPlaying) {
                  handlePlayChord(idx)
                }
              }}
              className={`flex-1 min-w-[80px] py-4 px-2 rounded-lg text-center transition-all duration-150 transform font-medium ${
                isActive
                  ? 'bg-blue-600 text-white scale-105 shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {chord.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
