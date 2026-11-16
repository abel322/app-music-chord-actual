'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText, 
  RotateCcw, 
  SlidersHorizontal, 
  Music, 
  Layers, 
  Trash2, 
  Copy,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  Youtube
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapTempoButton } from '@/components/ui/TapTempoButton'
import { MeasureGrid } from '@/components/chords/MeasureGrid'
import { ProgressionPicker } from '@/components/chords/ProgressionPicker'
import { CadencePicker } from '@/components/chords/CadencePicker'
import { SectionKeyControl } from '@/components/chords/SectionKeyControl'
import { SectionRepeatControl } from '@/components/chords/SectionRepeatControl'
import { SectionQuickNav } from '@/components/chords/SectionQuickNav'
import { LeadSheetToolbar } from '@/components/chords/LeadSheetToolbar'
import { SectionCard } from '@/components/chords/SectionCard'
import { YouTubeLinkModal } from '@/components/songs/YouTubeLinkModal'
import { getAudioContext, playTickSound } from '@/lib/hooks/useMetronomeAudio'
import { SectionMeasures, Measure } from '@/types/measure'

import { 
  ensureSectionMeasures, 
  transposeSectionMeasures, 
  transposeSingleSectionMeasures,
  generateMeasures,
  getBeatsPerMeasure,
  applyProgressionToMeasures,
  applyCadenceToSectionMeasures,
  getSectionBadge,
  getSectionDefaultName,
  cloneSectionMeasures,
  getSectionChordsPreview,
  buildFullLyricsText,
  syncSectionsWithLyrics
} from '@/lib/measure-utils'
import { updateSectionsTimeSignature } from '@/lib/rhythm-utils'
import { getDiatonicChords } from '@/lib/music-theory'
import { transposeChord, getSemitoneDiff } from '@/lib/transpose'
import { POPULAR_PROGRESSIONS, getProgressionChords, HarmonicProgression, CadenceDefinition } from '@/lib/harmonic-theory'
import { updateSongAction } from '@/app/actions/songs'
import { useAuth } from '@/lib/context/auth-context'
import { cn } from '@/lib/utils'

interface SongData {
  id: string
  title: string
  artist: string | null
  key: string | null
  timeSignature: string | null
  tempo: number | null
  sections: any
  content?: string
  lyrics?: string
  youtubeUrl?: string | null
}

interface ChordLeadSheetProps {
  song: SongData
}

const SECTION_OPTIONS = [
  { value: 'intro', label: 'Intro' },
  { value: 'verse', label: 'Estrofa' },
  { value: 'prechorus', label: 'Pre-Coro' },
  { value: 'chorus', label: 'Coro' },
  { value: 'bridge', label: 'Puente' },
  { value: 'interlude', label: 'Interludio' },
  { value: 'solo', label: 'Solo' },
  { value: 'outro', label: 'Outro' },
]

