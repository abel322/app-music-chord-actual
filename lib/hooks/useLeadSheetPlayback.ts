'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { SectionMeasures, Measure } from '@/types/measure'
import { getBeatsPerMeasure } from '@/lib/measure-utils'

export interface FlattenedMeasure {
  measure: Measure
  sectionId: string
  sectionLabel: string
  flatIndex: number
  measureIndexInSection: number
  timeSignature: string
  beatsCount: number
  pulseDurationMs: number
  durationMs: number
}

export interface UseLeadSheetPlaybackOptions {
  sections: SectionMeasures[]
  tempo: number // BPM
  defaultTimeSignature?: string
  onMeasureChange?: (flatIndex: number, measure: Measure, sectionId: string) => void
  onSongEnd?: () => void
}

export interface UseLeadSheetPlaybackReturn {
  isPlaying: boolean
  currentFlatMeasureIndex: number
  currentMeasure: FlattenedMeasure | null
  currentBeat: number
  isMuted: boolean
  flatMeasures: FlattenedMeasure[]
  totalMeasuresCount: number
  play: () => void
  pause: () => void
  togglePlay: () => void
  stop: () => void
  toggleMute: () => void
  jumpToFlatIndex: (index: number) => void
  jumpToMeasureId: (measureId: string) => void
}

