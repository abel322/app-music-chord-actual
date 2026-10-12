'use client'

import React, { useState } from 'react'
import { Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TapTempoModal } from './TapTempoModal'

interface TapTempoButtonProps {
  onTempoChange: (bpm: number) => void
  currentTempo?: number
  timeSignature?: string
  className?: string
  buttonLabel?: string
}

export function TapTempoButton({
  onTempoChange,
  currentTempo = 120,
  timeSignature = '4/4',
  className,
  buttonLabel = 'Tap',
}: TapTempoButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all select-none border cursor-pointer shrink-0 shadow-xs',
          'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-700 active:scale-95',
          className
        )}
        title="Abrir detector interactivo de Tap Tempo con conteo por compás"
      >
        <Music className="w-3.5 h-3.5 text-primary-500 shrink-0" />
        <span>{buttonLabel}</span>
      </button>

      {isModalOpen && (
        <TapTempoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApplyTempo={onTempoChange}
          currentTempo={currentTempo}
          timeSignature={timeSignature}
        />
      )}
    </>
  )
}
