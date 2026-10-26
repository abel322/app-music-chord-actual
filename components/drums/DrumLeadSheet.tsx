'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Music,
  FileText,
  Usb,
  Save,
  Check,
  CircleDot,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadSheetToolbar } from '@/components/chords/LeadSheetToolbar'
import { SectionQuickNav } from '@/components/chords/SectionQuickNav'
import { DrumScoreRenderer } from '@/components/drums/DrumScoreRenderer'
import { MidiCalibratorModal } from '@/components/drums/MidiCalibratorModal'
import { DrumGrooveRecorderModal } from '@/components/drums/DrumGrooveRecorderModal'
import { useLeadSheetPlayback } from '@/lib/hooks/useLeadSheetPlayback'
import { useWebMidi } from '@/hooks/useWebMidi'
import { drumSynth } from '@/lib/audio/drumSynth'
import { updateSongAction } from '@/app/actions/songs'
import { useAuth } from '@/lib/context/auth-context'
import { SectionMeasures, Measure } from '@/types/measure'
import { DrumGrooveData, DRUM_PRESETS } from '@/types/drum'
import {
  ensureSectionMeasures,
  generateMeasures,
  syncSectionsWithLyrics,
  scrollToActiveMeasure,
} from '@/lib/measure-utils'
import { cn } from '@/lib/utils'

interface DrumLeadSheetProps {
  song: {
    id: string
    title: string
    artist?: string | null
    key?: string | null
    timeSignature?: string | null
    tempo?: number | null
    youtubeUrl?: string | null
    sections?: any
    lyrics?: string | null
    content?: string | null
  }
}

