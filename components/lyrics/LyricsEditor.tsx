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
import { 
  ensureSectionMeasures,
  generateMeasures,
  getBeatsPerMeasure,
  buildFullLyricsText,
  parseLyricsBlocks,
  syncSectionsWithLyrics,
  getSectionBadge
} from '@/lib/measure-utils'
import { SectionMeasures } from '@/types/measure'
import { SectionTempoControl, getTempoDescriptor } from '@/components/chords/SectionTempoControl'

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
  tempoOverride?: number | null
  effectiveBpm: number
  pulseDurationMs: number
  measureDurationMs: number
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

  // 1. Single Source of Truth: Inicializar y migrar secciones directamente de song.sections
  const initialSections = useMemo<SectionMeasures[]>(() => {
    let rawList: SectionMeasures[] = []
    if (Array.isArray(song.sections) && song.sections.length > 0) {
      const counter = { current: 1 }
      rawList = song.sections.map((sec: any, idx: number) =>
        ensureSectionMeasures(sec, idx, song.timeSignature || '4/4', counter)
      )
      // Sincronizar automáticamente letras previas de song.lyrics si section.lyrics estaba vacío
      rawList = syncSectionsWithLyrics(rawList, song.lyrics || song.content)
    } else {
      // Si la canción no tenía secciones creadas en acordes, construirlas a partir del texto de letras
      const blocks = parseLyricsBlocks(song.lyrics || song.content || '')
      if (blocks.length > 0) {
        rawList = blocks.map((b, idx) => ({
          id: `sec-${idx}-${Date.now()}`,
          type: 'verse',
          label: b.cleanName,
          repeatCount: b.repeats || 1,
          measures: generateMeasures(4, idx * 4 + 1, song.timeSignature || '4/4', [song.key || 'C']),
          lyrics: b.lines.join('\n').trim(),
        }))
      } else {
        rawList = [
          {
            id: `sec-intro-${Date.now()}`,
            type: 'intro',
            label: 'Intro',
            repeatCount: 1,
            measures: generateMeasures(4, 1, song.timeSignature || '4/4', [song.key || 'C']),
            lyrics: '',
          },
          {
            id: `sec-verse-${Date.now()}`,
            type: 'verse',
            label: 'Estrofa 1',
            repeatCount: 1,
            measures: generateMeasures(4, 5, song.timeSignature || '4/4', [song.key || 'C']),
            lyrics: '',
          },
        ]
      }
    }
    return rawList
  }, [song.sections, song.lyrics, song.content, song.timeSignature, song.key])

  const [sections, setSections] = useState<SectionMeasures[]>(initialSections)
  const [text, setText] = useState<string>(() => buildFullLyricsText(initialSections))
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read')
  const [editTab, setEditTab] = useState<'cards' | 'raw'>('cards')
  const effectiveViewMode = isAdmin ? viewMode : 'read'
  const [fontSize, setFontSize] = useState<number>(18) // px
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // BPM Rítmico Compartido (Single Source of Truth)
  const [tempo, setTempo] = useState<number>(song.tempo || 120)
  const [tempoInput, setTempoInput] = useState<string>(song.tempo?.toString() || '120')
  const [isSavingTempo, setIsSavingTempo] = useState(false)
  const [tempoSavedIndicator, setTempoSavedIndicator] = useState(false)
  const tempoDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (song?.tempo) {
      setTempo(song.tempo)
      setTempoInput(song.tempo.toString())
    }
  }, [song?.tempo])

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
  const toggleMetronome = useCallback(() => {
    setIsMetronomeActive((prev) => {
      const next = !prev
      isMetronomeActiveRef.current = next
      if (next) {
        getAudioContext()
      }
      return next
    })
  }, [getAudioContext])

  // Desplazamiento suave de una sección al área de lectura confortable
  const scrollToSection = useCallback((secIndex: number, resetToTop: boolean = false) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const sectionEl = document.getElementById(`lyrics-sec-${secIndex}`)
    if (!sectionEl) return

    const containerRect = container.getBoundingClientRect()
    const sectionRect = sectionEl.getBoundingClientRect()
    const relativeTop = sectionRect.top - containerRect.top + container.scrollTop

    const targetScrollTop = Math.max(0, relativeTop - 24)

    container.scrollTo({
      top: targetScrollTop,
      behavior: resetToTop ? 'auto' : 'smooth',
    })
  }, [])

  // Modificación y auto-sincronización de BPM en base de datos
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

  const handleCommitTempo = () => {
    let parsed = parseInt(tempoInput, 10)
    if (isNaN(parsed) || parsed < 30) {
      parsed = 30
    } else if (parsed > 300) {
      parsed = 300
    }
    setTempoInput(parsed.toString())
    if (parsed !== tempo) {
      handleTempoChange(parsed)
    }
  }

  const handleTempoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const handleTempoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      setTempoInput(value)
      const num = parseInt(value, 10)
      if (!isNaN(num) && num >= 30 && num <= 300) {
        handleTempoChange(num)
      }
    }
  }

  // 2. Cálculo unificado de secciones para teleprompter a partir del array sections (Single Source of Truth)
  // con soporte de tempo específico por sección (tempoOverride)
  const parsedSections = useMemo<ParsedLyricsSection[]>(() => {
    const beatsPerMeasure = getBeatsPerMeasure(song.timeSignature || '4/4')
    const globalBpm = Math.max(30, Math.min(300, tempo || 72))

    return sections.map((sec, idx) => {
      const repeats = sec.repeatCount && sec.repeatCount > 0 ? sec.repeatCount : 1
      const lines = sec.lyrics ? sec.lyrics.split('\n') : []
      const measuresCount = Array.isArray(sec.measures) && sec.measures.length > 0
        ? sec.measures.length
        : 4
      const sectionBpm = Math.max(30, Math.min(300, Number(sec.tempoOverride) || globalBpm))
      const pulseDurationMs = (60 / sectionBpm) * 1000
      const measureDurationMs = pulseDurationMs * beatsPerMeasure
      const singleLapDurationMs = measuresCount * measureDurationMs
      const totalDurationMs = singleLapDurationMs * repeats

      return {
        id: `lyrics-sec-${idx}`,
        rawHeader: `[${sec.label}${repeats > 1 ? ` ${repeats}x` : ''}]`,
        cleanName: sec.label,
        repeats,
        headerLineIndex: idx,
        lines,
        measuresCount,
        singleLapDurationMs,
        totalDurationMs,
        tempoOverride: sec.tempoOverride ?? null,
        effectiveBpm: sectionBpm,
        pulseDurationMs,
        measureDurationMs,
      }
    })
  }, [sections, tempo, song.timeSignature])

  // Ref a secciones para uso seguro en el loop de requestAnimationFrame
  const parsedSectionsRef = useRef(parsedSections)
  useEffect(() => {
    parsedSectionsRef.current = parsedSections
  }, [parsedSections])

  // Bucle de Teleprompter Inteligente con Sincronización Rítmica, Metrónomo y Repeticiones
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

      const sectionsList = parsedSectionsRef.current
      const curSecIdx = activeSectionIdxRef.current
      const curSection = sectionsList[curSecIdx]

      if (!curSection) {
        setIsAutoScrolling(false)
        return
      }

      lapElapsedRef.current += dt
      const lapDuration = curSection.singleLapDurationMs
      const progress = Math.min(1, Math.max(0, lapElapsedRef.current / lapDuration))
      setLapProgress(progress)

      const beatsPerMeasure = getBeatsPerMeasure(song.timeSignature || '4/4')
      const pulseDurationMs = curSection.pulseDurationMs
      const measureDurationMs = curSection.measureDurationMs

      const totalBeats = Math.floor(lapElapsedRef.current / pulseDurationMs)
      const beatInMeasure = (totalBeats % beatsPerMeasure) + 1
      const measureInSec = Math.min(
        curSection.measuresCount,
        Math.floor(lapElapsedRef.current / measureDurationMs) + 1
      )

      setCurrentBeat(beatInMeasure)
      setCurrentMeasure(measureInSec)

      if (totalBeats !== lastBeatRef.current) {
        lastBeatRef.current = totalBeats
        playMetronomePulse(beatInMeasure === 1)
      }

      // Desplazamiento progresivo continuo dentro de la sección según el tempo y altura de texto (Teleprompter Scroll)
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const sectionEl = document.getElementById(curSection.id)
        if (sectionEl) {
          const containerHeight = container.clientHeight
          const sectionTop = sectionEl.offsetTop
          const sectionHeight = sectionEl.offsetHeight
          if (sectionHeight > containerHeight * 0.45) {
            const maxScrollInSection = Math.max(0, sectionHeight - containerHeight * 0.4)
            const targetScroll = Math.max(0, sectionTop - 24) + (maxScrollInSection * progress)
            container.scrollTop = targetScroll
          }
        }
      }

      if (lapElapsedRef.current >= lapDuration) {
        if (currentRepeatRef.current < curSection.repeats) {
          currentRepeatRef.current += 1
          setCurrentRepeat(currentRepeatRef.current)
          lapElapsedRef.current = 0
          setLapProgress(0)
          lastBeatRef.current = -1
          scrollToSection(curSecIdx, false)
        } else {
          const nextSecIdx = curSecIdx + 1
          if (nextSecIdx < sectionsList.length) {
            activeSectionIdxRef.current = nextSecIdx
            setActiveSectionIdx(nextSecIdx)
            currentRepeatRef.current = 1
            setCurrentRepeat(1)
            lapElapsedRef.current = 0
            setLapProgress(0)
            lastBeatRef.current = -1
            scrollToSection(nextSecIdx, false)
          } else {
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
  const handleTogglePlay = useCallback(() => {
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
  }, [getAudioContext, scrollToSection])

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
  const handleSetSectionRepeat = (secIndex: number, newRepeats: number) => {
    setSections((prev) => {
      const updated = prev.map((s, idx) => (idx === secIndex ? { ...s, repeatCount: newRepeats } : s))
      setText(buildFullLyricsText(updated))
      return updated
    })
  }

  // Modificar tempo específico (BPM override) de una sección
  const handleSetSectionTempo = (secIndex: number, newTempo: number | null) => {
    setSections((prev) => {
      const updated = prev.map((s, idx) => (idx === secIndex ? { ...s, tempoOverride: newTempo } : s))
      return updated
    })
  }

  // Actualizar letra de una sección específica (Single Source of Truth)
  const handleUpdateSectionLyrics = (secIndex: number, newLyrics: string) => {
    setSections((prev) => {
      const updated = prev.map((s, idx) => (idx === secIndex ? { ...s, lyrics: newLyrics } : s))
      setText(buildFullLyricsText(updated))
      return updated
    })
  }

  // Manejar edición de texto plano continuo y sincronizar de vuelta a las secciones
  const handleRawTextChange = (newText: string) => {
    setText(newText)
    const blocks = parseLyricsBlocks(newText)
    if (blocks.length === 0) return

    setSections((prev) => {
      return prev.map((sec, idx) => {
        const match = blocks.find(
          (b) => b.cleanName.toLowerCase().trim() === sec.label.toLowerCase().trim()
        ) || blocks[idx]

        if (match) {
          return {
            ...sec,
            lyrics: match.lines.join('\n').trim(),
            repeatCount: match.repeats || sec.repeatCount || 1,
          }
        }
        return sec
      })
    })
  }

  // Insertar tag de estructura en la posición del cursor en modo edición cruda
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      handleRawTextChange(`${text}\n\n${tag}\n`)
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
    handleRawTextChange(updated)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + insertion.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  // Copiar letra limpia al portapapeles
  const handleCopyLyrics = async () => {
    try {
      const fullText = buildFullLyricsText(sections) || text
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      alert('No se pudo copiar al portapapeles.')
    }
  }

  // Exportar a archivo de texto plano (.txt)
  const handleExportTxt = () => {
    const filename = `${song.title} - ${song.artist || 'MusicChord'} (Letra).txt`
    const fullText = buildFullLyricsText(sections) || text
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Guardar estructura unificada en base de datos (secciones + letras + tempo)
  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const fullLyrics = buildFullLyricsText(sections)
      await updateSongAction(song.id, {
        sections: sections as any,
        lyrics: fullLyrics,
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

          {/* Enlace directo a la vista de Batería */}
          <Link href={`/dashboard/songs/drums/${song.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30">
              <span>🥁</span>
              <span>Ver Batería</span>
            </Button>
          </Link>

          {/* Toggle Modo Lectura / Edición (Solo Administrador) */}
          {isAdmin && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('read')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
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
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'edit'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Letra</span>
              </button>
            </div>
          )}

          {/* Guardar Letra y Estructura (Solo Administrador) */}
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
              onClick={() => {
                const current = parseInt(tempoInput, 10) || 120
                const next = Math.max(30, current - 1)
                setTempoInput(next.toString())
                handleTempoChange(next)
              }}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white text-xs transition-colors cursor-pointer"
              title="Reducir 1 BPM"
            >
              <Minus className="w-3 h-3" />
            </button>

            {/* Input numérico directo */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={tempoInput}
              onChange={handleTempoInputChange}
              onBlur={handleCommitTempo}
              onKeyDown={handleTempoKeyDown}
              className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs font-mono font-black text-center text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              title="Tempo de la canción en BPM (Sincronizado con Acordes)"
            />

            {/* Incremento rápido +1 */}
            <button
              type="button"
              onClick={() => {
                const current = parseInt(tempoInput, 10) || 120
                const next = Math.min(300, current + 1)
                setTempoInput(next.toString())
                handleTempoChange(next)
              }}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white text-xs transition-colors cursor-pointer"
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
                  onClick={() => {
                    setTempoInput(presetBpm.toString())
                    handleTempoChange(presetBpm)
                  }}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer',
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

            {/* Indicador de tempo específico de la sección activa durante la reproducción */}
            {isAutoScrolling && parsedSections[activeSectionIdx]?.tempoOverride && (
              <span
                className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black bg-amber-400 text-amber-950 shadow-sm border border-amber-300 animate-pulse shrink-0 ml-1.5"
                title={`Esta sección corre a ${parsedSections[activeSectionIdx].effectiveBpm} BPM (${getTempoDescriptor(parsedSections[activeSectionIdx].effectiveBpm)})`}
              >
                <span>⏱️</span>
                <span>{parsedSections[activeSectionIdx].effectiveBpm} BPM ({getTempoDescriptor(parsedSections[activeSectionIdx].effectiveBpm)})</span>
              </span>
            )}

            {/* Tap Tempo */}
            <div className="ml-1">
              <TapTempoButton
                onTempoChange={(bpm) => {
                  setTempoInput(bpm.toString())
                  handleTempoChange(bpm)
                }}
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
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold cursor-pointer"
              title="Reducir fuente"
            >
              A-
            </button>
            <span className="w-8 text-center font-mono font-bold text-xs">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.min(36, prev + 2))}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 font-bold cursor-pointer"
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

      {/* Sub-Navegación en Modo Edición */}
      {effectiveViewMode === 'edit' && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-wrap animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Modo de Edición:
            </span>
            <button
              type="button"
              onClick={() => setEditTab('cards')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                editTab === 'cards'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-purple-600'
              )}
            >
              📝 Por Secciones ({sections.length} partes)
            </button>
            <button
              type="button"
              onClick={() => {
                setText(buildFullLyricsText(sections))
                setEditTab('raw')
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                editTab === 'raw'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-purple-600'
              )}
            >
              📄 Texto Continuo
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Single Source of Truth: enlazado 1:1 con la estructura de Acordes
          </div>
        </div>
      )}

      {/* Barra de Tags Rápidos en Modo Edición Cruda */}
      {effectiveViewMode === 'edit' && editTab === 'raw' && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap animate-in fade-in">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Insertar Sección:
          </span>
          {STRUCTURE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleInsertTag(tag)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors shadow-sm cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Área Principal de Visualización / Edición */}
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
          editTab === 'cards' ? (
            /* Modo Edición A: Tarjetas estructuradas 1:1 con las secciones de la canción */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50 text-xs text-purple-800 dark:text-purple-300 flex items-center justify-between">
                <span>
                  💡 Cada sección editada aquí se guarda directamente en <code>section.lyrics</code> de la canción. Las secciones sin texto se consideran automáticamente instrumentales.
                </span>
              </div>

              {sections.map((sec, secIdx) => {
                const hasSecLyrics = !!(sec.lyrics && sec.lyrics.trim().length > 0)
                const secLinesCount = hasSecLyrics ? sec.lyrics!.trim().split('\n').filter(Boolean).length : 0

                return (
                  <div
                    key={sec.id || secIdx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs uppercase shrink-0">
                          {getSectionBadge(sec.type, sec.label)}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                            {sec.label}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            {sec.measures?.length || 4} compases • {sec.timeSignature || song.timeSignature || '4/4'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Control de tempo específico de la sección */}
                        <SectionTempoControl
                          sectionId={sec.id || `sec-${secIdx}`}
                          tempoOverride={sec.tempoOverride}
                          globalTempo={tempo}
                          isEditing={true}
                          onUpdateSectionTempo={(_secId, newTempo) => handleSetSectionTempo(secIdx, newTempo)}
                        />

                        {/* Selector de repeticiones de la sección */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                          <Repeat className="w-3 h-3 text-slate-400 mr-0.5" />
                          <span className="text-[11px] font-bold text-slate-500 mr-1">Repetir:</span>
                          {[1, 2, 4].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleSetSectionRepeat(secIdx, r)}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-black transition-colors cursor-pointer',
                                (sec.repeatCount || 1) === r
                                  ? 'bg-purple-600 text-white'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              )}
                            >
                              {r}x
                            </button>
                          ))}
                        </div>

                        {/* Indicador de estado */}
                        {hasSecLyrics ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            ✓ {secLinesCount} {secLinesCount === 1 ? 'verso' : 'versos'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                            🎵 Instrumental
                          </span>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={sec.lyrics || ''}
                      onChange={(e) => handleUpdateSectionLyrics(secIdx, e.target.value)}
                      placeholder={`Escribe o pega aquí los versos para "${sec.label}" (dejar vacío si es instrumental)...`}
                      rows={Math.max(3, Math.min(8, (sec.lyrics || '').split('\n').length + 1))}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-sans leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y transition-all"
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            /* Modo Edición B: Textarea Continuo */
            <div className="flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleRawTextChange(e.target.value)}
                style={{ fontSize: `${fontSize}px` }}
                rows={22}
                placeholder="Escribe o pega aquí la letra de la canción estructurada con [Sección]..."
                className="w-full bg-transparent border-0 focus:outline-none resize-none font-serif leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          )
        ) : (
          /* Modo Lectura / Escenario / Teleprompter Inteligente */
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="font-serif leading-loose tracking-wide select-text max-w-3xl mx-auto space-y-6"
          >
            {parsedSections.map((section, secIdx) => {
              const isActive = isAutoScrolling && activeSectionIdx === secIdx
              const nonBlankLines = section.lines.filter((l) => l.trim().length > 0)
              const isInstrumental = nonBlankLines.length === 0
              const totalMeasures = section.measuresCount * section.repeats

              let activeLineIndex = -1
              let activeWordIndex = -1

              if (isActive && !isInstrumental && nonBlankLines.length > 0) {
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

                    {/* Badge de Tempo Específico (BPM Override) */}
                    {section.tempoOverride && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-sans font-bold border shadow-2xs transition-colors',
                          isActive
                            ? 'bg-amber-400 text-amber-950 border-amber-300 font-extrabold shadow-sm'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        )}
                        title={`Tempo específico de esta sección: ${section.tempoOverride} BPM (${getTempoDescriptor(section.tempoOverride)}). Tempo global: ${tempo} BPM.`}
                      >
                        <span className="text-[11px]">⏱️</span>
                        <span>{section.tempoOverride} BPM ({getTempoDescriptor(section.tempoOverride)})</span>
                      </span>
                    )}

                    {/* Control Interactivo de Repetición (1x, 2x, 3x, 4x) */}
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
                          {[1, 2, 3, 4, 8].map((rep) => (
                            <button
                              key={rep}
                              type="button"
                              onClick={() => {
                                handleSetSectionRepeat(secIdx, rep)
                                setOpenRepeatDropdown(null)
                              }}
                              className={cn(
                                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer',
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

                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/40 dark:border-slate-700/60">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full transition-all duration-75"
                            style={{ width: `${Math.min(100, Math.max(0, lapProgress * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CASO A: Sección Instrumental (Intro, Interludios, Solos, Improvisación) */}
                  {isInstrumental ? (
                    isActive ? (
                      /* Tarjeta de Sección Instrumental Activa en Teleprompter */
                      <div className="rounded-xl border border-purple-300/60 dark:border-purple-700/60 bg-gradient-to-r from-purple-50/90 via-purple-100/40 to-purple-50/90 dark:from-purple-950/40 dark:via-purple-900/20 dark:to-purple-950/40 p-4 sm:p-5 my-2 shadow-xs transition-all animate-in fade-in select-none">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
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
                                Conduciendo compases instrumentales hacia la siguiente sección...
                              </p>
                            </div>
                          </div>

                          {/* Medidor visual de pulsos */}
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

                        {/* Barra de progreso */}
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
                      /* Sección Instrumental en Reposo (Single Source of Truth) */
                      <div className="py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Music className="w-3.5 h-3.5 text-purple-500" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            🎵 Sección Instrumental • {totalMeasures} compases
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewMode('edit')
                              setEditTab('cards')
                            }}
                            className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                          >
                            + Añadir letra
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    /* CASO B: Sección con Letra (Versos con Resaltador Karaoke) */
                    <div className="text-slate-800 dark:text-slate-100 select-text">
                      {section.lines.map((line, lIdx) => {
                        const trimmedLine = line.trim()
                        if (trimmedLine === '') {
                          return <div key={lIdx} className="h-3" />
                        }

                        const lineIndexInNonBlank = nonBlankCounter++

                        if (isActive) {
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

                          if (lineIndexInNonBlank < activeLineIndex) {
                            return (
                              <p
                                key={lIdx}
                                className="my-1 opacity-45 text-slate-500 dark:text-slate-400 transition-opacity duration-300"
                              >
                                {line}
                              </p>
                            )
                          }

                          return (
                            <p
                              key={lIdx}
                              className="my-1 text-slate-800 dark:text-slate-100 transition-colors"
                            >
                              {line}
                            </p>
                          )
                        }

                        return (
                          <p key={lIdx} className="my-0.5">
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

      {/* Footer Informativo */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2 flex-wrap gap-2">
        <span>
          {sections.length} secciones en total • {sections.filter(s => s.lyrics && s.lyrics.trim()).length} con lírica • {sections.filter(s => !s.lyrics || !s.lyrics.trim()).length} instrumentales
        </span>
        <div className="flex items-center gap-3">
          <span>Barra espaciadora: Play/Pause</span>
          <span>•</span>
          <span>Tecla M: Metrónomo</span>
        </div>
      </div>
    </div>
  )
}
