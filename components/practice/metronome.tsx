'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Square, Plus, Minus, Volume2, VolumeX, RefreshCw, Music } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Types for metronome configuration
type SubdivType = 1 | 'off-beat' | 2 | 3 | 4 | 6
type SoundProfile = 'woodblock' | 'sine' | 'cowbell'

const NUMERATORS = [2, 3, 4, 5, 6, 7, 9, 12]
const DENOMINATORS = [4, 8, 16]

export function Metronome() {
  const [mounted, setMounted] = useState(false)

  // Metronome State
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [bpmInput, setBpmInput] = useState('120')
  const [numerator, setNumerator] = useState(4)
  const [denominator, setDenominator] = useState(4)
  const [subdivision, setSubdivision] = useState<SubdivType>(1)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [soundProfile, setSoundProfile] = useState<SoundProfile>('woodblock')

  // Real-time synchronization state for UI
  const [activeBeat, setActiveBeat] = useState(-1) // 0 to numerator - 1
  const [activeSubdivision, setActiveSubdivision] = useState(-1) // 0 to subdivision - 1
  const [flashActive, setFlashActive] = useState(false)
  const [isAccentFlash, setIsAccentFlash] = useState(false)
  const [pendulumSide, setPendulumSide] = useState<'left' | 'right'>('left')
  
  // Tap tempo state
  const [tapTimes, setTapTimes] = useState<number[]>([])

  // Web Audio & Scheduler Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerIdRef = useRef<NodeJS.Timeout | null>(null)
  const nextStepTimeRef = useRef<number>(0)
  const currentStepRef = useRef<number>(0)
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  // Refs to maintain real-time values in audio loop without re-triggering effects
  const bpmRef = useRef(bpm)
  const numeratorRef = useRef(numerator)
  const subdivisionRef = useRef(subdivision)
  const volumeRef = useRef(volume)
  const isMutedRef = useRef(isMuted)
  const soundProfileRef = useRef(soundProfile)

  // Track previous settings for dynamic on-the-fly tempo changes
  const prevBpmRef = useRef(bpm)
  const prevSubdivisionRef = useRef<SubdivType>(subdivision)
  const lastStepTimeRef = useRef(0)

  // Update refs when state changes
  useEffect(() => { bpmRef.current = bpm; setBpmInput(bpm.toString()) }, [bpm])
  useEffect(() => { numeratorRef.current = numerator }, [numerator])
  useEffect(() => { subdivisionRef.current = subdivision }, [subdivision])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])
  useEffect(() => { soundProfileRef.current = soundProfile }, [soundProfile])

  // Synchronize on-the-fly BPM or Subdivision changes immediately
  useEffect(() => {
    const ctx = audioContextRef.current
    if (isPlaying && ctx) {
      const currentTicks = subdivision === 'off-beat' ? 2 : subdivision
      const newStepDuration = 60.0 / (bpm * currentTicks)
      
      const elapsed = ctx.currentTime - lastStepTimeRef.current
      const prevTicks = prevSubdivisionRef.current === 'off-beat' ? 2 : prevSubdivisionRef.current
      const prevStepDuration = 60.0 / (prevBpmRef.current * prevTicks)
      
      let fraction = elapsed / prevStepDuration
      if (isNaN(fraction) || fraction < 0) fraction = 0
      if (fraction > 0.95) fraction = 0.95 // avoid scheduling in the past
      
      const remaining = newStepDuration * (1 - fraction)
      nextStepTimeRef.current = ctx.currentTime + Math.max(0.01, remaining)
    }
    
    prevBpmRef.current = bpm
    prevSubdivisionRef.current = subdivision
  }, [bpm, subdivision, isPlaying])

  // Mount check
  useEffect(() => {
    setMounted(true)
    return () => {
      // Clean up on unmount
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current)
      }
      timeoutsRef.current.forEach((id) => clearTimeout(id))
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Lazy initialize AudioContext
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }

  // Audio synthesis helper with strict frequency and volume hierarchy
  const playClick = (time: number, isAccent: boolean, isSub: boolean) => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Calculate specific volumes based on beat priority
    const masterVol = isMutedRef.current ? 0 : volumeRef.current
    let toneVolume = masterVol
    let frequency = 800
    let decayTime = 0.06

    if (isAccent) {
      // Accent (Beat 1): High and clear tone
      frequency = 1000
      toneVolume = masterVol * 1.0
      decayTime = 0.08
    } else if (!isSub) {
      // Normal Beats: Medium tone
      frequency = 800
      toneVolume = masterVol * 0.75
      decayTime = 0.06
    } else {
      // Subdivision Beats / Off-beat / Sextuplets: Low click
      frequency = 600
      toneVolume = masterVol * 0.4
      decayTime = 0.04
    }

    // Apply different audio styles
    if (soundProfileRef.current === 'woodblock') {
      osc.type = 'triangle' // Warmer triangle wave for woodblock character
      
      // Fast pitch slide (pop transient) to emulate a wooden click
      osc.frequency.setValueAtTime(frequency * 1.6, time)
      osc.frequency.exponentialRampToValueAtTime(frequency, time + 0.004)
      
      // Crisp envelope with immediate attack
      gainNode.gain.setValueAtTime(0.001, time)
      gainNode.gain.linearRampToValueAtTime(toneVolume, time + 0.002)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime)
    } else if (soundProfileRef.current === 'sine') {
      osc.type = 'sine' // Clean electronic sine wave beep
      osc.frequency.setValueAtTime(frequency, time)
      
      gainNode.gain.setValueAtTime(0.001, time)
      gainNode.gain.linearRampToValueAtTime(toneVolume, time + 0.002)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime)
    } else {
      // Cowbell simulation using a square wave with mixed high metallic ring
      osc.type = 'square' 
      osc.frequency.setValueAtTime(frequency, time)
      
      gainNode.gain.setValueAtTime(0.001, time)
      gainNode.gain.linearRampToValueAtTime(toneVolume, time + 0.002)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime)

      const oscRing = ctx.createOscillator()
      const gainRing = ctx.createGain()
      oscRing.type = 'sine'
      oscRing.frequency.setValueAtTime(frequency * 1.48, time)
      
      gainRing.gain.setValueAtTime(0.001, time)
      gainRing.gain.linearRampToValueAtTime(toneVolume * 0.3, time + 0.002)
      gainRing.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.8)
      
      oscRing.connect(gainRing)
      gainRing.connect(ctx.destination)
      oscRing.start(time)
      oscRing.stop(time + decayTime)
      oscRing.onended = () => {
        oscRing.disconnect()
        gainRing.disconnect()
      }
    }

    osc.start(time)
    osc.stop(time + decayTime)

    // Clean up oscillator and gain nodes
    osc.onended = () => {
      osc.disconnect()
      gainNode.disconnect()
    }
  }

  // Web Audio precise scheduler loop with look-ahead
  const scheduler = () => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const scheduleAheadTime = 0.15 // lookahead window (seconds)
    const lookahead = 25.0 // polling frequency (ms)

    while (nextStepTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const step = currentStepRef.current
      const currentSub = subdivisionRef.current
      const currentNum = numeratorRef.current
      
      const ticksPerBeat = currentSub === 'off-beat' ? 2 : currentSub

      // Calculate indexes
      const beatInMeasure = Math.floor(step / ticksPerBeat) % currentNum
      const subIndex = step % ticksPerBeat
      
      // Contratiempo (off-beat) only plays on subIndex === 1 (the 'and')
      const shouldPlay = currentSub !== 'off-beat' || subIndex === 1
      
      if (shouldPlay) {
        const isAccent = beatInMeasure === 0 && subIndex === 0
        const isSub = subIndex > 0 || currentSub === 'off-beat'
        playClick(nextStepTimeRef.current, isAccent, isSub)
      }

      // Save last scheduled time for on-the-fly tempo change reference
      lastStepTimeRef.current = nextStepTimeRef.current

      // Sync UI flash on the thread with setTimeout
      const delayMs = (nextStepTimeRef.current - ctx.currentTime) * 1000
      
      const stepDurationMs = (60.0 / (bpmRef.current * ticksPerBeat)) * 1000
      const flashDuration = Math.min(80, stepDurationMs * 0.4)
      
      const tickRate = bpmRef.current * ticksPerBeat
      const swingOnSubdivision = tickRate <= 240

      const timeoutId = setTimeout(() => {
        setActiveBeat(beatInMeasure)
        setActiveSubdivision(subIndex)
        setIsAccentFlash(beatInMeasure === 0 && subIndex === 0)
        setFlashActive(true)

        // Toggle pendulum side
        if (swingOnSubdivision) {
          setPendulumSide((prev) => (prev === 'left' ? 'right' : 'left'))
        } else if (subIndex === 0) {
          setPendulumSide((prev) => (prev === 'left' ? 'right' : 'left'))
        }

        const flashTimeout = setTimeout(() => {
          setFlashActive(false)
          timeoutsRef.current.delete(flashTimeout)
        }, flashDuration)
        timeoutsRef.current.add(flashTimeout)
        
        timeoutsRef.current.delete(timeoutId)
      }, Math.max(0, delayMs))

      timeoutsRef.current.add(timeoutId)

      // Advance scheduler pointers
      const stepDuration = 60.0 / (bpmRef.current * ticksPerBeat)
      nextStepTimeRef.current += stepDuration
      currentStepRef.current++
    }

    // Queue next tick
    timerIdRef.current = setTimeout(scheduler, lookahead)
  }

  // Play / Stop Controls
  const togglePlay = () => {
    if (isPlaying) {
      // Stop metronome and clear all scheduled tasks
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current)
        timerIdRef.current = null
      }
      timeoutsRef.current.forEach((id) => clearTimeout(id))
      timeoutsRef.current.clear()

      // Close AudioContext to instantly cut pending audio buffers
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      setIsPlaying(false)
      setActiveBeat(-1)
      setActiveSubdivision(-1)
      setFlashActive(false)
    } else {
      // Start metronome
      const ctx = initAudioContext()
      
      // Reset pointers
      nextStepTimeRef.current = ctx.currentTime + 0.05
      lastStepTimeRef.current = ctx.currentTime
      currentStepRef.current = 0
      setIsPlaying(true)
      
      // Run scheduler
      scheduler()
    }
  }

  // Tap Tempo calculation
  const handleTap = () => {
    const now = performance.now()
    const cutoff = now - 2000 // Reset if no taps within 2 seconds
    
    // Filter old taps
    const currentTaps = tapTimes.filter(t => t > cutoff)
    const newTaps = [...currentTaps, now]
    setTapTimes(newTaps)

    if (newTaps.length >= 2) {
      // Calculate intervals
      const intervals = []
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1])
      }
      
      // Average interval
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      const calculatedBpm = Math.round(60000 / avgInterval)
      
      // Clamp between 10 and 280 BPM
      const clampedBpm = Math.max(10, Math.min(280, calculatedBpm))
      setBpm(clampedBpm)
    }
  }

  // Quick adjustment helper
  const adjustBpm = (amount: number) => {
    setBpm((prev) => Math.max(10, Math.min(280, prev + amount)))
  }

  const ticksCount = subdivision === 'off-beat' ? 2 : subdivision
  const currentTickRate = bpm * ticksCount
  const swingDuration = (currentTickRate <= 240) ? 60 / currentTickRate : 60 / bpm

  if (!mounted) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-md animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-6 mx-auto" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-full w-24 mx-auto mb-8" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative subtle top radial gradient */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Pendulum Indicator (Feedback Visual) */}
      <div className="w-full h-12 bg-gray-100/60 dark:bg-gray-950/50 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-center relative overflow-hidden mb-8">
        {/* Track Line */}
        <div className="absolute w-[80%] h-0.5 bg-gray-200 dark:bg-gray-800" />
        
        {/* Moving Orb */}
        <motion.div
          className={cn(
            "w-5 h-5 rounded-full absolute z-10 transition-colors duration-200",
            isPlaying 
              ? isAccentFlash && flashActive
                ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                : flashActive
                  ? "bg-primary-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                  : "bg-primary-600 shadow-[0_0_8px_rgba(124,58,237,0.4)]"
              : "bg-gray-400 dark:bg-gray-600"
          )}
          animate={{
            x: isPlaying ? (pendulumSide === 'left' ? '-160px' : '160px') : '0px'
          }}
          transition={{
            duration: isPlaying ? swingDuration : 0.5,
            ease: "easeInOut"
          }}
        />

        {/* Center line mark */}
        <div className="absolute w-0.5 h-3 bg-gray-300 dark:bg-gray-750" />
      </div>

      {/* 2. BPM Controls (Tempo Display & Adjustments) */}
      <div className="flex flex-col items-center justify-center mb-8 relative">
        {/* Outer Circular Ring showing BPM ratio */}
        <div className="relative w-44 h-44 rounded-full flex items-center justify-center border-4 border-gray-200/60 dark:border-gray-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] bg-white dark:bg-gray-950 transition-all duration-300">
          
          {/* Animated Glow Ring on Beats */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-100 pointer-events-none border-4 opacity-0 scale-100",
              flashActive && isAccentFlash && "border-emerald-500 opacity-90 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]",
              flashActive && !isAccentFlash && "border-primary-500 opacity-70 scale-103 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            )}
          />

          <div className="text-center select-none flex flex-col items-center justify-center">
            {/* Interactive numeric input for keyboard control */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={bpmInput}
              onChange={(e) => {
                const valStr = e.target.value.replace(/\D/g, '')
                setBpmInput(valStr)
                const val = parseInt(valStr)
                if (!isNaN(val) && val >= 10 && val <= 280) {
                  setBpm(val)
                }
              }}
              onBlur={() => {
                const val = parseInt(bpmInput)
                if (isNaN(val) || val < 10) {
                  setBpm(10)
                  setBpmInput('10')
                } else if (val > 280) {
                  setBpm(280)
                  setBpmInput('280')
                } else {
                  setBpm(val)
                  setBpmInput(val.toString())
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              className="w-28 text-5xl font-black text-center tracking-tight text-gray-900 dark:text-white font-mono bg-transparent border-b-2 border-transparent hover:border-gray-250 dark:hover:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-0 py-0"
              title="Haz clic para escribir el BPM"
            />
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">BPM</p>
          </div>
        </div>

        {/* Fine Adjustment Buttons under BPM */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={() => adjustBpm(-5)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold hover:bg-gray-55 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all text-gray-600 dark:text-gray-300"
            title="Restar 5 BPM"
          >
            -5
          </button>
          <button
            onClick={() => adjustBpm(-1)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-55 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all text-gray-600 dark:text-gray-300"
            title="Restar 1 BPM"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={handleTap}
            className="px-5 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 font-semibold text-sm flex items-center gap-1.5 hover:bg-primary-100 dark:hover:bg-primary-900/30 active:scale-95 transition-all select-none shadow-sm shadow-primary-500/5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tap Tempo</span>
          </button>

          <button
            onClick={() => adjustBpm(1)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-55 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all text-gray-600 dark:text-gray-300"
            title="Sumar 1 BPM"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => adjustBpm(5)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold hover:bg-gray-55 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all text-gray-600 dark:text-gray-300"
            title="Sumar 5 BPM"
          >
            +5
          </button>
        </div>

        {/* BPM Slider */}
        <div className="w-full mt-6 px-4">
          <input
            type="range"
            min="10"
            max="280"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500 focus:outline-none"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1 select-none font-medium">
            <span>10 Largo</span>
            <span>120 Moderato</span>
            <span>280 Prestissimo</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Beat Grid (Numerator & Subdivisions display) */}
      <div className="mb-8 select-none">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 text-center">
          Estructura del Compás ({numerator}/{denominator})
        </p>
        
        {/* Main Beat Circles */}
        <div className="flex justify-center gap-3 flex-wrap">
          {Array.from({ length: numerator }).map((_, beatIdx) => {
            const isCurrent = activeBeat === beatIdx
            const isFirstBeat = beatIdx === 0
            
            return (
              <div 
                key={beatIdx} 
                className="flex flex-col items-center gap-1.5"
              >
                {/* Main Beat Node */}
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-105",
                    isFirstBeat
                      ? isCurrent && flashActive
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)] scale-110"
                        : "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-500"
                      : isCurrent && flashActive
                        ? "bg-primary-500 border-primary-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.6)] scale-108"
                        : "bg-gray-55 dark:bg-gray-800/40 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  )}
                  animate={{
                    scale: isCurrent && flashActive ? 1.1 : 1.0
                  }}
                  transition={{ duration: 0.05 }}
                >
                  {beatIdx + 1}
                </motion.div>

                {/* Subdivisions Indicators under the main beat node */}
                {ticksCount > 1 && (
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: ticksCount }).map((_, subIdx) => {
                      const isSubActive = isCurrent && activeSubdivision === subIdx && flashActive
                      const isFirstSub = subIdx === 0
                      
                      return (
                        <div
                          key={subIdx}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-100",
                            isSubActive
                              ? isFirstBeat && isFirstSub
                                ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)] scale-125"
                                : "bg-primary-500 shadow-[0_0_4px_rgba(139,92,246,0.6)] scale-125"
                              : subdivision === 'off-beat' && subIdx === 0
                                ? "bg-transparent border border-dashed border-gray-400 dark:border-gray-600"
                                : "bg-gray-300 dark:bg-gray-750"
                          )}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-855 my-6" />

      {/* 4. Controls Panel (Selectors & Sound profiles) */}
      <div className="space-y-5">
        
        {/* Numerator & Denominator selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Compás (Numerador)
            </label>
            <select
              value={numerator}
              onChange={(e) => {
                setNumerator(parseInt(e.target.value))
              }}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold cursor-pointer text-gray-700 dark:text-gray-300"
            >
              {NUMERATORS.map((num) => (
                <option key={num} value={num}>
                  {num} tiempos
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Unidad (Denominador)
            </label>
            <select
              value={denominator}
              onChange={(e) => {
                setDenominator(parseInt(e.target.value))
              }}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold cursor-pointer text-gray-700 dark:text-gray-300"
            >
              {DENOMINATORS.map((den) => (
                <option key={den} value={den}>
                  /{den}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subdivision Selectors */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Subdivisiones
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(
              [
                { label: 'Negras (1x)', value: 1 },
                { label: 'Off-beat', value: 'off-beat' },
                { label: 'Corcheas (2x)', value: 2 },
                { label: 'Tresillos (3x)', value: 3 },
                { label: 'Semicorch. (4x)', value: 4 },
                { label: 'Seisillos (6x)', value: 6 },
              ] as const
            ).map((subOption) => (
              <button
                key={subOption.value}
                onClick={() => setSubdivision(subOption.value)}
                className={cn(
                  "py-2 px-1 rounded-xl text-xs font-semibold border transition-all duration-200 active:scale-95",
                  subdivision === subOption.value
                    ? "bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-500/20"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-gray-700"
                )}
              >
                {subOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Selection & Volume Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Sounds */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Tipo de Sonido
            </label>
            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-950 p-1 border border-gray-200/50 dark:border-gray-800/50">
              {(
                [
                  { id: 'woodblock', label: 'Madera' },
                  { id: 'sine', label: 'Digital' },
                  { id: 'cowbell', label: 'Campana' },
                ] as const
              ).map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => setSoundProfile(sound.id)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    soundProfile === sound.id
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  )}
                >
                  {sound.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume control */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Volumen
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value))
                  if (isMuted) setIsMuted(false)
                }}
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 5. Start / Stop Play Button (Floating Footer style) */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={togglePlay}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2 select-none z-10",
            isPlaying
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 focus:ring-red-300 dark:focus:ring-offset-gray-900"
              : "bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-primary-600/30 focus:ring-primary-300 dark:focus:ring-offset-gray-900"
          )}
        >
          {isPlaying ? (
            <Square className="w-8 h-8 fill-white stroke-none" />
          ) : (
            <Play className="w-8 h-8 fill-white stroke-none ml-1" />
          )}
        </button>
      </div>

      {/* Premium Metronome Footer Label */}
      <div className="mt-6 text-center select-none">
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-semibold px-3 py-1 rounded-full bg-gray-100/40 dark:bg-gray-850/30 border border-gray-200/30 dark:border-gray-855/40">
          <Music className="w-3 h-3 text-primary-500" />
          <span>Advanced Audio Engine</span>
        </div>
      </div>
    </div>
  )
}