export function DrumLeadSheet({ song }: DrumLeadSheetProps) {
  const { isAdmin } = useAuth()
  const { isConnected, deviceName } = useWebMidi()

  // Tempo y compás de la canción
  const [tempo, setTempo] = useState<number>(song.tempo || 120)
  const [timeSignature, setTimeSignature] = useState<string>(song.timeSignature || '4/4')

  // Modales
  const [isCalibratorOpen, setIsCalibratorOpen] = useState<boolean>(false)
  const [recorderSectionId, setRecorderSectionId] = useState<string | null>(null)

  // Estado de guardado
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Estado de sonido de batería durante la reproducción en vivo
  const [playDrumAudio, setPlayDrumAudio] = useState(true)

  // Normalizar secciones con grooves de batería predeterminados si no tienen
  const [sections, setSections] = useState<SectionMeasures[]>(() => {
    const rawSections = Array.isArray(song.sections) ? song.sections : []
    const counter = { current: 1 }

    let baseSections = rawSections
    if (baseSections.length === 0) {
      baseSections = [
        {
          id: `sec-intro-${Date.now()}`,
          type: 'intro',
          label: 'Intro',
          timeSignature: song.timeSignature || '4/4',
          instruments: ['Batería'],
          measures: generateMeasures(4, 1, song.timeSignature || '4/4', [song.key || 'C']),
        },
        {
          id: `sec-verse-${Date.now()}`,
          type: 'verse',
          label: 'Estrofa 1',
          timeSignature: song.timeSignature || '4/4',
          instruments: ['Batería'],
          measures: generateMeasures(4, 5, song.timeSignature || '4/4', [song.key || 'C']),
        },
        {
          id: `sec-chorus-${Date.now()}`,
          type: 'chorus',
          label: 'Coro',
          timeSignature: song.timeSignature || '4/4',
          instruments: ['Batería'],
          measures: generateMeasures(4, 9, song.timeSignature || '4/4', [song.key || 'C']),
        },
      ]
    }

    const normalized = baseSections.map((sec: any, idx: number) => {
      const s = ensureSectionMeasures(sec, idx, song.timeSignature || '4/4', counter)

      // Asignar groove por defecto si la sección no tiene uno guardado
      if (!s.drumGroove) {
        if (s.type === 'chorus') {
          s.drumGroove = {
            barsCount: DRUM_PRESETS[1].barsCount,
            quantizeGrid: DRUM_PRESETS[1].quantizeGrid,
            hits: DRUM_PRESETS[1].hits,
            presetId: DRUM_PRESETS[1].id,
            presetName: DRUM_PRESETS[1].name,
          }
        } else {
          s.drumGroove = {
            barsCount: DRUM_PRESETS[0].barsCount,
            quantizeGrid: DRUM_PRESETS[0].quantizeGrid,
            hits: DRUM_PRESETS[0].hits,
            presetId: DRUM_PRESETS[0].id,
            presetName: DRUM_PRESETS[0].name,
          }
        }
      }

      return s
    })

    return syncSectionsWithLyrics(normalized, song.lyrics || song.content)
  })

  // Hook de Reproducción y Seguimiento Temporal de Compases en Vivo
  const userScrollPausedUntilRef = useRef<number>(0)

  const {
    isPlaying,
    currentMeasure,
    currentBeat,
    isMuted,
    totalMeasuresCount,
    nextSectionName,
    togglePlay,
    stop,
    toggleMute,
    jumpToMeasureId,
  } = useLeadSheetPlayback({
    sections,
    tempo,
    defaultTimeSignature: timeSignature,
    onMeasureChange: (_flatIndex, measure, _sectionId) => {
      // Auto-desplazamiento centrado con margen de anticipación (look-ahead)
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (Date.now() < userScrollPausedUntilRef.current) {
            return
          }
          scrollToActiveMeasure(measure.id, 64)
        }, 50)
      })
    },
  })

  // Reproducir golpes de batería sintetizados sincronizados con el pulso activo
  useEffect(() => {
    if (!isPlaying || !playDrumAudio || isMuted || !currentMeasure) return

    // Encontrar la sección a la que pertenece el compás actual
    const currentSection = sections.find((s) => s.id === currentMeasure.sectionId)
    const groove = currentSection?.drumGroove
    if (!groove || !groove.hits || groove.hits.length === 0) return

    // Calcular el rango de pasos de este pulso (en 16 semicorcheas, cada negra tiene 4 pasos)
    const beatIndex = currentBeat - 1 // 0, 1, 2, 3
    const isSecondBar = groove.barsCount === 2 && currentMeasure.measure.measureNumber % 2 === 0
    const barOffset = isSecondBar ? 16 : 0
    const startStep = barOffset + beatIndex * 4

    // Disparar los golpes que caen en el pulso a tierra
    const stepHits = groove.hits.filter((h) => h.step === startStep)
    stepHits.forEach((hit) => {
      drumSynth.playHit(hit.pad, hit.velocity)
    })
  }, [isPlaying, currentBeat, currentMeasure, playDrumAudio, isMuted, sections])

  // Detección de intervención manual del usuario para no forzar scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        userScrollPausedUntilRef.current = Date.now() + 3000
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
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

  // Guardar un groove editado en una sección
  const handleSaveGrooveForSection = (sectionId: string, groove: DrumGrooveData) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            drumGroove: groove,
          }
        }
        return sec
      })
    )
  }

  // Guardar todas las secciones con sus grooves en la base de datos
  const handleSaveAll = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await updateSongAction(song.id, {
        tempo,
        timeSignature,
        sections: sections as any,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error al guardar datos de batería:', err)
      alert('Hubo un error al guardar los grooves de batería.')
    } finally {
      setIsSaving(false)
    }
  }

  // Sección activa en el grabador de groove
  const activeRecorderSection = sections.find((s) => s.id === recorderSectionId)

  return (
    <div className="w-full max-w-full min-h-screen space-y-6 max-w-7xl mx-auto pb-80 md:pb-96">
      {/* Barra Superior de Control y Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/songs/chords">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Volver</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{song.title}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <span>🥁</span>
                <span>Partitura de Batería</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500">{song.artist || 'Artista no especificado'}</p>
          </div>
        </div>

        {/* Grupo de Acciones Principales y Enlaces Cruzados */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Calibrador MIDI Donner (Solo Administrador) */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCalibratorOpen(true)}
              className={cn(
                'gap-1.5 text-xs font-bold transition-all shadow-xs',
                isConnected
                  ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              )}
              title="Calibrar pads y probar conexión USB de la batería Donner"
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                )}
              />
              <Usb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isConnected ? `Donner (${deviceName?.slice(0, 8) || 'OK'})` : 'Calibrar Donner'}
              </span>
              <span className="sm:hidden">Donner</span>
            </Button>
          )}

          {/* Enlace cruzado a la vista de Acordes */}
          <Link href={`/dashboard/songs/chords/${song.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Ver Acordes</span>
            </Button>
          </Link>

          {/* Enlace cruzado a la vista de Letras */}
          <Link href={`/dashboard/songs/lyrics/${song.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Letras</span>
            </Button>
          </Link>

          {/* Guardar Cambios (Solo Administrador) */}
          {isAdmin && (
            <Button
              variant="gradient"
              size="sm"
              onClick={handleSaveAll}
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
                  <span>{isSaving ? 'Guardando...' : 'Guardar Batería'}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Transporte Sticky Permanente (Top-0 Z-50 / Siempre Accesible) */}
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
        onUpdateTempo={(newTempo) => setTempo(newTempo)}
      />

      {/* Barra de Navegación Rápida de Secciones (100% Estática en el cuerpo) */}
      <SectionQuickNav
        sections={sections}
        activeSectionId={currentMeasure?.sectionId}
        scrollToSection={(sectionId) => {
          const el = document.getElementById(`drum-section-${sectionId}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      />

      {/* Lista de Secciones y Pentagramas de Batería Compás por Compás */}
      <div className="space-y-6">
        {sections.map((section, sIdx) => {
          const isSectionActive = currentMeasure?.sectionId === section.id
          const groove = section.drumGroove
          const hitsCount = groove?.hits?.length || 0

          return (
            <div
              key={section.id}
              id={`drum-section-${section.id}`}
              className={cn(
                'rounded-3xl border transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5 space-y-4',
                isSectionActive
                  ? 'border-purple-500/80 ring-2 ring-purple-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              )}
            >
              {/* Cabecera de la Sección de Batería */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                    {section.label}
                  </span>

                  {section.repeatCount && section.repeatCount > 1 ? (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {section.repeatCount} Vueltas
                    </span>
                  ) : null}

                  {/* Badge del Ritmo Asignado */}
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{groove?.presetName || 'Groove Personalizado'}</span>
                    <span className="text-[10px] text-slate-400">({hitsCount} notas)</span>
                  </span>
                </div>

                {/* Botón para Editar o Grabar Groove con Donner (Solo Administrador) */}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRecorderSectionId(section.id)}
                    className="gap-1.5 text-xs font-bold border-purple-300 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  >
                    <CircleDot className="w-3.5 h-3.5 text-rose-500" />
                    <span>Editar / Grabar con Donner</span>
                  </Button>
                )}
              </div>

              {/* Cuadrícula de Compases con Pentagrama SVG */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {section.measures.map((measure, mIdx) => {
                  const isMeasureActive =
                    isPlaying && currentMeasure?.measure.id === measure.id

                  return (
                    <div
                      key={measure.id}
                      id={`measure-${measure.id}`}
                      data-measure-id={measure.id}
                    >
                      <DrumScoreRenderer
                        measureNumber={measure.measureNumber}
                        groove={groove}
                        timeSignature={measure.timeSignature || section.timeSignature || timeSignature}
                        isActive={isMeasureActive}
                        currentBeat={currentBeat}
                        showClef={mIdx === 0}
                        onMeasureClick={() => jumpToMeasureId(measure.id)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Calibrador y Monitor Donner USB (Solo Administrador) */}
      {isAdmin && isCalibratorOpen && (
        <MidiCalibratorModal
          isOpen={isCalibratorOpen}
          onClose={() => setIsCalibratorOpen(false)}
        />
      )}

      {/* Modal Grabador de Groove Cuantizado por Sección (Solo Administrador) */}
      {isAdmin && activeRecorderSection && (
        <DrumGrooveRecorderModal
          isOpen={Boolean(recorderSectionId)}
          onClose={() => setRecorderSectionId(null)}
          sectionLabel={activeRecorderSection.label}
          sectionType={activeRecorderSection.type}
          tempo={activeRecorderSection.tempoOverride || tempo}
          timeSignature={activeRecorderSection.timeSignature || timeSignature}
          initialGroove={activeRecorderSection.drumGroove}
          onSaveGroove={(groove) => handleSaveGrooveForSection(activeRecorderSection.id, groove)}
        />
      )}
    </div>
  )
}
