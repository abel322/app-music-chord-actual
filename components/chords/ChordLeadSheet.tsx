'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
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
import { LeadSheetPlaybackControls } from '@/components/chords/LeadSheetPlaybackControls'
import { LeadSheetToolbar, StickyPlaybackTransport } from '@/components/chords/LeadSheetToolbar'
import { SectionCard } from '@/components/chords/SectionCard'
import { YouTubeLinkModal } from '@/components/songs/YouTubeLinkModal'
import { useLeadSheetPlayback } from '@/lib/hooks/useLeadSheetPlayback'
import { SectionMeasures, Measure } from '@/types/measure'

import { 
  ensureSectionMeasures, 
  transposeSectionMeasures, 
  transposeSingleSectionMeasures,
  generateMeasures,
  applyProgressionToMeasures,
  applyCadenceToSectionMeasures,
  getSectionBadge,
  getSectionDefaultName,
  cloneSectionMeasures,
  getSectionChordsPreview,
  buildFullLyricsText,
  syncSectionsWithLyrics,
  scrollToActiveMeasure
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

  // Salto rápido a sección con descolapso automático y desplazamiento suave
  const handleSelectSectionJump = (sectionId: string) => {
    if (collapsedSections[sectionId]) {
      setCollapsedSections((prev) => ({ ...prev, [sectionId]: false }))
    }
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 60)
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

  // Pausar temporalmente el auto-scroll si el usuario interviene manualmente (wheel/touch)
  const userScrollPausedUntilRef = useRef<number>(0)
  const touchStartYRef = useRef<number>(0)

  // Hook de Reproducción y Seguimiento Temporal de Compases en Vivo
  const {
    isPlaying,
    currentFlatMeasureIndex,
    currentMeasure,
    currentBeat,
    isMuted,
    totalMeasuresCount,
    totalDurationFormatted,
    nextSectionName,
    togglePlay,
    stop,
    toggleMute,
    jumpToMeasureId,
  } = useLeadSheetPlayback({
    sections,
    tempo,
    defaultTimeSignature: timeSignature,
    onMeasureChange: (_flatIndex, measure, sectionId) => {
      // Si una sección está colapsada y la reproducción entra en ella, expandir automáticamente
      setCollapsedSections((prev) => {
        if (prev[sectionId]) {
          return { ...prev, [sectionId]: false }
        }
        return prev
      })

      // Auto-desplazamiento inteligente centrado con margen de anticipación visual (look-ahead):
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Si el usuario scrolleó manualmente hacia arriba recientemente, respetar su vista por 3 segundos
          if (Date.now() < userScrollPausedUntilRef.current) {
            return
          }

          scrollToActiveMeasure(measure.id, 64)
        }, 50)
      })
    },
  })

  // Detección de intervención manual del usuario para no forzar scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        userScrollPausedUntilRef.current = Date.now() + 3000
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY
        if (currentY - touchStartYRef.current > 15) {
          userScrollPausedUntilRef.current = Date.now() + 3000
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // Atajo de Teclado Global: Barra Espaciadora para Play / Pause
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

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay])

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
    <div className="w-full max-w-full min-h-screen space-y-6 max-w-7xl mx-auto pb-80 md:pb-96">
      {/* Barra Superior de Control y Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/songs/chords">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Volver a Acordes</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{song.title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                Lead Sheet (Compases)
              </span>
            </h1>
            <p className="text-xs text-slate-500">{song.artist || 'Artista no especificado'}</p>
          </div>
        </div>

        {/* Grupo de Acciones Principales */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Enlace directo a la vista de Letras */}
          <Link href={`/dashboard/songs/lyrics/${song.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60">
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Letras</span>
            </Button>
          </Link>

          {/* Botón Enlace de YouTube */}
          {isAdmin ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsYouTubeModalOpen(true)}
              className={cn(
                'gap-1.5 text-xs font-bold transition-all shadow-xs',
                youtubeUrl
                  ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                  : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-red-600 dark:hover:text-red-400'
              )}
              title={youtubeUrl ? 'Ver o editar enlace de YouTube vinculado' : 'Vincular enlace de video de YouTube'}
            >
              <Youtube className={cn('w-3.5 h-3.5 text-red-600 dark:text-red-500', youtubeUrl && 'fill-current')} />
              <span>{youtubeUrl ? 'YouTube' : 'Enlace YouTube'}</span>
            </Button>
          ) : youtubeUrl ? (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors shadow-xs"
              title="Abrir video de referencia en YouTube"
            >
              <Youtube className="w-3.5 h-3.5 fill-current" />
              <span>Ver en YouTube</span>
            </a>
          ) : null}

          {/* Toggle Modo Edición (Solo Administrador) */}
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

          {/* Guardar Cambios (Solo Administrador) */}
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

      {/* Cabecera Estática de Configuración Musical (Hace scroll normal, no fija) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Tonalidad con Badge Destacado */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tono:
            </span>
            <div className="px-3 py-1 rounded-xl bg-primary-600 font-mono text-base font-extrabold text-white shadow-md shadow-primary-900/40">
              {currentKey}
            </div>
          </div>

          {/* Botones de Transposición Rápida */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => handleTranspose(-1)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-2xs"
              title="Bajar 1 semitono (♭)"
            >
              ♭ -1
            </button>
            <button
              type="button"
              onClick={() => handleTranspose(1)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-2xs"
              title="Subir 1 semitono (#)"
            >
              ♯ +1
            </button>
            {transposeSemitones !== 0 && (
              <button
                type="button"
                onClick={handleResetTranspose}
                className="px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                title="Restablecer tono original"
              >
                Reset ({transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones})
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Compás (Métrica) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Compás:
            </span>
            {effectiveIsEditing ? (
              <select
                value={timeSignature}
                onChange={(e) => handleTimeSignatureChange(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="2/4">2/4</option>
                <option value="6/8">6/8</option>
                <option value="12/8">12/8</option>
              </select>
            ) : (
              <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {timeSignature}
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Tempo BPM Inicial + Tap */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tempo:</span>
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(tempoInput, 10) || 120
                  const next = Math.max(30, current - 1)
                  setTempoInput(next.toString())
                  if (onUpdateTempo) onUpdateTempo(next)
                }}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Reducir 1 BPM"
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
                className="w-12 text-center text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded py-0.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                title="Ajustar tempo en BPM (30 - 300)"
              />
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(tempoInput, 10) || 120
                  const next = Math.min(300, current + 1)
                  setTempoInput(next.toString())
                  if (onUpdateTempo) onUpdateTempo(next)
                }}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Aumentar 1 BPM"
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
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Metadatos de Vista y Duración */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="hidden lg:inline">Formato:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            4 Compases / Línea
          </span>
          {totalDurationFormatted && (
            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300">
              ⏱ {totalDurationFormatted} ({totalMeasuresCount} compases)
            </span>
          )}
        </div>
      </div>

      {/* Barra de Transporte Sticky Permanente (Single-Row / Siempre Accesible) */}
      <LeadSheetToolbar
        isPlaying={isPlaying}
        togglePlayPause={togglePlay}
        handleRestart={stop}
        activeMeasureNumber={currentMeasure?.measure.measureNumber || 1}
        activeSectionName={currentMeasure?.sectionLabel || 'Intro'}
        totalRepeats={currentMeasure?.repeatCount || 1}
        currentRepeat={currentMeasure?.iteration || 1}
        isMetronomeOn={!isMuted}
        toggleMetronome={toggleMute}
        effectiveTempo={tempo}
        onUpdateTempo={(newTempo) => {
          setTempoInput(newTempo.toString())
          if (onUpdateTempo) onUpdateTempo(newTempo)
        }}
      />

      {/* Barra de Navegación Rápida de Secciones */}
      <SectionQuickNav
        sections={sections}
        collapsedSections={collapsedSections}
        onToggleCollapseAll={handleToggleCollapseAll}
        onSelectSection={handleSelectSectionJump}
        activeSectionId={currentMeasure?.sectionId}
      />

      {/* Lista de Secciones con sus Compases */}
      <div className="space-y-4 pt-1 pb-80 md:pb-96">
        {sections.map((section, sIdx) => {
          const isSectionActive =
            currentMeasure?.sectionId === section.id ||
            section.measures.some((m) => m.id === currentMeasure?.measure.id)
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
              isPlaying={isPlaying}
              activeMeasureId={currentMeasure?.measure.id || null}
              measureDurationMs={currentMeasure?.durationMs}
              currentRepeat={isSectionActive ? currentMeasure?.iteration || 1 : 1}
              totalRepeats={section.repeatCount || 1}
              nextSectionName={nextSecName}
              isSectionActive={isSectionActive}
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
            onMeasureClick={(clickedMeasure) => {
              jumpToMeasureId(clickedMeasure.id)
            }}
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