const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function ChordLeadSheet({ song }: ChordLeadSheetProps) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [currentKey, setCurrentKey] = useState(song.key || 'C')
  const [timeSignature, setTimeSignature] = useState(song.timeSignature || '4/4')
  const [tempo, setTempo] = useState<number>(song.tempo || 120)
  const [tempoInput, setTempoInput] = useState<string>(song?.tempo?.toString() || '120')
  const tempoDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar si el tempo de la canción cambia externamente
  useEffect(() => {
    if (song?.tempo) {
      setTempo(song.tempo)
      setTempoInput(song.tempo.toString())
    }
  }, [song?.tempo])

  // Cambio de Tempo con auto-sincronización bidireccional inmediata en BD
  const onUpdateTempo = (newTempo: number) => {
    const validBpm = Math.max(30, Math.min(300, newTempo))
    setTempo(validBpm)

    if (tempoDebounceTimerRef.current) {
      clearTimeout(tempoDebounceTimerRef.current)
    }

    tempoDebounceTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/songs/${song.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempo: validBpm }),
        })
      } catch (err) {
        console.error('Error auto-guardando tempo en acordes:', err)
      }
    }, 400)
  }

  // Compatibilidad interna
  const handleTempoChange = onUpdateTempo

  // Función de confirmación al salir del campo (onBlur) o presionar Enter
  const handleCommitTempo = () => {
    let parsed = parseInt(tempoInput, 10)
    
    if (isNaN(parsed) || parsed < 30) {
      parsed = 30
    } else if (parsed > 300) {
      parsed = 300
    }

    setTempoInput(parsed.toString())
    if (onUpdateTempo && parsed !== tempo) {
      onUpdateTempo(parsed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const handleTempoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permitir borrar completamente el input o ingresar dígitos sin auto-bloqueo
    if (value === '' || /^\d+$/.test(value)) {
      setTempoInput(value)
      
      // Si el usuario escribe un número completo dentro de los límites válidos, actualizar en vivo
      const num = parseInt(value, 10)
      if (!isNaN(num) && num >= 30 && num <= 300) {
        if (onUpdateTempo) onUpdateTempo(num)
      }
    }
  }

  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(song.youtubeUrl || null)
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const effectiveIsEditing = isAdmin && isEditing
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'stage' | 'wide'>('stage')
  const [isControlsDrawerOpen, setIsControlsDrawerOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [transposeSemitones, setTransposeSemitones] = useState(0)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})


  // Alternar colapso de una sección individual
  const handleToggleCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  // Alternar colapso global (Colapsar todo / Expandir todo)
  const handleToggleCollapseAll = () => {
    const allCollapsed = sections.length > 0 && sections.every((s) => collapsedSections[s.id])
    if (allCollapsed) {
      setCollapsedSections({})
    } else {
      const all: Record<string, boolean> = {}
      sections.forEach((s) => {
        all[s.id] = true
      })
      setCollapsedSections(all)
    }
  }

  // Normalizar las secciones a compases estructurados
  const [sections, setSections] = useState<SectionMeasures[]>(() => {
    const rawSections = Array.isArray(song.sections) ? song.sections : []
    const counter = { current: 1 }

    if (rawSections.length === 0) {
      return [
        {
          id: `sec-intro-${Date.now()}`,
          type: 'intro',
          label: 'Intro',
          timeSignature: song.timeSignature || '4/4',
          instruments: [],
          measures: generateMeasures(4, 1, song.timeSignature || '4/4', [song.key || 'C']),
        },
        {
          id: `sec-verse-${Date.now()}`,
          type: 'verse',
          label: 'Estrofa 1',
          timeSignature: song.timeSignature || '4/4',
          instruments: [],
          measures: generateMeasures(4, 5, song.timeSignature || '4/4', [song.key || 'C']),
        },
      ]
    }

    const normalized = rawSections.map((sec, idx) =>
      ensureSectionMeasures(sec, idx, song.timeSignature || '4/4', counter)
    )
    return syncSectionsWithLyrics(normalized, song.lyrics || song.content)
  })

  // Sección activa para lectura y reproducción en vivo
  const [activeSectionId, setActiveSectionId] = useState<string>(() => sections[0]?.id || '')

  useEffect(() => {
    if (sections.length > 0 && (!activeSectionId || !sections.some((s) => s.id === activeSectionId))) {
      setActiveSectionId(sections[0].id)
    }
  }, [sections, activeSectionId])

  // Desplazamiento suave con scroll-mt-14 hacia la sección objetivo
  const scrollToSection = useCallback((secId: string) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById(`section-${secId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
    })
  }, [])

  // Estado de Reproducción de Escenario
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMetronomeOn, setIsMetronomeOn] = useState(false)
  const sectionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sección activa actual
  const currentActiveSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0] || null
  }, [sections, activeSectionId])

  // Salto rápido a sección (desde tarjeta, píldora o pedal)
  const handleSelectSectionJump = useCallback(
    (sectionId: string) => {
      setActiveSectionId(sectionId)
      setCollapsedSections((prev) => {
        if (prev[sectionId]) {
          return { ...prev, [sectionId]: false }
        }
        return prev
      })
      scrollToSection(sectionId)
    },
    [scrollToSection]
  )

  // Navegación secuencial de secciones (Pulgar y Pedal Bluetooth)
  const handlePrevSection = useCallback(() => {
    if (sections.length === 0) return
    const currentIdx = sections.findIndex((s) => s.id === activeSectionId)
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0
    const prevSec = sections[prevIdx]
    if (prevSec) {
      handleSelectSectionJump(prevSec.id)
    }
  }, [sections, activeSectionId, handleSelectSectionJump])

  const handleNextSection = useCallback(() => {
    if (sections.length === 0) return
    const currentIdx = sections.findIndex((s) => s.id === activeSectionId)
    if (currentIdx < sections.length - 1) {
      const nextSec = sections[currentIdx + 1]
      if (nextSec) {
        handleSelectSectionJump(nextSec.id)
      }
    } else {
      // Última sección alcanzada: detener reproducción
      if (isPlaying) {
        setIsPlaying(false)
      }
    }
  }, [sections, activeSectionId, handleSelectSectionJump, isPlaying])

  // Iniciar / Pausar reproducción inmediatamente (sin conteo 1-2-3-4)
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const nextPlaying = !prev
      if (nextPlaying) {
        const secId = activeSectionId || sections[0]?.id
        if (secId) {
          setActiveSectionId(secId)
          scrollToSection(secId)
        }
      }
      return nextPlaying
    })
  }, [activeSectionId, sections, scrollToSection])

  // Reiniciar a la primera sección
  const handleRestart = useCallback(() => {
    setIsPlaying(false)
    if (sections.length > 0) {
      const firstId = sections[0].id
      setActiveSectionId(firstId)
      scrollToSection(firstId)
    }
  }, [sections, scrollToSection])

  // Cálculo de duración precisa de una sección en milisegundos
  const getSectionDurationMs = useCallback(
    (sec: SectionMeasures) => {
      const secTempo = sec.tempoOverride || tempo || 120
      const secTimeSig = sec.timeSignature || timeSignature || '4/4'
      const beatsPerMeasure = getBeatsPerMeasure(secTimeSig)
      const measureCount = sec.measures.length > 0 ? sec.measures.length : 4
      const repeats = Math.max(1, sec.repeatCount || 1)
      return (measureCount * repeats * beatsPerMeasure * 60 * 1000) / secTempo
    },
    [tempo, timeSignature]
  )

  // Temporizador de avance automático de sección cuando isPlaying está activo
  useEffect(() => {
    if (sectionTimerRef.current) {
      clearTimeout(sectionTimerRef.current)
      sectionTimerRef.current = null
    }

    if (!isPlaying) return

    const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0]
    if (!currentSection) return

    setCollapsedSections((prev) => {
      if (prev[currentSection.id]) {
        return { ...prev, [currentSection.id]: false }
      }
      return prev
    })

    const durationMs = getSectionDurationMs(currentSection)

    sectionTimerRef.current = setTimeout(() => {
      const currentIdx = sections.findIndex((s) => s.id === currentSection.id)
      if (currentIdx !== -1 && currentIdx < sections.length - 1) {
        const nextSec = sections[currentIdx + 1]
        setActiveSectionId(nextSec.id)
        scrollToSection(nextSec.id)
      } else {
        setIsPlaying(false)
      }
    }, durationMs)

    return () => {
      if (sectionTimerRef.current) {
        clearTimeout(sectionTimerRef.current)
        sectionTimerRef.current = null
      }
    }
  }, [isPlaying, activeSectionId, sections, getSectionDurationMs, scrollToSection])

  // Metrónomo auditivo opcional sincronizado con la sección activa
  useEffect(() => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current)
      metronomeIntervalRef.current = null
    }

    if (!isPlaying || !isMetronomeOn) return

    const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0]
    const secTempo = currentSection?.tempoOverride || tempo || 120
    const secTimeSig = currentSection?.timeSignature || timeSignature || '4/4'
    const beatsPerMeasure = getBeatsPerMeasure(secTimeSig)
    const beatIntervalMs = (60 / secTempo) * 1000

    const ctx = getAudioContext()
    let beatInMeasure = 0

    if (ctx) {
      playTickSound(ctx, ctx.currentTime, beatInMeasure === 0)
    }

    metronomeIntervalRef.current = setInterval(() => {
      beatInMeasure = (beatInMeasure + 1) % beatsPerMeasure
      if (ctx) {
        playTickSound(ctx, ctx.currentTime, beatInMeasure === 0)
      }
    }, beatIntervalMs)

    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current)
        metronomeIntervalRef.current = null
      }
    }
  }, [isPlaying, isMetronomeOn, activeSectionId, sections, tempo, timeSignature])

  // WakeLock: Mantener la pantalla encendida en el dispositivo móvil durante la interpretación
  const wakeLockRef = useRef<any>(null)

  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null
          })
        }
      } catch (err) {
        console.warn('Wake Lock request error:', err)
      }
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
      } catch {}
      wakeLockRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }
  }, [isPlaying, requestWakeLock, releaseWakeLock])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        await requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [isPlaying, requestWakeLock, releaseWakeLock])

  // Clic sobre compás: enfocar la sección completa (sin resaltado individual de celdas)
  const handleMeasureClick = useCallback(
    (clickedMeasure: Measure) => {
      const foundSection = sections.find((s) => s.measures.some((m) => m.id === clickedMeasure.id))
      if (foundSection) {
        handleSelectSectionJump(foundSection.id)
      }
    },
    [sections, handleSelectSectionJump]
  )

  // Atajos de Teclado y Pedal Bluetooth:
  // Flecha Derecha, PageDown y Barra Espaciadora -> Siguiente Sección
  // Flecha Izquierda y PageUp -> Sección Anterior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"], [role="dialog"]')
      ) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        handleNextSection()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        handlePrevSection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextSection, handlePrevSection])

  // Acordes diatónicos de la tonalidad actual para sugerencias
  const diatonicChords = useMemo(() => {
    try {
      const res = getDiatonicChords(currentKey)
      return res.inKey.map((c) => `${c.root}${c.type}`)
    } catch {
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']
    }
  }, [currentKey])

  // Transposición tonal en tiempo real (+ / - semitonos)
  const handleTranspose = (delta: number) => {
    const oldKeyIndex = ALL_KEYS.indexOf(currentKey)
    const newKeyIndex = (oldKeyIndex + delta + 12) % 12
    const newKey = ALL_KEYS[newKeyIndex]

    setSections((prev) => transposeSectionMeasures(prev, delta))
    setCurrentKey(newKey)
    setTransposeSemitones((prev) => prev + delta)
  }

  // Restablecer tono original
  const handleResetTranspose = () => {
    if (transposeSemitones === 0) return
    const reverseDelta = -transposeSemitones
    setSections((prev) => transposeSectionMeasures(prev, reverseDelta))
    setCurrentKey(song.key || 'C')
    setTransposeSemitones(0)
  }

  // Cambiar Cifra de Compás y actualizar todas las secciones y compases en cascada
  const handleTimeSignatureChange = (newTimeSig: string) => {
    setTimeSignature(newTimeSig)
    setSections((prev) => updateSectionsTimeSignature(prev, newTimeSig))
  }

  // Aplicar progresión a una sección completa
  const handleApplyProgression = (sectionId: string, prog: HarmonicProgression | string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        const secKey = sec.keySignature || currentKey
        const chords = getProgressionChords(prog, secKey)
        return {
          ...sec,
          measures: applyProgressionToMeasures(sec.measures, chords, sec.timeSignature || timeSignature),
        }
      })
    )
  }

  // Marcar e inyectar cadencia armónica en el compás final de la sección
  const handleApplySectionCadence = (sectionId: string, cad: CadenceDefinition | null) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId || sec.measures.length === 0) return sec
        const secKey = sec.keySignature || currentKey
        return {
          ...sec,
          measures: applyCadenceToSectionMeasures(sec.measures, cad, secKey, sec.timeSignature || timeSignature),
        }
      })
    )
  }

  // Actualizar compases de una sección específica
  const handleUpdateSectionMeasures = (sectionId: string, updatedMeasures: Measure[]) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, measures: updatedMeasures } : sec))
    )
  }

  // Cambiar Tonalidad Específica de una Sección (con opción de transposición de acordes)
  const handleUpdateSectionKey = (sectionId: string, newKey: string | null, transposeChords: boolean) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        if (!transposeChords) {
          return {
            ...sec,
            keySignature: newKey,
          }
        }
        const prevEffective = sec.keySignature || currentKey
        const newEffective = newKey || currentKey
        const semitones = getSemitoneDiff(prevEffective, newEffective)
        return transposeSingleSectionMeasures(sec, semitones, newKey)
      })
    )
  }

  // Añadir compases a una sección
  const handleAddMeasuresToSection = (sectionId: string, count: number) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        const lastMeasureNumber = sec.measures.length > 0 ? sec.measures[sec.measures.length - 1].measureNumber : 0
        const newMeasures = generateMeasures(count, lastMeasureNumber + 1, sec.timeSignature || timeSignature)
        return {
          ...sec,
          measures: [...sec.measures, ...newMeasures],
        }
      })
    )
  }

  // Eliminar un compás de una sección
  const handleRemoveMeasure = (sectionId: string, measureId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        const filtered = sec.measures.filter((m) => m.id !== measureId)
        // Renumerar compases
        const renumbered = filtered.map((m, idx) => ({ ...m, measureNumber: idx + 1 }))
        return { ...sec, measures: renumbered }
      })
    )
  }

  // Modificar multiplicador de repeticiones de una sección (1x, 2x, 4x...)
  const handleUpdateSectionRepeatCount = (sectionId: string, count: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, repeatCount: count } : s))
    )
  }

  // Modificar tempo específico (BPM override) de una sección
  const handleUpdateSectionTempo = (sectionId: string, newTempo: number | null) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, tempoOverride: newTempo } : s))
    )
  }

  // Agregar una nueva sección completa (Intro, Estrofa, Coro, etc.)
  const handleAddSection = (type: string) => {
    const defaultName = getSectionDefaultName(type)
    const countSameType = sections.filter((s) => {
      if (type === 'interlude' || type === 'instrumental') {
        return s.type === 'interlude' || s.type === 'instrumental'
      }
      return s.type === type
    }).length
    const label = `${defaultName} ${countSameType + 1}`

    // Determinar siguiente número de compás
    const allMeasuresCount = sections.reduce((acc, s) => acc + s.measures.length, 0)
    const newMeasures = generateMeasures(4, allMeasuresCount + 1, timeSignature, [currentKey])

    const newSection: SectionMeasures = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      timeSignature,
      instruments: [],
      guideLyrics: '',
      measures: newMeasures,
    }

    setSections([...sections, newSection])
  }

  // Duplicar una sección completa inmediatamente después de la original
  const handleDuplicateSection = (sectionId: string) => {
    const originalIndex = sections.findIndex((s) => s.id === sectionId)
    if (originalIndex === -1) return

    const originalSection = sections[originalIndex]
    const duplicatedSection = cloneSectionMeasures(originalSection, sections)

    const updated = [...sections]
    updated.splice(originalIndex + 1, 0, duplicatedSection)
    setSections(updated)
  }

  // Eliminar una sección
  const handleRemoveSection = (sectionId: string) => {
    if (!confirm('¿Eliminar esta sección y todos sus compases?')) return
    setSections(sections.filter((s) => s.id !== sectionId))
  }

  // Mover sección arriba con auto-persistencia
  const handleMoveSectionUp = async (index: number) => {
    if (index <= 0) return
    const updated = [...sections]
    const [moved] = updated.splice(index, 1)
    updated.splice(index - 1, 0, moved)
    setSections(updated)
    if (isAdmin && song.id) {
      try {
        const fullLyrics = buildFullLyricsText(updated)
        await updateSongAction(song.id, { sections: updated as any, lyrics: fullLyrics })
      } catch (err) {
        console.error('Error al mover sección arriba:', err)
      }
    }
  }

  // Mover sección abajo con auto-persistencia
  const handleMoveSectionDown = async (index: number) => {
    if (index >= sections.length - 1) return
    const updated = [...sections]
    const [moved] = updated.splice(index, 1)
    updated.splice(index + 1, 0, moved)
    setSections(updated)
    if (isAdmin && song.id) {
      try {
        const fullLyrics = buildFullLyricsText(updated)
        await updateSongAction(song.id, { sections: updated as any, lyrics: fullLyrics })
      } catch (err) {
        console.error('Error al mover sección abajo:', err)
      }
    }
  }



  // Guardar enlace de YouTube directamente
  const handleSaveYouTubeUrl = async (newUrl: string | null) => {
    setYoutubeUrl(newUrl)
    try {
      await updateSongAction(song.id, {
        youtubeUrl: newUrl,
      })
    } catch (err) {
      console.error('Error al guardar enlace de YouTube:', err)
      throw err
    }
  }

  // Guardar en la base de datos
  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const fullLyrics = buildFullLyricsText(sections)
      await updateSongAction(song.id, {
        key: currentKey,
        timeSignature,
        tempo,
        youtubeUrl,
        sections: sections as any,
        lyrics: fullLyrics,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error al guardar compases:', err)
      alert('Hubo un error al guardar los cambios armónicos.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-full min-h-screen max-w-7xl mx-auto pb-28 sm:pb-36">
      {/* 1. Cabecera Superior Ultra-Compacta de 1 Sola Línea (44px máx) */}
      <header className="sticky top-0 z-50 h-11 px-2.5 sm:px-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-2 text-white shadow-sm">
        {/* Izquierda: Botón ← + Título truncado + Badge compacto Tono/BPM */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <Link
            href="/dashboard/songs/chords"
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Volver a lista de canciones"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <span
            className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[300px]"
            title={song.title}
          >
            {song.title}
          </span>

          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            {currentKey} • {tempo} BPM
          </span>
        </div>

        {/* Derecha: Toggle Escenario / Amplio + Toggle Controles */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === 'stage' ? 'wide' : 'stage'))}
            className={cn(
              'px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer',
              viewMode === 'stage'
                ? 'bg-slate-900 text-cyan-400 border-cyan-500/50 shadow-xs'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            )}
            title={
              viewMode === 'stage'
                ? 'Vista Escenario (4 compases/fila en móvil). Clic para cambiar a Vista Amplia'
                : 'Vista Amplia. Clic para cambiar a Vista Escenario'
            }
          >
            <span>{viewMode === 'stage' ? '📱 Escenario' : '🔍 Amplio'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsControlsDrawerOpen((prev) => !prev)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer',
              isControlsDrawerOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md ring-1 ring-cyan-300'
                : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            )}
            title="Mostrar / ocultar panel de controles de transporte, tempo, transposición y ensayo"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Controles</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isControlsDrawerOpen && 'rotate-180')} />
          </button>
        </div>
      </header>

      {/* Panel Desplegable de Controles y Transporte (Colapsado por defecto para 85%+ área de acordes) */}
      {isControlsDrawerOpen && (
        <div className="sticky top-11 z-40 bg-slate-900/98 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 shadow-2xl space-y-3.5 animate-in slide-in-from-top-2 duration-200">
          {/* Fila 1: Botones de Acción (Letras, Batería, YouTube, Edición, Guardar) */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/dashboard/songs/lyrics/${song.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Letras</span>
                </Button>
              </Link>
              <Link href={`/dashboard/songs/drums/${song.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                  <span>🥁</span>
                  <span>Ver Batería</span>
                </Button>
              </Link>
              {isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsYouTubeModalOpen(true)}
                  className={cn(
                    'gap-1.5 text-xs font-bold transition-all shadow-xs',
                    youtubeUrl
                      ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30'
                      : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  )}
                >
                  <Youtube className={cn('w-3.5 h-3.5 text-red-600 dark:text-red-500', youtubeUrl && 'fill-current')} />
                  <span>{youtubeUrl ? 'YouTube' : 'Enlace YouTube'}</span>
                </Button>
              ) : youtubeUrl ? (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30"
                >
                  <Youtube className="w-3.5 h-3.5 fill-current" />
                  <span>Ver en YouTube</span>
                </a>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant={isEditing ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Terminar Edición' : 'Editar Compases'}</span>
                </Button>
              )}

              {isAdmin && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-xs font-bold gap-1.5 shadow-md shadow-primary-900/20"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>¡Guardado!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Guardando...' : 'Guardar Lead Sheet'}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Fila 2: Configuración Musical (Tono, Transposición, Métrica, Tempo BPM) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-800 dark:text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* Tonalidad */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tono:
                </span>
                <div className="px-2.5 py-0.5 rounded-lg bg-primary-600 font-mono text-sm font-extrabold text-white shadow-xs">
                  {currentKey}
                </div>
              </div>

              {/* Botones de Transposición */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTranspose(-1)}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                  title="Bajar 1 semitono (♭)"
                >
                  ♭ -1
                </button>
                <button
                  type="button"
                  onClick={() => handleTranspose(1)}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                  title="Subir 1 semitono (#)"
                >
                  ♯ +1
                </button>
                {transposeSemitones !== 0 && (
                  <button
                    type="button"
                    onClick={handleResetTranspose}
                    className="px-2 py-0.5 text-xs text-cyan-400 hover:underline font-medium"
                    title="Restablecer tono original"
                  >
                    Reset ({transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones})
                  </button>
                )}
              </div>

              <div className="h-5 w-px bg-slate-800 hidden sm:block" />

              {/* Métrica */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Compás:
                </span>
                {effectiveIsEditing ? (
                  <select
                    value={timeSignature}
                    onChange={(e) => handleTimeSignatureChange(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-white focus:outline-none"
                  >
                    <option value="4/4">4/4</option>
                    <option value="3/4">3/4</option>
                    <option value="2/4">2/4</option>
                    <option value="6/8">6/8</option>
                    <option value="12/8">12/8</option>
                  </select>
                ) : (
                  <span className="font-mono font-bold text-xs bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 text-white">
                    {timeSignature}
                  </span>
                )}
              </div>

              <div className="h-5 w-px bg-slate-800 hidden sm:block" />

              {/* Tempo BPM */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempo:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseInt(tempoInput, 10) || 120
                      const next = Math.max(30, current - 1)
                      setTempoInput(next.toString())
                      if (onUpdateTempo) onUpdateTempo(next)
                    }}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={tempoInput}
                    onChange={handleTempoInputChange}
                    onBlur={handleCommitTempo}
                    onKeyDown={handleKeyDown}
                    className="w-10 text-center text-xs font-bold bg-slate-950 text-white rounded py-0.5 border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseInt(tempoInput, 10) || 120
                      const next = Math.min(300, current + 1)
                      setTempoInput(next.toString())
                      if (onUpdateTempo) onUpdateTempo(next)
                    }}
                    className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
                <TapTempoButton
                  onTempoChange={(bpm) => {
                    setTempoInput(bpm.toString())
                    if (onUpdateTempo) onUpdateTempo(bpm)
                  }}
                  currentTempo={tempo}
                  timeSignature={timeSignature}
                  className="px-2 py-0.5 text-xs bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Fila 3: Barra de Transporte de Escenario */}
          <LeadSheetToolbar
            isPlaying={isPlaying}
            togglePlayPause={handleTogglePlay}
            handleRestart={handleRestart}
            activeSectionName={currentActiveSection?.label || 'Intro'}
            totalRepeats={currentActiveSection?.repeatCount || 1}
            currentRepeat={1}
            isMetronomeOn={isMetronomeOn}
            toggleMetronome={() => setIsMetronomeOn((prev) => !prev)}
            effectiveTempo={tempo}
            onUpdateTempo={(newTempo) => {
              setTempoInput(newTempo.toString())
              if (onUpdateTempo) onUpdateTempo(newTempo)
            }}
          />
        </div>
      )}

      {/* Lista de Secciones con sus Compases */}
      <div className="space-y-4 pt-2">
        {sections.map((section, sIdx) => {
          const isSectionActive = section.id === activeSectionId
          const nextSec = sections[sIdx + 1]
          const nextSecName = nextSec ? nextSec.label : null

          return (
            <SectionCard
              key={section.id}
              section={section}
              index={sIdx}
              totalSections={sections.length}
              isAdmin={isAdmin}
              isEditing={effectiveIsEditing}
              isCollapsed={!!collapsedSections[section.id]}
              globalKey={currentKey}
              globalTimeSignature={timeSignature}
              globalTempo={tempo}
              viewMode={viewMode}
              isPlaying={isPlaying}
              activeMeasureId={null}
              measureDurationMs={0}
              currentRepeat={1}
              totalRepeats={section.repeatCount || 1}
              nextSectionName={nextSecName}
              isSectionActive={isSectionActive}
              onSectionFocus={(secId) => handleSelectSectionJump(secId)}
              onToggleCollapse={handleToggleCollapse}
              onUpdateLabel={(secId, newLabel) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === secId ? { ...s, label: newLabel } : s))
                )
              }}
              onUpdateSectionKey={handleUpdateSectionKey}
              onUpdateSectionTempo={handleUpdateSectionTempo}
              onUpdateRepeatCount={handleUpdateSectionRepeatCount}
              onApplyProgression={handleApplyProgression}
              onApplySectionCadence={handleApplySectionCadence}
              onMoveUp={handleMoveSectionUp}
              onMoveDown={handleMoveSectionDown}
              onDuplicate={handleDuplicateSection}
              onRemove={handleRemoveSection}
              onUpdateGuideLyrics={(secId, newLyrics) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === secId ? { ...s, guideLyrics: newLyrics } : s))
                )
              }}
              onUpdateLyrics={(secId, newLyrics) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === secId ? { ...s, lyrics: newLyrics } : s))
                )
              }}
              onMeasureClick={handleMeasureClick}
              onUpdateMeasures={handleUpdateSectionMeasures}
              onAddMeasures={handleAddMeasuresToSection}
              onRemoveMeasure={handleRemoveMeasure}
            />
          )
        })}
      </div>

      {/* Agregar Nueva Sección en Modo Edición */}
      {effectiveIsEditing && (
        <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/30">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Añadir una nueva sección al Lead Sheet:
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {SECTION_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                onClick={() => handleAddSection(opt.value)}
                className="text-xs font-semibold gap-1 bg-white dark:bg-slate-900"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ {opt.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Barra Fija Inferior de Navegación Rápida de Secciones y Pedal */}
      <SectionQuickNav
        sections={sections}
        collapsedSections={collapsedSections}
        onToggleCollapseAll={handleToggleCollapseAll}
        onSelectSection={handleSelectSectionJump}
        activeSectionId={activeSectionId}
        onPrevSection={handlePrevSection}
        onNextSection={handleNextSection}
      />

      {/* Modal Asistente de Enlace de YouTube */}
      <YouTubeLinkModal
        isOpen={isYouTubeModalOpen}
        initialUrl={youtubeUrl}
        songTitle={song.title}
        onClose={() => setIsYouTubeModalOpen(false)}
        onSave={handleSaveYouTubeUrl}
      />
    </div>
  )
}
