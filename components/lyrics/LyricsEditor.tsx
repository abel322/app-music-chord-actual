'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Copy, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  Check, 
  Type, 
  Eye, 
  Edit3, 
  Repeat,
  Minus,
  Plus,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapTempoButton } from '@/components/ui/TapTempoButton'
import { updateSongAction } from '@/app/actions/songs'
import { useAuth } from '@/lib/context/auth-context'
import { cn } from '@/lib/utils'
import { getBeatsPerMeasure } from '@/lib/measure-utils'

interface SongData {
  id: string
  title: string
  artist: string | null
  key: string | null
  timeSignature?: string | null
  tempo?: number | null
  sections?: any
  lyrics?: string | null
  content?: string | null
}

interface LyricsEditorProps {
  song: SongData
}

const STRUCTURE_TAGS = [
  '[Intro]',
  '[Estrofa 1]',
  '[Estrofa 2]',
  '[Pre-Coro]',
  '[Coro]',
  '[Coro 2x]',
  '[Puente]',
  '[Puente 4x]',
  '[Interludio]',
  '[Solo]',
  '[Outro]',
]

export interface ParsedLyricsSection {
  id: string
  rawHeader: string
  cleanName: string
  repeats: number
  headerLineIndex: number
  lines: string[]
  measuresCount: number
  singleLapDurationMs: number
  totalDurationMs: number
}

/**
 * Parsea una etiqueta de sección musical y extrae su nombre limpio y factor de repetición.
 * Soporta formatos: [CORO 2x], [CORO (x2)], [CORO (2x)], [CORO x2], [ESTROFA 1 (2x)], [PUENTE 4x], etc.
 */
export function parseSectionTag(rawInside: string): { cleanName: string; repeats: number } {
  const trimmed = rawInside.trim()
  const repeatRegex = /(?:[\s\-_]+|\s*\()(?:x\s*(\d+)|(\d+)\s*x)\s*\)?$/i
  const match = trimmed.match(repeatRegex)

  if (match) {
    const numStr = match[1] || match[2]
    const parsedNum = parseInt(numStr, 10)
    const cleanName = trimmed.replace(repeatRegex, '').trim()
    return {
      cleanName: cleanName || trimmed,
      repeats: !isNaN(parsedNum) && parsedNum > 0 ? parsedNum : 1,
    }
  }

  return {
    cleanName: trimmed,
    repeats: 1,
  }
}