export function useLeadSheetPlayback({
  sections,
  tempo,
  defaultTimeSignature = '4/4',
  onMeasureChange,
  onSongEnd,
}: UseLeadSheetPlaybackOptions): UseLeadSheetPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFlatMeasureIndex, setCurrentFlatMeasureIndex] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Web Audio Context para metrónomo sintetizado
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Referencias para el bucle de alta precisión sin desfases de React
  const isPlayingRef = useRef(false)
  const currentIndexRef = useRef(0)
  const currentBeatRef = useRef(1)
  const isMutedRef = useRef(false)
  const measureStartTimeRef = useRef(0)
  const pausedElapsedRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const onMeasureChangeRef = useRef(onMeasureChange)
  const onSongEndRef = useRef(onSongEnd)

  // Mantener actualizadas las referencias de callbacks
  useEffect(() => {
    onMeasureChangeRef.current = onMeasureChange
  }, [onMeasureChange])

  useEffect(() => {
    onSongEndRef.current = onSongEnd
  }, [onSongEnd])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  // Aplanar la lista de compases en orden cronológico lineal
  const flatMeasures = useMemo<FlattenedMeasure[]>(() => {
    const list: FlattenedMeasure[] = []
    let globalIndex = 0

    const validBpm = Math.max(30, Math.min(300, Number(tempo) || 72))
    const pulseDurationMs = (60 / validBpm) * 1000

    sections.forEach((section) => {
      const sectionTimeSig = section.timeSignature || defaultTimeSignature || '4/4'
      section.measures.forEach((measure, mIdx) => {
        const effectiveTimeSig = measure.timeSignature || sectionTimeSig
        const beatsCount = getBeatsPerMeasure(effectiveTimeSig)
        const durationMs = pulseDurationMs * beatsCount

        list.push({
          measure,
          sectionId: section.id,
          sectionLabel: section.label,
          flatIndex: globalIndex++,
          measureIndexInSection: mIdx,
          timeSignature: effectiveTimeSig,
          beatsCount,
          pulseDurationMs,
          durationMs,
        })
      })
    })

    return list
  }, [sections, tempo, defaultTimeSignature])

  const flatMeasuresRef = useRef(flatMeasures)
  useEffect(() => {
    flatMeasuresRef.current = flatMeasures
    // Asegurar que el índice esté dentro del rango si cambian las secciones
    if (currentIndexRef.current >= flatMeasures.length && flatMeasures.length > 0) {
      const newIdx = flatMeasures.length - 1
      currentIndexRef.current = newIdx
      setCurrentFlatMeasureIndex(newIdx)
    }
  }, [flatMeasures])

  // Inicializar o reanudar AudioContext con manejo seguro de políticas de navegador
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

  // Reproducir clic sutil de metrónomo sintético con Web Audio API
  // Pulso 1: beep agudo (1200 Hz). Pulsos 2, 3, 4: beep más grave (600 Hz)
  const playMetronomeClick = useCallback((isFirstBeat: boolean) => {
    const ctx = getAudioContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      // Frecuencias musicales calibradas para que no sean molestas pero sí claras al tocar
      osc.frequency.setValueAtTime(isFirstBeat ? 1200 : 600, now)

      // Envolvente percusiva rápida para evitar clics o pops armónicos
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(isFirstBeat ? 0.35 : 0.22, now + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isFirstBeat ? 0.06 : 0.045))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.07)
    } catch {
      // Silencioso si el audio falla
    }
  }, [getAudioContext])

  // Detener la reproducción
  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    isPlayingRef.current = false
    setIsPlaying(false)
    currentIndexRef.current = 0
    setCurrentFlatMeasureIndex(0)
    currentBeatRef.current = 1
    setCurrentBeat(1)
    pausedElapsedRef.current = 0

    // Notificar al oyente para que reajuste la vista si es necesario
    const firstMeasure = flatMeasuresRef.current[0]
    if (firstMeasure) {
      onMeasureChangeRef.current?.(0, firstMeasure.measure, firstMeasure.sectionId)
    }
  }, [])

  // Pausar
  const pause = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    isPlayingRef.current = false
    setIsPlaying(false)

    // Guardar el tiempo transcurrido en el compás actual
    if (measureStartTimeRef.current > 0) {
      pausedElapsedRef.current = Math.max(0, performance.now() - measureStartTimeRef.current)
    }
  }, [])

  // Bucle de sincronización temporal con requestAnimationFrame
  const startLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    const loop = () => {
      if (!isPlayingRef.current) return

      const now = performance.now()
      const measures = flatMeasuresRef.current
      const curIdx = currentIndexRef.current
      const curMeasure = measures[curIdx]

      if (!curMeasure) {
        stop()
        onSongEndRef.current?.()
        return
      }

      const elapsedInMeasure = now - measureStartTimeRef.current
      const pulseDuration = curMeasure.durationMs / curMeasure.beatsCount
      const beatIndex = Math.min(
        curMeasure.beatsCount,
        Math.max(1, Math.floor(elapsedInMeasure / pulseDuration) + 1)
      )

      // Si cambió el pulso dentro del compás
      if (beatIndex !== currentBeatRef.current) {
        currentBeatRef.current = beatIndex
        setCurrentBeat(beatIndex)
        if (!isMutedRef.current) {
          playMetronomeClick(beatIndex === 1)
        }
      }

      // Si el compás actual ha terminado su duración
      if (elapsedInMeasure >= curMeasure.durationMs) {
        const nextIdx = curIdx + 1

        if (nextIdx < measures.length) {
          // Traspasar inmediatamente al compás 1 de la sección siguiente
          // Mantener la fase de tiempo para evitar desfase acumulado
          measureStartTimeRef.current += curMeasure.durationMs
          currentIndexRef.current = nextIdx
          setCurrentFlatMeasureIndex(nextIdx)
          currentBeatRef.current = 1
          setCurrentBeat(1)

          if (!isMutedRef.current) {
            playMetronomeClick(true)
          }

          const nextMeasure = measures[nextIdx]
          onMeasureChangeRef.current?.(nextIdx, nextMeasure.measure, nextMeasure.sectionId)
        } else {
          // Al terminar la canción, detenerse y volver al inicio
          stop()
          onSongEndRef.current?.()
          return
        }
      }

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }, [playMetronomeClick, stop])

  // Iniciar la reproducción
  const play = useCallback(() => {
    if (flatMeasuresRef.current.length === 0) return

    getAudioContext() // Desbloquear audio context
    isPlayingRef.current = true
    setIsPlaying(true)

    const now = performance.now()
    // Reanudar desde el punto pausado o empezar compás de cero
    measureStartTimeRef.current = now - pausedElapsedRef.current
    pausedElapsedRef.current = 0

    // Si estábamos al inicio del compás o reiniciando, sonar pulso 1
    const curMeasure = flatMeasuresRef.current[currentIndexRef.current]
    if (curMeasure) {
      const elapsed = now - measureStartTimeRef.current
      const pulseDuration = curMeasure.durationMs / curMeasure.beatsCount
      const beatIndex = Math.min(
        curMeasure.beatsCount,
        Math.max(1, Math.floor(elapsed / pulseDuration) + 1)
      )
      currentBeatRef.current = beatIndex
      setCurrentBeat(beatIndex)
      if (!isMutedRef.current) {
        playMetronomeClick(beatIndex === 1)
      }
      onMeasureChangeRef.current?.(currentIndexRef.current, curMeasure.measure, curMeasure.sectionId)
    }

    startLoop()
  }, [getAudioContext, playMetronomeClick, startLoop])

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause()
    } else {
      play()
    }
  }, [pause, play])

  // Toggle Mute del metrónomo
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  // Saltar a un compás específico por índice plano
  const jumpToFlatIndex = useCallback(
    (index: number) => {
      const measures = flatMeasuresRef.current
      if (index < 0 || index >= measures.length) return

      currentIndexRef.current = index
      setCurrentFlatMeasureIndex(index)
      currentBeatRef.current = 1
      setCurrentBeat(1)
      pausedElapsedRef.current = 0
      measureStartTimeRef.current = performance.now()

      const targetMeasure = measures[index]
      if (targetMeasure) {
        onMeasureChangeRef.current?.(index, targetMeasure.measure, targetMeasure.sectionId)
      }

      if (isPlayingRef.current) {
        if (!isMutedRef.current) {
          playMetronomeClick(true)
        }
        startLoop()
      }
    },
    [playMetronomeClick, startLoop]
  )

  // Saltar a un compás específico por su measure.id
  const jumpToMeasureId = useCallback(
    (measureId: string) => {
      const index = flatMeasuresRef.current.findIndex((m) => m.measure.id === measureId)
      if (index !== -1) {
        jumpToFlatIndex(index)
      }
    },
    [jumpToFlatIndex]
  )

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  const currentMeasure = flatMeasures[currentFlatMeasureIndex] || null

  return {
    isPlaying,
    currentFlatMeasureIndex,
    currentMeasure,
    currentBeat,
    isMuted,
    flatMeasures,
    totalMeasuresCount: flatMeasures.length,
    play,
    pause,
    togglePlay,
    stop,
    toggleMute,
    jumpToFlatIndex,
    jumpToMeasureId,
  }
}
