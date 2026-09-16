'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ProgressionDef } from '@/lib/data/chordProgressions'
import { synth } from '@/lib/audioUtils'
import { Play, Square } from 'lucide-react'

interface ProgressionCardProps {
  progression: ProgressionDef
}

export function ProgressionCard({ progression }: ProgressionCardProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [activeChordIndex, setActiveChordIndex] = useState<number | null>(null)

  // Track interval for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      synth.stopAll()
    }
  }, [])

  const handlePlayChord = (index: number, duration?: number) => {
    const chord = progression.chords[index]
    if (chord) {
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
    let currentIndex = 0

    // Calculate duration of one measure (4 beats) in milliseconds
    const beatDurationMs = (60 / progression.bpm) * 1000
    const chordDurationMs = beatDurationMs * 4 // Assuming 4 beats per chord

    // Play first chord immediately
    setActiveChordIndex(currentIndex)
    handlePlayChord(currentIndex, chordDurationMs)

    intervalRef.current = setInterval(() => {
      currentIndex = (currentIndex + 1) % progression.chords.length
      setActiveChordIndex(currentIndex)
      handlePlayChord(currentIndex, chordDurationMs)
    }, chordDurationMs)
  }

  const stopLoop = () => {
    setIsPlaying(false)
    setActiveChordIndex(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    synth.stopAll()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-800 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {progression.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {progression.genre}
          </p>
        </div>
        <button
          onClick={toggleLoop}
          className={`p-3 rounded-full flex items-center justify-center transition-colors ${
            isPlaying
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
          }`}
          aria-label={isPlaying ? 'Stop Loop' : 'Play Loop'}
        >
          {isPlaying ? <Square className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
        </button>
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