export function LyricsEditor({ song }: LyricsEditorProps) {
  const router = useRouter()
  const { isAdmin } = useAuth()

  // Extraer texto inicial de letras (priorizando lyrics, o limpiando content)
  const initialText = () => {
    if (song.lyrics && song.lyrics.trim().length > 0) {
      return song.lyrics
    }
    if (song.content && song.content.trim().length > 0) {
      // Limpiar posibles acordes entre corchetes si es texto crudo
      return song.content.replace(/\[[A-G][#b]?[^\]]*\]/g, '').replace(/\n{3,}/g, '\n\n').trim()
    }
    return `[Intro]\n\n[Estrofa 1]\nEscribe aquí la primera estrofa...\n\n[Coro]\nEscribe aquí el coro de la canción...\n\n[Outro]`
  }

  const [text, setText] = useState<string>(initialText)
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read')
  const effectiveViewMode = isAdmin ? viewMode : 'read'
  const [fontSize, setFontSize] = useState<number>(18) // px
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // BPM Rítmico Compartido (Single Source of Truth)
  const [tempo, setTempo] = useState<number>(song.tempo || 120)
  const [isSavingTempo, setIsSavingTempo] = useState(false)
  const [tempoSavedIndicator, setTempoSavedIndicator] = useState(false)
  const tempoDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Metrónomo Web Audio API
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false)
  const isMetronomeActiveRef = useRef<boolean>(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastBeatRef = useRef<number>(-1)
  const [currentBeat, setCurrentBeat] = useState<number>(1)
  const [currentMeasure, setCurrentMeasure] = useState<number>(1)

  // Selector interactivo de repetición abierto
  const [openRepeatDropdown, setOpenRepeatDropdown] = useState<number | null>(null)

  // Estados del Teleprompter Inteligente
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0)
  const [currentRepeat, setCurrentRepeat] = useState<number>(1)
  const [lapProgress, setLapProgress] = useState<number>(0)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Referencias para el loop de animación a 60fps
  const isPlayingRef = useRef(false)
  const activeSectionIdxRef = useRef(0)
  const currentRepeatRef = useRef(1)
  const lapElapsedRef = useRef(0)
  const lastTimeRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)

  // Sincronizar referencias con estados React
  useEffect(() => {
    isPlayingRef.current = isAutoScrolling
  }, [isAutoScrolling])

  useEffect(() => {
    activeSectionIdxRef.current = activeSectionIdx
  }, [activeSectionIdx])

  useEffect(() => {
    currentRepeatRef.current = currentRepeat
  }, [currentRepeat])

  useEffect(() => {
    isMetronomeActiveRef.current = isMetronomeActive
  }, [isMetronomeActive])

  // Inicializar o reanudar AudioContext con Web Audio API
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }, [])

  // Reproducir clic sutil de metrónomo sintetizado
  // Pulso acentuado (tiempo 1): 1000 Hz, duración 50 ms
  // Pulsos secundarios (tiempos 2, 3, 4): 700 Hz, duración 40 ms
  const playMetronomePulse = useCallback((isDownbeat: boolean) => {
    if (!isMetronomeActiveRef.current) return
    const ctx = getAudioContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      const freq = isDownbeat ? 1000 : 700
      const durationSec = isDownbeat ? 0.05 : 0.04
      const peakGain = isDownbeat ? 0.35 : 0.22

      osc.frequency.setValueAtTime(freq, now)

      // Control suave de ganancia para evitar chasquidos (pops/clicks)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + durationSec + 0.01)
    } catch {
      // Audio context safe fallback
    }
  }, [getAudioContext])

  // Alternar metrónomo sonoro (1 clic sin pausar teleprompter)
  const toggleMetronome = () => {
    setIsMetronomeActive((prev) => {
      const next = !prev
      isMetronomeActiveRef.current = next
      if (next) {
        getAudioContext()
      }
      return next
    })
  }

  // Desplazamiento suave de una sección al área de lectura confortable
  const scrollToSection = useCallback((secIndex: number, resetToTop: boolean = false) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const sectionEl = document.getElementById(`lyrics-sec-${secIndex}`)
    if (!sectionEl) return

    const containerRect = container.getBoundingClientRect()
    const sectionRect = sectionEl.getBoundingClientRect()
    const relativeTop = sectionRect.top - containerRect.top + container.scrollTop

    // Dejar un margen superior de 24px para respirar debajo de la barra
    const targetScrollTop = Math.max(0, relativeTop - 24)

    container.scrollTo({
      top: targetScrollTop,
      behavior: resetToTop ? 'auto' : 'smooth',
    })
  }, [])

  // Modificación y auto-sincronización de BPM en base de datos (PATCH /api/songs/[id])
  const handleTempoChange = useCallback((newTempo: number) => {
    const validBpm = Math.max(30, Math.min(300, Math.round(newTempo)))
    setTempo(validBpm)

    if (tempoDebounceTimerRef.current) {
      clearTimeout(tempoDebounceTimerRef.current)
    }

    tempoDebounceTimerRef.current = setTimeout(async () => {
      setIsSavingTempo(true)
      try {
        const res = await fetch(`/api/songs/${song.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempo: validBpm }),
        })
        if (res.ok) {
          setTempoSavedIndicator(true)
          setTimeout(() => setTempoSavedIndicator(false), 2500)
          router.refresh()
        }
      } catch (err) {
        console.error('Error auto-guardando BPM desde letras:', err)
      } finally {
        setIsSavingTempo(false)
      }
    }, 400)
  }, [song.id, router])

  // Cálculo físico de secciones líricas con compases y duración rítmica real
  const parsedSections = useMemo<ParsedLyricsSection[]>(() => {
    const lines = text.split('\n')
    const sections: ParsedLyricsSection[] = []

    const beatsPerMeasure = getBeatsPerMeasure(song.timeSignature || '4/4')
    const pulseDurationMs = (60 / Math.max(30, Math.min(300, tempo || 72))) * 1000
    const measureDurationMs = pulseDurationMs * beatsPerMeasure

    const songSectionsList: any[] = Array.isArray(song.sections) ? song.sections : []

    let currentSection: ParsedLyricsSection | null = null

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim()
      const headerMatch = trimmed.match(/^\[([^\]]+)\]$/)

      if (headerMatch) {
        if (currentSection) {
          sections.push(finalizeSection(currentSection, measureDurationMs, songSectionsList))
        }
        const rawInside = headerMatch[1]
        const { cleanName, repeats } = parseSectionTag(rawInside)
        currentSection = {
          id: `lyrics-sec-${sections.length}`,
          rawHeader: trimmed,
          cleanName,
          repeats,
          headerLineIndex: lineIdx,
          lines: [],
          measuresCount: 4,
          singleLapDurationMs: 4 * measureDurationMs,
          totalDurationMs: 4 * measureDurationMs * repeats,
        }
      } else {
        if (!currentSection) {
          // Si el texto no inicia con corchetes, crear sección inicial por defecto
          currentSection = {
            id: 'lyrics-sec-0',
            rawHeader: '[Canción]',
            cleanName: 'Canción',
            repeats: 1,
            headerLineIndex: -1,
            lines: [],
            measuresCount: 4,
            singleLapDurationMs: 4 * measureDurationMs,
            totalDurationMs: 4 * measureDurationMs,
          }
        }
        currentSection.lines.push(line)
      }
    })

    if (currentSection) {
      sections.push(finalizeSection(currentSection, measureDurationMs, songSectionsList))
    }

    return sections
  }, [text, tempo, song.timeSignature, song.sections])

  function finalizeSection(
    sec: ParsedLyricsSection,
    measureDurationMs: number,
    songSections: any[]
  ): ParsedLyricsSection {
    let measuresCount = 4
    if (songSections && songSections.length > 0) {
      const cleanLower = sec.cleanName.toLowerCase().trim()
      const match = songSections.find((s) => {
        const sLabel = (s.label || '').toLowerCase().trim()
        const sType = (s.type || '').toLowerCase().trim()
        return (
          sLabel === cleanLower ||
          sLabel.includes(cleanLower) ||
          cleanLower.includes(sLabel) ||
          sType === cleanLower
        )
      })

      let effectiveRepeats = sec.repeats
      if (match) {
        if (Array.isArray(match.measures) && match.measures.length > 0) {
          measuresCount = match.measures.length
        } else {
          const nonBlank = sec.lines.filter((l) => l.trim().length > 0).length
          measuresCount = Math.max(4, nonBlank * 2)
        }
        if (effectiveRepeats === 1 && match.repeatCount && match.repeatCount > 1) {
          effectiveRepeats = match.repeatCount
        }
      } else {
        const nonBlank = sec.lines.filter((l) => l.trim().length > 0).length
        measuresCount = Math.max(4, nonBlank * 2)
      }
    } else {
      const nonBlank = sec.lines.filter((l) => l.trim().length > 0).length
      measuresCount = Math.max(4, nonBlank * 2)
    }

    const effectiveRepeats = sec.repeats
    const singleLapDurationMs = measuresCount * measureDurationMs
    const totalDurationMs = singleLapDurationMs * effectiveRepeats

    return {
      ...sec,
      repeats: effectiveRepeats,
      measuresCount,
      singleLapDurationMs,
      totalDurationMs,
    }
  }

  // Ref a secciones para uso seguro en el loop de requestAnimationFrame
  const parsedSectionsRef = useRef(parsedSections)
  useEffect(() => {
    parsedSectionsRef.current = parsedSections
  }, [parsedSections])

  // Bucle de Teleprompter Inteligente con Sincronización Rítmica, Metrónomo y Repeticiones (2x, 4x)
  useEffect(() => {
    if (!isAutoScrolling) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      lastBeatRef.current = -1
      return
    }

    lastTimeRef.current = performance.now()

    const loop = (currentTime: number) => {
      if (!isPlayingRef.current) return

      const dt = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      const sections = parsedSectionsRef.current
      const curSecIdx = activeSectionIdxRef.current
      const curSection = sections[curSecIdx]

      if (!curSection) {
        // Fin de la canción
        setIsAutoScrolling(false)
        return
      }

      lapElapsedRef.current += dt
      const lapDuration = curSection.singleLapDurationMs
      const progress = Math.min(1, Math.max(0, lapElapsedRef.current / lapDuration))
      setLapProgress(progress)

      // Cálculo de compases y pulsos rítmicos para el metrónomo y secciones instrumentales
      const beatsPerMeasure = getBeatsPerMeasure(song.timeSignature || '4/4')
      const pulseDurationMs = (60 / Math.max(30, Math.min(300, tempo || 72))) * 1000
      const measureDurationMs = pulseDurationMs * beatsPerMeasure

      const totalBeats = Math.floor(lapElapsedRef.current / pulseDurationMs)
      const beatInMeasure = (totalBeats % beatsPerMeasure) + 1
      const measureInSec = Math.min(
        curSection.measuresCount,
        Math.floor(lapElapsedRef.current / measureDurationMs) + 1
      )

      if (totalBeats !== lastBeatRef.current) {
        lastBeatRef.current = totalBeats
        setCurrentBeat(beatInMeasure)
        setCurrentMeasure(measureInSec)
        if (isMetronomeActiveRef.current) {
          playMetronomePulse(beatInMeasure === 1)
        }
      }

      // Desplazamiento progresivo vertical dentro de la sección si es muy extensa
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const sectionEl = document.getElementById(curSection.id)
        if (sectionEl) {
          const containerHeight = container.clientHeight
          const sectionHeight = sectionEl.offsetHeight
          // Si la sección es más alta que el viewport, realizar scroll pausado a lo largo de la vuelta
          if (sectionHeight > containerHeight - 100) {
            const containerRect = container.getBoundingClientRect()
            const sectionRect = sectionEl.getBoundingClientRect()
            const relativeTop = sectionRect.top - containerRect.top + container.scrollTop
            const maxDelta = sectionHeight - containerHeight + 80
            const calculatedScroll = relativeTop - 24 + progress * maxDelta
            container.scrollTop = calculatedScroll
          }
        }
      }

      // Si ha transcurrido el tiempo musical de la vuelta actual
      if (lapElapsedRef.current >= lapDuration) {
        // ¿Faltan repeticiones en esta misma sección?
        if (currentRepeatRef.current < curSection.repeats) {
          // Avanzar a la siguiente vuelta de la misma sección
          const nextRep = currentRepeatRef.current + 1
          currentRepeatRef.current = nextRep
          setCurrentRepeat(nextRep)
          lapElapsedRef.current = 0
          setLapProgress(0)
          lastBeatRef.current = -1
          // Reposicionar la vista suavemente al inicio de esta sección para la siguiente vuelta
          scrollToSection(curSecIdx, false)
        } else {
          // Se completaron todas las repeticiones musicales asignadas
          const nextSecIdx = curSecIdx + 1
          if (nextSecIdx < sections.length) {
            activeSectionIdxRef.current = nextSecIdx
            setActiveSectionIdx(nextSecIdx)
            currentRepeatRef.current = 1
            setCurrentRepeat(1)
            lapElapsedRef.current = 0
            setLapProgress(0)
            lastBeatRef.current = -1
            // Avanzar suavemente a la siguiente parte de la canción (ej. Interludio o Puente)
            scrollToSection(nextSecIdx, false)
          } else {
            // Se terminó la última sección del tema
            setIsAutoScrolling(false)
            return
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [isAutoScrolling, scrollToSection, song.timeSignature, tempo, playMetronomePulse])

  // Iniciar / Pausar Teleprompter
  const handleTogglePlay = () => {
    setIsAutoScrolling((prev) => {
      const next = !prev
      if (next) {
        getAudioContext()
        scrollToSection(activeSectionIdxRef.current, false)
      } else {
        lastBeatRef.current = -1
      }
      return next
    })
  }

  // Reiniciar teleprompter al inicio de la canción
  const handleRestart = () => {
    setIsAutoScrolling(false)
    activeSectionIdxRef.current = 0
    setActiveSectionIdx(0)
    currentRepeatRef.current = 1
    setCurrentRepeat(1)
    lapElapsedRef.current = 0
    setLapProgress(0)
    lastBeatRef.current = -1
    setCurrentBeat(1)
    setCurrentMeasure(1)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Salto manual a una sección específica
  const handleJumpToSection = (secIndex: number) => {
    activeSectionIdxRef.current = secIndex
    setActiveSectionIdx(secIndex)
    currentRepeatRef.current = 1
    setCurrentRepeat(1)
    lapElapsedRef.current = 0
    setLapProgress(0)
    lastBeatRef.current = -1
    setCurrentBeat(1)
    setCurrentMeasure(1)
    scrollToSection(secIndex, false)
  }

  // Modificar interactivamente repeticiones de una sección (1x, 2x, 3x, 4x)
  const handleSetSectionRepeat = (headerLineIndex: number, cleanName: string, newRepeats: number) => {
    const lines = text.split('\n')
    if (headerLineIndex >= 0 && headerLineIndex < lines.length) {
      const newTag = newRepeats > 1 ? `[${cleanName} ${newRepeats}x]` : `[${cleanName}]`
      lines[headerLineIndex] = newTag
      const newText = lines.join('\n')
      setText(newText)
    }
  }

  // Insertar tag de estructura en la posición del cursor en modo edición
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      setText((prev) => `${prev}\n\n${tag}\n`)
      return
    }

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const previousContent = text.substring(0, start)
    const afterContent = text.substring(end)

    const prefix = previousContent.endsWith('\n') || previousContent.length === 0 ? '' : '\n\n'
    const suffix = '\n'
    const insertion = `${prefix}${tag}${suffix}`

    const updated = `${previousContent}${insertion}${afterContent}`
    setText(updated)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + insertion.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  // Copiar letra limpia al portapapeles
  const handleCopyLyrics = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      alert('No se pudo copiar al portapapeles.')
    }
  }

  // Exportar a archivo de texto plano (.txt)
  const handleExportTxt = () => {
    const filename = `${song.title} - ${song.artist || 'MusicChord'} (Letra).txt`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Guardar letra y tempo en la base de datos
  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await updateSongAction(song.id, {
        lyrics: text,
        tempo,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      router.refresh()
    } catch (err) {
      console.error('Error al guardar letra:', err)
      alert('Hubo un error al guardar la letra.')
    } finally {
      setIsSaving(false)
    }
  }

  // Atajos de teclado: Barra espaciadora para Play/Pause y 'M' para Metrónomo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el foco está en un textarea o input, no intervenir
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        handleTogglePlay()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMetronome()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTogglePlay, toggleMetronome])

  // Conteo de líneas y palabras
  const linesCount = text.split('\n').filter((l) => l.trim().length > 0).length
  const wordsCount = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0
  const beatsPerMeasure = getBeatsPerMeasure(song.timeSignature || '4/4')

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/songs/lyrics">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Volver a Letras</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{song.title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Visor de Letras (Teleprompter)
              </span>
            </h1>
            <p className="text-xs text-slate-500">{song.artist || 'Artista no especificado'}</p>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Enlace directo a la vista de Acordes */}
          <Link href={`/dashboard/songs/chords/${song.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800/60">
              <Music className="w-3.5 h-3.5" />
              <span>Ver Acordes</span>
            </Button>
          </Link>

          {/* Toggle Modo Lectura / Edición (Solo Administrador) */}
          {isAdmin && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('read')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  viewMode === 'read'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lectura / Prompter</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  viewMode === 'edit'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor de Texto</span>
              </button>
            </div>
          )}

          {/* Guardar Letra y Tempo (Solo Administrador) */}
          {isAdmin && (
            <Button
              variant="gradient"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-bold gap-1.5 shadow-md shadow-purple-900/20"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Herramientas de Lectura y Teleprompter con BPM y Metrónomo */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg">
        {/* Controles de Teleprompter, Metrónomo Web Audio y BPM Compartido */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Iniciar / Pausar */}
          <Button
            variant={isAutoScrolling ? 'destructive' : 'default'}
            size="sm"
            onClick={handleTogglePlay}
            className={cn(
              'gap-2 text-xs font-black shrink-0 transition-all shadow-md',
              isAutoScrolling
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/30'
            )}
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isAutoScrolling ? 'Pausar Teleprompter' : 'Iniciar Teleprompter'}</span>
          </Button>

          {/* Botón Reiniciar al inicio */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestart}
            className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 px-2.5"
            title="Reiniciar teleprompter al inicio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* Botón Toggle de Metrónomo Web Audio API */}
          <button
            type="button"
            onClick={toggleMetronome}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 select-none cursor-pointer shadow-xs active:scale-95',
              isMetronomeActive
                ? 'bg-purple-600 text-white border-purple-500 shadow-purple-600/30 ring-1 ring-purple-400/40'
                : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
            )}
            title={
              isMetronomeActive
                ? 'Metrónomo con audio encendido (Clic o tecla M para silenciar)'
                : 'Metrónomo silenciado (Clic o tecla M para activar sonido rítmico)'
            }
          >
            {isMetronomeActive ? (
              <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {isMetronomeActive ? 'Metrónomo: ON' : 'Metrónomo: OFF'}
            </span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Control de Tempo en la Barra de Herramientas (BPM Real Compartido con Acordes) */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 shadow-inner">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              BPM:
            </span>

            {/* Decremento rápido -1 */}
            <button
              type="button"
              onClick={() => handleTempoChange(tempo - 1)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white text-xs transition-colors"
              title="Reducir 1 BPM"
            >
              <Minus className="w-3 h-3" />
            </button>

            {/* Input numérico directo */}
            <input
              type="number"
              min={30}
              max={300}
              value={tempo}
              onChange={(e) => handleTempoChange(parseInt(e.target.value) || 120)}
              className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs font-mono font-black text-center text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              title="Tempo de la canción en BPM (Sincronizado con Acordes)"
            />

            {/* Incremento rápido +1 */}
            <button
              type="button"
              onClick={() => handleTempoChange(tempo + 1)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white text-xs transition-colors"
              title="Aumentar 1 BPM"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Botones de Ajuste Rápido de BPM */}
            <div className="hidden sm:flex items-center gap-1 ml-1 border-l border-slate-700 pl-1.5">
              {[70, 72, 80, 120].map((presetBpm) => (
                <button
                  key={presetBpm}
                  type="button"
                  onClick={() => handleTempoChange(presetBpm)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors',
                    tempo === presetBpm
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  )}
                  title={`Ajustar a ${presetBpm} BPM`}
                >
                  {presetBpm}
                </button>
              ))}
            </div>

            {/* Tap Tempo */}
            <div className="ml-1">
              <TapTempoButton
                onTempoChange={(bpm) => handleTempoChange(bpm)}
                currentTempo={tempo}
                timeSignature={song.timeSignature || '4/4'}
                className="px-2 py-1 text-[11px] bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              />
            </div>

            {/* Indicador de Sincronización en Nube */}
            {isSavingTempo && (
              <span className="text-[10px] text-amber-400 font-medium animate-pulse ml-1">
                Guardando...
              </span>
            )}
            {!isSavingTempo && tempoSavedIndicator && (
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 ml-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                Sync
              </span>
            )}
          </div>
        </div>

        {/* Tamaño de Fuente y Utilidades de Copia/Exportación */}
        <div className="flex items-center gap-2.5 justify-end flex-wrap">
          {/* Selector de Tamaño de Fuente */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
            <Type className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold"
              title="Reducir fuente"
            >
              A-
            </button>
            <span className="w-8 text-center font-mono font-bold text-xs">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.min(36, prev + 2))}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold"
              title="Aumentar fuente"
            >
              A+
            </button>
          </div>

          {/* Copiar Letra */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLyrics}
            className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            title="Copiar letra al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar'}</span>
          </Button>

          {/* Exportar a Archivo .txt */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportTxt}
            className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
            title="Descargar archivo de texto plano"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar .txt</span>
          </Button>
        </div>
      </div>

      {/* Barra de Tags Rápidos en Modo Edición */}
      {effectiveViewMode === 'edit' && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap animate-in fade-in">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Insertar Sección:
          </span>
          {STRUCTURE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleInsertTag(tag)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors shadow-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Área Principal de Visualización / Edición con Teleprompter Inteligente */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'rounded-2xl border transition-all p-6 sm:p-10 max-h-[68vh] overflow-y-auto scroll-smooth relative',
          effectiveViewMode === 'read'
            ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-purple-500/40 ring-1 ring-purple-500/20'
        )}
      >
        {effectiveViewMode === 'edit' ? (
          /* Modo Edición: Textarea Estructurado */
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ fontSize: `${fontSize}px` }}
              rows={22}
              placeholder="Escribe o pega aquí la letra de la canción..."
              className="w-full bg-transparent border-0 focus:outline-none resize-none font-serif leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        ) : (
          /* Modo Lectura / Escenario / Prompter con Karaoke y Sincronización Rítmica */
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="font-serif leading-loose tracking-wide select-text max-w-3xl mx-auto space-y-6"
          >
            {parsedSections.map((section, secIdx) => {
              const isActive = isAutoScrolling && activeSectionIdx === secIdx
              const nonBlankLines = section.lines.filter((l) => l.trim().length > 0)
              const isInstrumental = nonBlankLines.length === 0

              // Cálculo de la línea y palabra activa para el resaltador de frase / karaoke
              let activeLineIndex = -1
              let activeWordIndex = -1

              if (isActive && !isInstrumental && nonBlankLines.length > 0) {
                // progresión de la línea en la vuelta actual
                activeLineIndex = Math.min(
                  nonBlankLines.length - 1,
                  Math.floor(lapProgress * nonBlankLines.length)
                )

                const lineFraction = lapProgress * nonBlankLines.length - activeLineIndex
                const currentLineText = nonBlankLines[activeLineIndex] || ''
                const wordsInLine = currentLineText.trim().split(/\s+/)
                if (wordsInLine.length > 0) {
                  activeWordIndex = Math.min(
                    wordsInLine.length - 1,
                    Math.floor(lineFraction * wordsInLine.length)
                  )
                }
              }

              let nonBlankCounter = 0

              return (
                <div
                  key={section.id}
                  id={section.id}
                  onClick={() => handleJumpToSection(secIdx)}
                  className={cn(
                    'group rounded-2xl p-4 sm:p-5 transition-all duration-300 relative cursor-pointer',
                    isActive
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-2 border-purple-500/80 shadow-md shadow-purple-500/10'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40 border border-transparent'
                  )}
                >
                  {/* Cabecera de la Sección con Controles de Repetición y Estado Activo */}
                  <div className="flex items-center gap-2.5 mb-3 flex-wrap select-none">
                    {/* Badge Morado de la Sección */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-sans font-extrabold uppercase tracking-widest border shadow-xs transition-colors',
                        isActive
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      )}
                    >
                      {section.cleanName}
                    </span>

                    {/* Control Interactivo de Repetición (Badge / Dropdown: 1x, 2x, 3x, 4x) */}
                    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenRepeatDropdown(openRepeatDropdown === secIdx ? null : secIdx)
                        }
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-sans font-black transition-all border shadow-xs cursor-pointer',
                          section.repeats > 1
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                        )}
                        title={`Configurar repeticiones de ${section.cleanName}`}
                      >
                        <Repeat className="w-3 h-3" />
                        <span>{section.repeats}x</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {openRepeatDropdown === secIdx && (
                        <div className="absolute left-0 mt-1.5 z-40 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 animate-in fade-in zoom-in-95">
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Repetición Musical
                          </div>
                          {[1, 2, 3, 4].map((rep) => (
                            <button
                              key={rep}
                              type="button"
                              onClick={() => {
                                handleSetSectionRepeat(section.headerLineIndex, section.cleanName, rep)
                                setOpenRepeatDropdown(null)
                              }}
                              className={cn(
                                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors',
                                section.repeats === rep
                                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              )}
                            >
                              <span>{rep === 1 ? '1x (por defecto)' : `${rep}x (${rep} vueltas)`}</span>
                              {section.repeats === rep && (
                                <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Indicador Visual de Repetición Activa durante la Ejecución */}
                    {isActive && section.repeats > 1 && (
                      <div className="inline-flex items-center gap-2 animate-in fade-in">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-sans font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/50 animate-pulse shadow-sm">
                          <RotateCcw className="w-3 h-3 animate-spin [animation-duration:2.5s]" />
                          <span>
                            Repitiendo ({currentRepeat} de {section.repeats})
                          </span>
                        </div>

                        {/* Barra de progreso de la vuelta actual */}
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/40 dark:border-slate-700/60">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full transition-all duration-75"
                            style={{ width: `${Math.min(100, Math.max(0, lapProgress * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CASO A: Sección Instrumental (Intro, Interludios, Solos) */}
                  {isInstrumental ? (
                    isActive ? (
                      /* Tarjeta de Sección Instrumental Activa con Cuenta de Compases y Pulsos en Vivo */
                      <div className="rounded-xl border border-purple-300/60 dark:border-purple-700/60 bg-gradient-to-r from-purple-50/90 via-purple-100/40 to-purple-50/90 dark:from-purple-950/40 dark:via-purple-900/20 dark:to-purple-950/40 p-4 sm:p-5 my-2 shadow-xs transition-all animate-in fade-in select-none">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Pulso numérico actual */}
                            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-mono font-black text-lg shadow-md shadow-purple-600/30">
                              {currentBeat}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                  Sección Instrumental
                                </span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-200/80 dark:bg-purple-900/70 font-bold text-purple-900 dark:text-purple-200 border border-purple-300/60 dark:border-purple-800">
                                  Compás {currentMeasure} de {section.measuresCount}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Preparando entrada vocal para la siguiente sección...
                              </p>
                            </div>
                          </div>

                          {/* Medidor visual de tiempos por compás */}
                          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                              Tiempos:
                            </span>
                            {Array.from({ length: beatsPerMeasure }).map((_, beatIdx) => {
                              const beatNum = beatIdx + 1
                              const isCurrent = currentBeat === beatNum
                              return (
                                <div
                                  key={beatNum}
                                  className={cn(
                                    'w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black transition-all duration-100',
                                    isCurrent
                                      ? 'bg-purple-600 text-white scale-110 shadow-sm shadow-purple-500/40'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                  )}
                                >
                                  {beatNum}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Barra de progreso del compás e instrumental */}
                        <div className="mt-3.5 space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-purple-700 dark:text-purple-300 font-bold">
                            <span>Compás {currentMeasure} de {section.measuresCount}</span>
                            <span>{Math.round(lapProgress * 100)}%</span>
                          </div>
                          <div className="h-2 w-full bg-purple-200/60 dark:bg-slate-800 rounded-full overflow-hidden border border-purple-300/40 dark:border-purple-800/40">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500 rounded-full transition-all duration-75"
                              style={{ width: `${Math.min(100, Math.max(0, lapProgress * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Sección Instrumental en Reposo */
                      <div className="py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                        <Music className="w-3.5 h-3.5 text-purple-500" />
                        <span>Sección Instrumental • {section.measuresCount} compases</span>
                      </div>
                    )
                  ) : (
                    /* CASO B: Sección con Letra (Versos con Resaltador Karaoke y Frase Tracker) */
                    <div className="text-slate-800 dark:text-slate-100 select-text">
                      {section.lines.map((line, lIdx) => {
                        const trimmedLine = line.trim()
                        if (trimmedLine === '') {
                          return <div key={lIdx} className="h-3" />
                        }

                        const lineIndexInNonBlank = nonBlankCounter++

                        if (isActive) {
                          // Línea actual en curso
                          if (lineIndexInNonBlank === activeLineIndex) {
                            const words = trimmedLine.split(/\s+/)
                            return (
                              <p key={lIdx} className="my-1.5 leading-relaxed">
                                <span className="bg-purple-100/90 text-purple-950 dark:bg-purple-900/50 dark:text-purple-100 font-semibold px-2.5 py-1 rounded-xl transition-all duration-200 inline-block shadow-xs border border-purple-200/80 dark:border-purple-800/60">
                                  {words.map((word, wIdx) => {
                                    const isCurrentWord = wIdx === activeWordIndex
                                    const isPastWord = wIdx < activeWordIndex

                                    return (
                                      <span
                                        key={wIdx}
                                        className={cn(
                                          'inline-block mr-1.5 transition-all duration-150',
                                          isCurrentWord
                                            ? 'text-purple-700 dark:text-purple-300 font-black underline decoration-purple-500 decoration-2 underline-offset-4 scale-[1.03]'
                                            : isPastWord
                                            ? 'text-purple-900/80 dark:text-purple-200/90 font-medium'
                                            : 'text-purple-900/50 dark:text-purple-300/50'
                                        )}
                                      >
                                        {word}
                                      </span>
                                    )
                                  })}
                                </span>
                              </p>
                            )
                          }

                          // Línea ya leída / cantada
                          if (lineIndexInNonBlank < activeLineIndex) {
                            return (
                              <p
                                key={lIdx}
                                className="my-1 leading-relaxed text-slate-400 dark:text-slate-500 opacity-60 transition-opacity duration-200"
                              >
                                {line}
                              </p>
                            )
                          }

                          // Línea próxima por cantar
                          return (
                            <p
                              key={lIdx}
                              className="my-1 leading-relaxed text-slate-800 dark:text-slate-200 transition-opacity duration-200"
                            >
                              {line}
                            </p>
                          )
                        }

                        // Modo inactivo normal
                        return (
                          <p key={lIdx} className="my-1 leading-relaxed">
                            {line}
                          </p>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen de Conteo en la parte inferior */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>
          <strong>{linesCount}</strong> líneas de verso • <strong>{wordsCount}</strong> palabras •{' '}
          <strong>{parsedSections.length}</strong> secciones
        </span>
        <span>
          Modo actual:{' '}
          <strong className="text-slate-600 dark:text-slate-300 capitalize">
            {effectiveViewMode === 'read' ? 'Lectura Prompter' : 'Edición'}
          </strong>
        </span>
      </div>
    </div>
  )
}
