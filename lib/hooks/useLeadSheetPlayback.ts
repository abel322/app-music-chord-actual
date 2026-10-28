'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { SectionMeasures, Measure } from '@/types/measure'
import { getBeatsPerMeasure } from '@/lib/measure-utils'
import { getAudioContext, playTickSound } from '@/lib/hooks/useMetronomeAudio'

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
  bpm: number
  tempoOverride?: number | null
  iteration: number
  repeatCount: number
  totalMeasuresInSection: number
  nextSectionLabel?: string | null
}

export interface UseLeadSheetPlaybackOptions {
  sections: SectionMeasures[]
  tempo: number // BPM
  defaultTimeSignature?: string
  initialHasCountIn?: boolean
  onMeasureChange?: (flatIndex: number, measure: Measure, sectionId: string) => void
  onSongEnd?: () => void
}

export interface UseLeadSheetPlaybackReturn {
  isPlaying: boolean
  hasCountIn: boolean
  countInBeat: number | null
  setHasCountIn: (value: boolean | ((prev: boolean) => boolean)) => void
  toggleCountIn: () => void
  currentFlatMeasureIndex: number
  currentMeasure: FlattenedMeasure | null
  currentBeat: number
  currentBpm: number
  isMuted: boolean
  flatMeasures: FlattenedMeasure[]
  totalMeasuresCount: number
  totalDurationMs: number
  totalDurationFormatted: string
  nextSectionName: string | null
  isLastRepeat: boolean
  isLastMeasureOfSection: boolean
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
  initialHasCountIn = true,
  onMeasureChange,
  onSongEnd,
}: UseLeadSheetPlaybackOptions): UseLeadSheetPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasCountIn, setHasCountInState] = useState(initialHasCountIn)
  const [countInBeat, setCountInBeat] = useState<number | null>(null)
  const [currentFlatMeasureIndex, setCurrentFlatMeasureIndex] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Referencias para bucle de alta precisión sin desfases de React
  const isPlayingRef = useRef(false)
  const hasCountInRef = useRef(initialHasCountIn)
  const countInBeatRef = useRef<number | null>(null)
  const isCountingInRef = useRef(false)
  const countInStartTimeRef = useRef(0)

  const currentIndexRef = useRef(0)
  const currentBeatRef = useRef(1)
  const isMutedRef = useRef(false)
  const measureStartTimeRef = useRef(0)
  const pausedElapsedRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const onMeasureChangeRef = useRef(onMeasureChange)
  const onSongEndRef = useRef(onSongEnd)

  const setHasCountIn = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setHasCountInState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      hasCountInRef.current = next
      return next
    })
  }, [])

  const toggleCountIn = useCallback(() => {
    setHasCountIn((prev) => !prev)
  }, [setHasCountIn])

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

  // Aplanar la lista de compases en orden cronológico lineal respetando repeticiones de sección (2x, 3x, 4x...)
  // y tempos específicos (tempoOverride) por sección con sincronización rítmica en milisegundos
  const flatMeasures = useMemo<FlattenedMeasure[]>(() => {
    const list: FlattenedMeasure[] = []
    let globalIndex = 0

    const validGlobalBpm = Math.max(30, Math.min(300, Number(tempo) || 72))

    sections.forEach((section, sIdx) => {
      // Tempo efectivo: si la sección tiene tempoOverride asignado, utilizarlo; si no, heredar tempo global
      const sectionBpm = Math.max(30, Math.min(300, Number(section.tempoOverride) || validGlobalBpm))
      const pulseDurationMs = (60 / sectionBpm) * 1000
      const sectionTimeSig = section.timeSignature || defaultTimeSignature || '4/4'
      const repeats = Math.max(1, Math.min(64, Number(section.repeatCount) || 1))
      const measuresCount = section.measures.length
      const nextSection = sections[sIdx + 1]
      const nextSectionName = nextSection ? nextSection.label : null

      for (let iteration = 1; iteration <= repeats; iteration++) {
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
            bpm: sectionBpm,
            tempoOverride: section.tempoOverride ?? null,
            iteration,
            repeatCount: repeats,
            totalMeasuresInSection: measuresCount,
            nextSectionLabel: nextSectionName,
          })
        })
      }
    })

    return list
  }, [sections, tempo, defaultTimeSignature])

  const totalDurationMs = useMemo(() => {
    return flatMeasures.reduce((acc, m) => acc + m.durationMs, 0)
  }, [flatMeasures])

  const totalDurationFormatted = useMemo(() => {
    const totalSeconds = Math.round(totalDurationMs / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [totalDurationMs])

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

  // Detener la reproducción
  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    isPlayingRef.current = false
    setIsPlaying(false)
    isCountingInRef.current = false
    countInBeatRef.current = null
    setCountInBeat(null)
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

    // Si pausó durante la cuenta previa, cancelar la cuenta previa para arrancar limpio
    if (isCountingInRef.current) {
      isCountingInRef.current = false
      countInBeatRef.current = null
      setCountInBeat(null)
      pausedElapsedRef.current = 0
    } else if (measureStartTimeRef.current > 0) {
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

      const curBpm = curMeasure.bpm || Math.max(30, Math.min(300, Number(tempo) || 72))
      const pulseDurationMs = (60 / curBpm) * 1000

      // ==========================================
      // FASE 1: CUENTA PREVIA (COUNT-IN DE 4 BEATS)
      // ==========================================
      if (isCountingInRef.current) {
        const elapsedCountIn = now - countInStartTimeRef.current
        const beatIndex = Math.min(
          4,
          Math.max(1, Math.floor(elapsedCountIn / pulseDurationMs) + 1)
        )

        // Si cambió el pulso dentro de la cuenta previa (1, 2, 3, 4)
        if (beatIndex !== countInBeatRef.current && beatIndex <= 4) {
          countInBeatRef.current = beatIndex
          setCountInBeat(beatIndex)
          if (!isMutedRef.current) {
            const ctx = getAudioContext()
            if (ctx) {
              // Pulsos 1 y 4 acentuados (1600 Hz), 2 y 3 normales (1000 Hz)
              const isAccent = beatIndex === 1 || beatIndex === 4
              playTickSound(ctx, ctx.currentTime, isAccent)
            }
          }
        }

        // Al cumplirse el 4to pulso (duración de 4 pulsos exacta)
        if (elapsedCountIn >= pulseDurationMs * 4) {
          // Pasa inmediatamente y sin desfasaje al Compás 1 (Tiempo 1)
          isCountingInRef.current = false
          countInBeatRef.current = null
          setCountInBeat(null)

          // Cero desfase acumulado: sincronizar exactamente al término del 4to pulso
          measureStartTimeRef.current = countInStartTimeRef.current + (pulseDurationMs * 4)
          currentBeatRef.current = 1
          setCurrentBeat(1)

          if (!isMutedRef.current) {
            const ctx = getAudioContext()
            if (ctx) {
              playTickSound(ctx, ctx.currentTime, true) // Acento compás 1 tiempo 1
            }
          }

          onMeasureChangeRef.current?.(curIdx, curMeasure.measure, curMeasure.sectionId)
        }

        rafIdRef.current = requestAnimationFrame(loop)
        return
      }

      // ==========================================
      // FASE 2: REPRODUCCIÓN NORMAL DE COMPASES
      // ==========================================
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
          const ctx = getAudioContext()
          if (ctx) {
            playTickSound(ctx, ctx.currentTime, beatIndex === 1)
          }
        }
      }

      // Si el compás actual ha terminado su duración
      if (elapsedInMeasure >= curMeasure.durationMs) {
        const nextIdx = curIdx + 1

        if (nextIdx < measures.length) {
          // Traspasar inmediatamente al compás de la sección siguiente
          // Mantener la fase de tiempo exacta para evitar desfase acumulado
          measureStartTimeRef.current += curMeasure.durationMs
          currentIndexRef.current = nextIdx
          setCurrentFlatMeasureIndex(nextIdx)
          currentBeatRef.current = 1
          setCurrentBeat(1)

          if (!isMutedRef.current) {
            const ctx = getAudioContext()
            if (ctx) {
              playTickSound(ctx, ctx.currentTime, true)
            }
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
  }, [tempo, stop])

  // Iniciar la reproducción con cero latencia y soporte de cuenta previa
  const play = useCallback(() => {
    if (flatMeasuresRef.current.length === 0) return

    const ctx = getAudioContext()
    isPlayingRef.current = true
    setIsPlaying(true)

    const now = performance.now()
    const measures = flatMeasuresRef.current
    const curIdx = currentIndexRef.current
    const curMeasure = measures[curIdx] || measures[0]
    const curBpm = curMeasure ? curMeasure.bpm : Math.max(30, Math.min(300, Number(tempo) || 72))

    // Si cuenta previa está activada y arrancamos compás desde cero (no reanudación a mitad de pulso)
    if (hasCountInRef.current && pausedElapsedRef.current === 0) {
      isCountingInRef.current = true
      countInStartTimeRef.current = now
      countInBeatRef.current = 1
      setCountInBeat(1)

      // Cero latencia: el pulso 1 de la cuenta previa suena inmediatamente al tocar la pantalla
      if (!isMutedRef.current && ctx) {
        playTickSound(ctx, ctx.currentTime, true) // Acento pulso 1 (1600 Hz)
      }

      startLoop()
      return
    }

    // Si cuenta previa está desactivada o estamos reanudando desde una pausa:
    isCountingInRef.current = false
    countInBeatRef.current = null
    setCountInBeat(null)

    measureStartTimeRef.current = now - pausedElapsedRef.current
    pausedElapsedRef.current = 0

    if (curMeasure) {
      const elapsed = now - measureStartTimeRef.current
      const pulseDuration = curMeasure.durationMs / curMeasure.beatsCount
      const beatIndex = Math.min(
        curMeasure.beatsCount,
        Math.max(1, Math.floor(elapsed / pulseDuration) + 1)
      )
      currentBeatRef.current = beatIndex
      setCurrentBeat(beatIndex)
      if (!isMutedRef.current && ctx) {
        playTickSound(ctx, ctx.currentTime, beatIndex === 1)
      }
      onMeasureChangeRef.current?.(currentIndexRef.current, curMeasure.measure, curMeasure.sectionId)
    }

    startLoop()
  }, [tempo, startLoop])

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

      if (isCountingInRef.current) {
        isCountingInRef.current = false
        countInBeatRef.current = null
        setCountInBeat(null)
      }

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
          const ctx = getAudioContext()
          if (ctx) {
            playTickSound(ctx, ctx.currentTime, true)
          }
        }
        startLoop()
      }
    },
    [startLoop]
  )

  // Saltar a un compás específico por su measure.id respetando sección actual
  const jumpToMeasureId = useCallback(
    (measureId: string) => {
      const cur = flatMeasuresRef.current[currentIndexRef.current]
      let index = -1
      if (cur) {
        index = flatMeasuresRef.current.findIndex(
          (m) => m.measure.id === measureId && m.iteration === cur.iteration && m.sectionId === cur.sectionId
        )
      }
      if (index === -1) {
        index = flatMeasuresRef.current.findIndex((m) => m.measure.id === measureId)
      }
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
    }
  }, [])

  const currentMeasure = flatMeasures[currentFlatMeasureIndex] || null
  const currentBpm = currentMeasure ? currentMeasure.bpm : Math.max(30, Math.min(300, Number(tempo) || 72))

  const isLastRepeat = Boolean(
    isPlaying &&
    currentMeasure &&
    currentMeasure.repeatCount > 1 &&
    currentMeasure.iteration === currentMeasure.repeatCount
  )

  const isLastMeasureOfSection = Boolean(
    currentMeasure &&
    currentMeasure.measureIndexInSection === currentMeasure.totalMeasuresInSection - 1
  )

  return {
    isPlaying,
    hasCountIn,
    countInBeat,
    setHasCountIn,
    toggleCountIn,
    currentFlatMeasureIndex,
    currentMeasure,
    currentBeat,
    currentBpm,
    isMuted,
    flatMeasures,
    totalMeasuresCount: flatMeasures.length,
    totalDurationMs,
    totalDurationFormatted,
    nextSectionName: currentMeasure?.nextSectionLabel || null,
    isLastRepeat,
    isLastMeasureOfSection,
    play,
    pause,
    togglePlay,
    stop,
    toggleMute,
    jumpToFlatIndex,
    jumpToMeasureId,
  }
}
