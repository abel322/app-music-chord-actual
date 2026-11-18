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
          label: 'INTRO',
          timeSignature: song.timeSignature || '4/4',
          instruments: [],
          measures: generateMeasures(4, 1, song.timeSignature || '4/4', [song.key || 'C']),
        },
        {
          id: `sec-verse-${Date.now()}`,
          type: 'verse',
          label: 'ESTROFA 1',
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

  // Desplazamiento suave centrado hacia la sección objetivo (Anterior Arriba • Actual en el Centro • Siguiente Abajo)
  const scrollAnimRef = useRef<number | null>(null)

  const smoothScrollToCenter = useCallback((el: HTMLElement, duration = 650) => {
    if (scrollAnimRef.current) {
      cancelAnimationFrame(scrollAnimRef.current)
      scrollAnimRef.current = null
    }

    const rect = el.getBoundingClientRect()
    const targetY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2)
    const startY = window.scrollY
    const diff = Math.max(0, targetY) - startY
    const startTime = performance.now()

    function step(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Curva suave easeInOutCubic (no brusca)
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
      window.scrollTo(0, startY + diff * ease)
      if (progress < 1) {
        scrollAnimRef.current = requestAnimationFrame(step)
      } else {
        scrollAnimRef.current = null
      }
    }
    scrollAnimRef.current = requestAnimationFrame(step)
  }, [])

  const scrollToSection = useCallback(
    (secId: string) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(`section-${secId}`)
          if (el) {
            smoothScrollToCenter(el, 650)
          }
        }, 50)
      })
    },
    [smoothScrollToCenter]
  )

  useEffect(() => {
    return () => {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current)
      }
    }
  }, [])

  // Re-centrar suavemente la sección activa al alternar 'stage' (4 col) <-> 'wide' (2 col)
  const isFirstRenderViewMode = useRef(true)
  useEffect(() => {
    if (isFirstRenderViewMode.current) {
      isFirstRenderViewMode.current = false
      return
    }
    if (!activeSectionId) return

    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${activeSectionId}`)
      if (el) {
        smoothScrollToCenter(el, 350)
      }
    }, 60)

    return () => clearTimeout(timer)
  }, [viewMode, activeSectionId, smoothScrollToCenter])

  // Estado de Reproducción de Escenario
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMetronomeOn, setIsMetronomeOn] = useState(true)
  const [activeMeasureIndex, setActiveMeasureIndex] = useState<number | null>(null)
  const [currentBeatIndex, setCurrentBeatIndex] = useState<number | null>(null)

  // Sección activa actual
  const currentActiveSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0] || null
  }, [sections, activeSectionId])

  // ID del compás activo para resaltado
  const activeMeasureId = useMemo(() => {
    if (!isPlaying || activeMeasureIndex === null) return null
    const sec = sections.find((s) => s.id === activeSectionId) || sections[0]
    if (!sec || !sec.measures) return null
    return sec.measures[activeMeasureIndex]?.id || null
  }, [isPlaying, activeMeasureIndex, sections, activeSectionId])

  // Refs mutables para el reloj de pulsos y evitar closures obsoletos
  const isPlayingRef = useRef(isPlaying)
  isPlayingRef.current = isPlaying
  const isMetronomeOnRef = useRef(isMetronomeOn)
  isMetronomeOnRef.current = isMetronomeOn
  const activeSectionIdRef = useRef(activeSectionId)
  activeSectionIdRef.current = activeSectionId
  const activeMeasureIndexRef = useRef(activeMeasureIndex)
  activeMeasureIndexRef.current = activeMeasureIndex
  const currentBeatIndexRef = useRef(currentBeatIndex)
  currentBeatIndexRef.current = currentBeatIndex
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections
  const tempoRef = useRef(tempo)
  tempoRef.current = tempo
  const timeSignatureRef = useRef(timeSignature)
  timeSignatureRef.current = timeSignature

  // Salto rápido a sección (desde tarjeta, píldora o pedal)
  const handleSelectSectionJump = useCallback(
    (sectionId: string) => {
      setActiveSectionId(sectionId)
      setActiveMeasureIndex(0)
      setCurrentBeatIndex(0)
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
        setActiveMeasureIndex(null)
        setCurrentBeatIndex(null)
      }
    }
  }, [sections, activeSectionId, handleSelectSectionJump, isPlaying])

  // Iniciar / Pausar reproducción inmediatamente (desbloqueando AudioContext en el gesto del usuario)
  const handleTogglePlay = useCallback(async () => {
    try {
      const ctx = getAudioContext()
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume()
      }
    } catch (err) {
      console.warn('AudioContext resume error:', err)
    }

    setIsPlaying((prev) => {
      const nextPlaying = !prev
      if (nextPlaying) {
        setIsControlsDrawerOpen(false)
        setCollapsedSections({}) // Mantener todas las secciones desplegadas durante la secuencia
        setIsMetronomeOn(true) // Encender automáticamente el metrónomo al iniciar

        const secId = activeSectionId || sections[0]?.id
        if (secId) {
          setActiveSectionId(secId)
          scrollToSection(secId)
        }
        setActiveMeasureIndex(0)
        setCurrentBeatIndex(0)
      } else {
        setActiveMeasureIndex(null)
        setCurrentBeatIndex(null)
      }
      return nextPlaying
    })
  }, [activeSectionId, sections, scrollToSection])

  // Reiniciar a la primera sección
  const handleRestart = useCallback(() => {
    setIsPlaying(false)
    setActiveMeasureIndex(null)
    setCurrentBeatIndex(null)
    setSectionPassMap({})
    if (sections.length > 0) {
      const firstId = sections[0].id
      setActiveSectionId(firstId)
      scrollToSection(firstId)
    }
  }, [sections, scrollToSection])

  // Estado de vuelta activa para cada sección (Vuelta 1, Vuelta 2... hasta totalPasses)
  const [sectionPassMap, setSectionPassMap] = useState<Record<string, number>>({})
  const sectionPassMapRef = useRef(sectionPassMap)
  sectionPassMapRef.current = sectionPassMap

  // Cálculo de total de vueltas de una sección (passes de letra × ciclos de repetición)
  const getSectionTotalPasses = useCallback((sec: SectionMeasures) => {
    const passesCount = Math.max(1, sec.lyricPasses?.length || 1)
    const cyclesCount = Math.max(1, sec.repeatCycles || sec.repeatCount || 1)
    return passesCount * cyclesCount
  }, [])

  // Duración de una sola vuelta (de sec.measures.length compases) en milisegundos
  const getSinglePassDurationMs = useCallback(
    (sec: SectionMeasures) => {
      const secTempo = sec.tempoOverride || tempo || 120
      const secTimeSig = sec.timeSignature || timeSignature || '4/4'
      const beatsPerMeasure = getBeatsPerMeasure(secTimeSig)
      const measureCount = sec.measures.length > 0 ? sec.measures.length : 4
      return (measureCount * beatsPerMeasure * 60 * 1000) / secTempo
    },
    [tempo, timeSignature]
  )

  // Avanzar manualmente a la siguiente vuelta de una sección
  const handleAdvancePass = useCallback(
    (sectionId: string) => {
      setSectionPassMap((prev) => {
        const sec = sections.find((s) => s.id === sectionId)
        if (!sec) return prev
        const totalPasses = getSectionTotalPasses(sec)
        const current = prev[sectionId] || 0
        const next = (current + 1) % totalPasses
        return { ...prev, [sectionId]: next }
      })
    },
    [sections, getSectionTotalPasses]
  )

  // Seleccionar una vuelta específica (ej. al pulsar la píldora [ Vuelta 1 ] o [ Vuelta 2 ])
  const handleSelectPass = useCallback(
    (sectionId: string, passIdx: number) => {
      setSectionPassMap((prev) => {
        const sec = sections.find((s) => s.id === sectionId)
        if (!sec) return prev
        const passesCount = Math.max(1, sec.lyricPasses?.length || 1)
        const totalPasses = getSectionTotalPasses(sec)
        const current = prev[sectionId] || 0
        const currentCycle = Math.floor(current / passesCount)
        const targetPass = (currentCycle * passesCount + passIdx) % totalPasses
        return { ...prev, [sectionId]: targetPass }
      })
    },
    [sections, getSectionTotalPasses]
  )

  // Actualizar vueltas de letra y ciclos de una sección
  const handleUpdateLyricPasses = useCallback(
    (sectionId: string, passes: import('@/types/measure').SectionLyricPass[], repeatCycles?: number) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec
          const cycles = repeatCycles ?? sec.repeatCycles ?? sec.repeatCount ?? 1
          const passesCount = Math.max(1, passes.length)
          const totalPasses = passesCount * cycles
          return {
            ...sec,
            lyricPasses: passes,
            repeatCycles: cycles,
            repeatCount: totalPasses,
            lyrics: passes[0]?.lyrics || sec.lyrics || '',
            segments: passes[0]?.segments,
          }
        })
      )
    },
    []
  )

  // Reloj unificado de pulsos, compases, vueltas y metrónomo sonoro Web Audio
  useEffect(() => {
    if (!isPlaying) {
      setActiveMeasureIndex(null)
      setCurrentBeatIndex(null)
      return
    }

    let isCancelled = false
    let timerId: NodeJS.Timeout | null = null

    // Helper para obtener parámetros dinámicos de sección
    const getSectionParams = (secId: string) => {
      const sec = sectionsRef.current.find((s) => s.id === secId) || sectionsRef.current[0]
      const secTempo = sec?.tempoOverride || tempoRef.current || 120
      const secTimeSig = sec?.timeSignature || timeSignatureRef.current || '4/4'
      const beatsPerMeasure = getBeatsPerMeasure(secTimeSig)
      const beatIntervalMs = (60 / secTempo) * 1000
      const measureCount = sec?.measures?.length ? sec.measures.length : 4
      const passesCount = Math.max(1, sec?.lyricPasses?.length || 1)
      const cyclesCount = Math.max(1, sec?.repeatCycles || sec?.repeatCount || 1)
      const totalPasses = passesCount * cyclesCount
      return {
        sec,
        secTempo,
        secTimeSig,
        beatsPerMeasure,
        beatIntervalMs,
        measureCount,
        totalPasses,
      }
    }

    // Asegurar que la sección actual esté desplegada
    const currentSecId = activeSectionIdRef.current || sectionsRef.current[0]?.id
    if (currentSecId) {
      setCollapsedSections((prev) => {
        if (prev[currentSecId]) {
          return { ...prev, [currentSecId]: false }
        }
        return prev
      })
    }

    let currentMIdx = activeMeasureIndexRef.current ?? 0
    let currentBIdx = currentBeatIndexRef.current ?? 0

    let { beatsPerMeasure, beatIntervalMs, measureCount, totalPasses } = getSectionParams(
      activeSectionIdRef.current
    )

    // Reproducción sonora precisa de metrónomo Web Audio
    const playTick = (beatIndex: number) => {
      if (!isMetronomeOnRef.current) return
      const ctx = getAudioContext()
      if (ctx) {
        // Beat 1 (beatIndex === 0): Tono agudo 1200 Hz, 35 ms, ganancia 0.45
        // Beats 2, 3, 4... (beatIndex > 0): Tono medio 850 Hz, 30 ms, ganancia 0.25
        playTickSound(ctx, ctx.currentTime, beatIndex === 0)
      }
    }

    // Disparo inmediato del primer pulso al iniciar
    playTick(currentBIdx)
    setActiveMeasureIndex(currentMIdx)
    setCurrentBeatIndex(currentBIdx)

    let expectedTime = performance.now() + beatIntervalMs

    const step = () => {
      if (isCancelled) return

      // Avanzar al siguiente pulso
      currentBIdx += 1

      if (currentBIdx >= beatsPerMeasure) {
        currentBIdx = 0
        currentMIdx += 1

        if (currentMIdx >= measureCount) {
          currentMIdx = 0
          const curSecId = activeSectionIdRef.current
          const curPass = sectionPassMapRef.current[curSecId] || 0

          if (curPass < totalPasses - 1) {
            // Siguiente vuelta dentro de la misma sección (ej. Vuelta 1 -> Vuelta 2)
            const nextPass = curPass + 1
            setSectionPassMap((prev) => ({
              ...prev,
              [curSecId]: nextPass,
            }))
          } else {
            // Se completaron todas las vueltas -> Pasar a la siguiente sección
            const curSecIdx = sectionsRef.current.findIndex((s) => s.id === curSecId)
            if (curSecIdx !== -1 && curSecIdx < sectionsRef.current.length - 1) {
              const nextSec = sectionsRef.current[curSecIdx + 1]
              setSectionPassMap((prev) => ({
                ...prev,
                [nextSec.id]: 0,
              }))
              setActiveSectionId(nextSec.id)
              scrollToSection(nextSec.id)

              // Actualizar parámetros para la nueva sección
              const newParams = getSectionParams(nextSec.id)
              beatsPerMeasure = newParams.beatsPerMeasure
              beatIntervalMs = newParams.beatIntervalMs
              measureCount = newParams.measureCount
              totalPasses = newParams.totalPasses
            } else {
              // Fin de la canción
              setIsPlaying(false)
              setActiveMeasureIndex(null)
              setCurrentBeatIndex(null)
              return
            }
          }
        }
      }

      // Reproducir sonido del pulso
      playTick(currentBIdx)

      // Actualizar UI reactiva
      setActiveMeasureIndex(currentMIdx)
      setCurrentBeatIndex(currentBIdx)

      // Programar siguiente paso con compensación de deriva de tiempo (drift compensation)
      const drift = performance.now() - expectedTime
      expectedTime += beatIntervalMs
      const nextDelay = Math.max(0, beatIntervalMs - drift)
      timerId = setTimeout(step, nextDelay)
    }

    timerId = setTimeout(step, beatIntervalMs)

    return () => {
      isCancelled = true
      if (timerId) clearTimeout(timerId)
    }
  }, [isPlaying, scrollToSection])

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

  // Clic sobre compás: enfocar la sección completa sin auto-scroll molesto durante la edición
  const handleMeasureClick = useCallback(
    (clickedMeasure: Measure) => {
      const foundSection = sections.find((s) => s.measures.some((m) => m.id === clickedMeasure.id))
      if (foundSection) {
        setActiveSectionId(foundSection.id)
        if (isPlaying) {
          const mIdx = foundSection.measures.findIndex((m) => m.id === clickedMeasure.id)
          if (mIdx !== -1) {
            setActiveMeasureIndex(mIdx)
            setCurrentBeatIndex(0)
          }
        }
      }
    },
    [sections, isPlaying]
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
    const defaultName = getSectionDefaultName(type).toUpperCase()
    const countSameType = sections.filter((s) => {
      if (type === 'interlude' || type === 'instrumental') {
        return s.type === 'interlude' || s.type === 'instrumental'
      }
      return s.type === type
    }).length
    const label = `${defaultName} ${countSameType + 1}`.toUpperCase()

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
    <div className="w-full max-w-full min-h-screen max-w-7xl mx-auto pb-36">
      {/* 1. Cabecera Superior Sticky en 2 Filas (Título Visible Arriba + Barra de Transporte Compacta) */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-sm text-white">
        {/* Fila 1 (Título de Canción): Barra limpia h-9 con botón ← y título completo siempre visible */}
        <div className="h-9 px-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              href="/dashboard/songs/chords"
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Volver a lista de canciones"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <h1
              className="text-sm sm:text-base font-extrabold text-white truncate"
              title={song.title}
            >
              {song.title}
            </h1>
            {song.artist && (
              <span className="hidden sm:inline text-xs text-slate-400 truncate">
                • {song.artist}
              </span>
            )}
          </div>
        </div>

        {/* Fila 2 (Barra de Transporte Compacta): Tono/BPM + Botón Iniciar/Pausar + Toggle Escenario + Engranaje */}
        <div className="h-10 px-2.5 sm:px-3 flex items-center justify-between gap-1.5 bg-slate-950/90">
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            {currentKey} • {tempo} BPM
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!isPlaying) {
                  setIsControlsDrawerOpen(false)
                }
                handleTogglePlay()
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer select-none shadow-xs shrink-0 active:scale-95',
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-rose-950/50 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-950/50'
              )}
              title={isPlaying ? 'Pausar reproducción en vivo (Espacio)' : 'Iniciar reproducción en vivo (Espacio)'}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
              <span className="font-extrabold">{isPlaying ? 'Pausar' : 'Iniciar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMetronomeOn((prev) => !prev)}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer select-none shrink-0',
                isMetronomeOn
                  ? 'bg-slate-900 text-amber-400 border-amber-500/50 shadow-xs'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
              )}
              title={isMetronomeOn ? 'Silenciar metrónomo' : 'Activar sonido de metrónomo'}
            >
              <span>{isMetronomeOn ? '🔊' : '🔇'}</span>
            </button>

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
        </div>
      </header>

      {/* Panel Desplegable de Controles y Transporte (Colapsado por defecto para 85%+ área de acordes) */}
      {isControlsDrawerOpen && (
        <div className="sticky top-[76px] z-40 bg-slate-900/98 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 shadow-2xl space-y-3.5 animate-in slide-in-from-top-2 duration-200">
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
      <div className="space-y-4 pt-16 pb-36">
        {sections.map((section, sIdx) => {
          const isSectionActive = section.id === activeSectionId
          const isCurrentlyPlayingSection = Boolean(isPlaying && isSectionActive)
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
              isCollapsed={isPlaying ? false : !!collapsedSections[section.id]}
              globalKey={currentKey}
              globalTimeSignature={timeSignature}
              globalTempo={tempo}
              viewMode={viewMode}
              isPlaying={isPlaying}
              activeMeasureId={isCurrentlyPlayingSection ? activeMeasureId : null}
              currentBeatIndex={isCurrentlyPlayingSection ? currentBeatIndex : null}
              measureDurationMs={0}
              currentRepeat={isSectionActive ? (sectionPassMap[section.id] || 0) + 1 : 1}
              totalRepeats={getSectionTotalPasses(section)}
              currentPassIndex={sectionPassMap[section.id] || 0}
              totalPasses={getSectionTotalPasses(section)}
              onAdvancePass={handleAdvancePass}
              onSelectPass={handleSelectPass}
              onUpdateLyricPasses={handleUpdateLyricPasses}
              nextSectionName={nextSecName}
              isSectionActive={isSectionActive}
              onSectionFocus={(secId) => setActiveSectionId(secId)}
              onToggleCollapse={handleToggleCollapse}
              onUpdateLabel={(secId, newLabel) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === secId ? { ...s, label: newLabel.toUpperCase() } : s))
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
