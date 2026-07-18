'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Square, Plus, Minus, Volume2, VolumeX, RefreshCw, Music, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Types for metronome configuration
type SubdivType = 1 | 'off-beat' | 2 | 3 | 4 | 6
type SoundProfile = 'woodblock' | 'sine' | 'cowbell'

const NUMERATORS = [2, 3, 4, 5, 6, 7, 9, 12]
const DENOMINATORS = [4, 8, 16]

// ----------------------------------------------------------------------
// 1. UI Subcomponents
// ----------------------------------------------------------------------

function MetronomeCounter({ 
  totalClicks, 
  totalMeasures, 
  onReset 
}: { 
  totalClicks: number
  totalMeasures: number
  onReset: () => void 
}) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 mb-8 shadow-sm">
      <div className="flex gap-8 items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Clicks Totales</span>
          <span className="text-3xl font-black text-gray-800 dark:text-gray-200 font-mono tracking-tighter leading-none">{totalClicks}</span>
        </div>
        <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Compases</span>
          <span className="text-3xl font-black text-primary-600 dark:text-primary-400 font-mono tracking-tighter leading-none">{totalMeasures}</span>
        </div>
      </div>
      <button
        onClick={onReset}
        className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-500 hover:border-primary-200 dark:hover:border-primary-800 transition-all active:scale-95 shadow-sm"
        title="Resetear contadores (sin detener audio)"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  )
}

function PolyrhythmControls({
  isActive,
  rhythmA,
  rhythmB,
  onToggle,
  onChangeB
}: {
  isActive: boolean
  rhythmA: number
  rhythmB: number
  onToggle: () => void
  onChangeB: (val: number) => void
}) {
  return (
    <div className="mb-6 bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={onToggle}>
          Modo Polirritmia
        </label>
        <button
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
            isActive ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
              isActive ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
      
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-primary-100 dark:border-primary-900/50 shadow-sm">
              <div className="flex-1 text-center">
                <span className="block text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase mb-1">Ritmo A (Base)</span>
                <div className="text-2xl font-black text-gray-800 dark:text-gray-200">{rhythmA}</div>
              </div>
              <div className="text-gray-400 font-bold italic text-sm">contra</div>
              <div className="flex-1 text-center">
                <span className="block text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-1">Ritmo B (Sec.)</span>
                <select
                  value={rhythmB}
                  onChange={(e) => onChangeB(parseInt(e.target.value))}
                  className="w-full bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black cursor-pointer text-indigo-600 dark:text-indigo-400 text-center text-2xl"
                >
                  {[2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. Main Metronome Component
// ----------------------------------------------------------------------

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

  // Polyrhythm State
  const [isPolyrhythmActive, setIsPolyrhythmActive] = useState(false)
  const [rhythmB, setRhythmB] = useState(3)

  // Counter State
  const [totalClicks, setTotalClicks] = useState(0)
  const [totalMeasures, setTotalMeasures] = useState(0)

  // Real-time synchronization state for UI
  const [activeBeat, setActiveBeat] = useState(-1) // 0 to numerator - 1
  const [activeSubdivision, setActiveSubdivision] = useState(-1) // 0 to subdivision - 1
  const [flashActive, setFlashActive] = useState(false)
  const [isAccentFlash, setIsAccentFlash] = useState(false)
  const [flashBActive, setFlashBActive] = useState(false) // For Polyrhythm B flash
  const [pendulumSide, setPendulumSide] = useState<'left' | 'right'>('left')
  
  // Tap tempo state
  const [tapTimes, setTapTimes] = useState<number[]>([])

  // Web Audio & Scheduler Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerIdRef = useRef<NodeJS.Timeout | null>(null)
  
  // Pointers for Primary Rhythm
  const nextStepTimeRef = useRef<number>(0)
  const currentStepRef = useRef<number>(0)
  
  // Pointers for Rhythm B (Polyrhythm)
  const nextStepTimeBRef = useRef<number>(0)
  const currentStepBRef = useRef<number>(0)
  
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  // Refs to maintain real-time values in audio loop without re-triggering effects
  const bpmRef = useRef(bpm)
  const numeratorRef = useRef(numerator)
  const subdivisionRef = useRef(subdivision)
  const volumeRef = useRef(volume)
  const isMutedRef = useRef(isMuted)
  const soundProfileRef = useRef(soundProfile)
  
  const isPolyrhythmActiveRef = useRef(isPolyrhythmActive)
  const rhythmBRef = useRef(rhythmB)

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
  useEffect(() => { isPolyrhythmActiveRef.current = isPolyrhythmActive }, [isPolyrhythmActive])
  useEffect(() => { rhythmBRef.current = rhythmB }, [rhythmB])

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
      const oldNextStepTime = nextStepTimeRef.current
      nextStepTimeRef.current = ctx.currentTime + Math.max(0.01, remaining)

      // Adjust Rhythm B pointer by the same amount to keep them in sync locally
      if (isPolyrhythmActive) {
        const diff = nextStepTimeRef.current - oldNextStepTime
        nextStepTimeBRef.current += diff
      }
    }
    
    prevBpmRef.current = bpm
    prevSubdivisionRef.current = subdivision
  }, [bpm, subdivision, isPlaying, numerator, isPolyrhythmActive, rhythmB])

  // Mount check
  useEffect(() => {
    setMounted(true)
    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current)
      timeoutsRef.current.forEach((id) => clearTimeout(id))
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

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

  // Audio synthesis helper for primary rhythm
  const playClick = (time: number, isAccent: boolean, isSub: boolean) => {
    const ctx = audioContextRef.current
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    const masterVol = isMutedRef.current ? 0 : volumeRef.current
    let toneVolume = masterVol
    let frequency = 800
    let decayTime = 0.06

    if (isAccent) {
      frequency = 1000
      toneVolume = masterVol * 1.0
      decayTime = 0.08
    } else if (!isSub) {
      frequency = 800
      toneVolume = masterVol * 0.75
      decayTime = 0.06
    } else {
      frequency = 600
      toneVolume = masterVol * 0.4
      decayTime = 0.04
    }

    if (soundProfileRef.current === 'woodblock') {
      osc.type = 'triangle' 
      osc.frequency.setValueAtTime(frequency * 1.6, time)
      osc.frequency.exponentialRampToValueAtTime(frequency, time + 0.004)
      
      gainNode.gain.setValueAtTime(0.001, time)
      gainNode.gain.linearRampToValueAtTime(toneVolume, time + 0.002)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime)
    } else if (soundProfileRef.current === 'sine') {
      osc.type = 'sine' 
      osc.frequency.setValueAtTime(frequency, time)
      
      gainNode.gain.setValueAtTime(0.001, time)
      gainNode.gain.linearRampToValueAtTime(toneVolume, time + 0.002)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime)
    } else {
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

    osc.onended = () => {
      osc.disconnect()
      gainNode.disconnect()
    }
  }

  // Audio synthesis helper for rhythm B (Polyrhythm)
  const playPolyrhythmClick = (time: number) => {
    const ctx = audioContextRef.current
    if (!ctx || isMutedRef.current) return

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Distinctive tone for Rhythm B (Triangle wave, lower pitch)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(650, time) 
    osc.frequency.exponentialRampToValueAtTime(500, time + 0.02)
    
    const vol = volumeRef.current * 0.6
    gainNode.gain.setValueAtTime(0.001, time)
    gainNode.gain.linearRampToValueAtTime(vol, time + 0.002)
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    osc.start(time)
    osc.stop(time + 0.05)
    
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

    // 1. Process Primary Rhythm (Rhythm A)
    while (nextStepTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const step = currentStepRef.current
      const currentSub = subdivisionRef.current
      const currentNum = numeratorRef.current
      
      const ticksPerBeat = currentSub === 'off-beat' ? 2 : currentSub
      const beatInMeasure = Math.floor(step / ticksPerBeat) % currentNum
      const subIndex = step % ticksPerBeat
      
      // Counter Updates on the exact tick
      if (subIndex === 0) {
        // Run update on UI thread later via setTimeout
        const delayMs = (nextStepTimeRef.current - ctx.currentTime) * 1000
        const counterTimeout = setTimeout(() => {
          setTotalClicks(c => c + 1)
          if (beatInMeasure === 0) {
            setTotalMeasures(m => m + 1)
          }
        }, Math.max(0, delayMs))
        timeoutsRef.current.add(counterTimeout)

        // Perfect Sync for Polyrhythm B at the start of every measure
        if (beatInMeasure === 0 && isPolyrhythmActiveRef.current) {
          nextStepTimeBRef.current = nextStepTimeRef.current
          currentStepBRef.current = 0
        }
      }

      const shouldPlay = currentSub !== 'off-beat' || subIndex === 1
      if (shouldPlay) {
        const isAccent = beatInMeasure === 0 && subIndex === 0
        const isSub = subIndex > 0 || currentSub === 'off-beat'
        playClick(nextStepTimeRef.current, isAccent, isSub)
      }

      lastStepTimeRef.current = nextStepTimeRef.current

      // UI Flash Updates
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

      // Advance Primary Scheduler
      const stepDuration = 60.0 / (bpmRef.current * ticksPerBeat)
      nextStepTimeRef.current += stepDuration
      currentStepRef.current++
    }

    // 2. Process Secondary Rhythm (Rhythm B) if active
    if (isPolyrhythmActiveRef.current) {
      const polyB = rhythmBRef.current
      const currentNum = numeratorRef.current
      const measureDuration = (60.0 / bpmRef.current) * currentNum
      const stepDurationB = measureDuration / polyB

      while (nextStepTimeBRef.current < ctx.currentTime + scheduleAheadTime) {
        const stepB = currentStepBRef.current % polyB

        // Play sound if not the very first beat (which is already covered by primary accent)
        if (stepB !== 0) {
          playPolyrhythmClick(nextStepTimeBRef.current)
        }

        // UI Flash for B
        const delayMs = (nextStepTimeBRef.current - ctx.currentTime) * 1000
        const flashId = setTimeout(() => {
          setFlashBActive(true)
          const fT = setTimeout(() => {
            setFlashBActive(false)
            timeoutsRef.current.delete(fT)
          }, 60)
          timeoutsRef.current.add(fT)
          timeoutsRef.current.delete(flashId)
        }, Math.max(0, delayMs))
        timeoutsRef.current.add(flashId)

        // Advance B Scheduler
        nextStepTimeBRef.current += stepDurationB
        currentStepBRef.current++
      }
    }

    // Queue next tick
    timerIdRef.current = setTimeout(scheduler, lookahead)
  }

  const togglePlay = () => {
    if (isPlaying) {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current)
        timerIdRef.current = null
      }
      timeoutsRef.current.forEach((id) => clearTimeout(id))
      timeoutsRef.current.clear()

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      setIsPlaying(false)
      setActiveBeat(-1)
      setActiveSubdivision(-1)
      setFlashActive(false)
      setFlashBActive(false)
    } else {
      const ctx = initAudioContext()
      
      // Start slightly in the future to allow setup
      const startTime = ctx.currentTime + 0.05
      nextStepTimeRef.current = startTime
      nextStepTimeBRef.current = startTime
      lastStepTimeRef.current = ctx.currentTime
      currentStepRef.current = 0
      currentStepBRef.current = 0
      
      // Optional: reset counters on play start. (We don't do it so they can accumulate until explicitly reset)
      // setTotalClicks(0)
      // setTotalMeasures(0)

      setIsPlaying(true)
      scheduler()
    }
  }

  const handleTap = () => {
    const now = performance.now()
    const cutoff = now - 2000
    const currentTaps = tapTimes.filter(t => t > cutoff)
    const newTaps = [...currentTaps, now]
    setTapTimes(newTaps)

    if (newTaps.length >= 2) {
      const intervals = []
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1])
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      const calculatedBpm = Math.round(60000 / avgInterval)
      const clampedBpm = Math.max(10, Math.min(280, calculatedBpm))
      setBpm(clampedBpm)
    }
  }

  const adjustBpm = (amount: number) => {
    setBpm((prev) => Math.max(10, Math.min(280, prev + amount)))
  }

  const handleResetCounters = () => {
    setTotalClicks(0)
    setTotalMeasures(0)
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
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Counter Component */}
      <MetronomeCounter 
        totalClicks={totalClicks} 
        totalMeasures={totalMeasures} 
        onReset={handleResetCounters} 
      />

      {/* Pendulum Indicator */}
      <div className="w-full h-12 bg-gray-100/60 dark:bg-gray-950/50 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-center relative overflow-hidden mb-8">
        <div className="absolute w-[80%] h-0.5 bg-gray-200 dark:bg-gray-800" />
        
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

      {/* BPM Controls */}
      <div className="flex flex-col items-center justify-center mb-8 relative">
        <div className="relative w-44 h-44 rounded-full flex items-center justify-center border-4 border-gray-200/60 dark:border-gray-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] bg-white dark:bg-gray-950 transition-all duration-300">
          
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-100 pointer-events-none border-4 opacity-0 scale-100",
              flashActive && isAccentFlash && "border-emerald-500 opacity-90 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]",
              flashActive && !isAccentFlash && "border-primary-500 opacity-70 scale-103 shadow-[0_0_15px_rgba(139,92,246,0.3)]",
              isPolyrhythmActive && flashBActive && !flashActive && "border-indigo-500 opacity-60 scale-103 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
            )}
          />

          <div className="text-center select-none flex flex-col items-center justify-center">
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
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              className="w-28 text-5xl font-black text-center tracking-tight text-gray-900 dark:text-white font-mono bg-transparent border-b-2 border-transparent hover:border-gray-250 dark:hover:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none py-0"
              title="Haz clic para escribir el BPM"
            />
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">BPM</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button onClick={() => adjustBpm(-5)} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-gray-600 dark:text-gray-300">-5</button>
          <button onClick={() => adjustBpm(-1)} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-gray-600 dark:text-gray-300"><Minus className="w-4 h-4" /></button>
          <button onClick={handleTap} className="px-5 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 font-semibold text-sm flex items-center gap-1.5 hover:bg-primary-100 active:scale-95 transition-all shadow-sm"><RefreshCw className="w-3.5 h-3.5" /><span>Tap Tempo</span></button>
          <button onClick={() => adjustBpm(1)} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-gray-600 dark:text-gray-300"><Plus className="w-4 h-4" /></button>
          <button onClick={() => adjustBpm(5)} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all text-gray-600 dark:text-gray-300">+5</button>
        </div>

        <div className="w-full mt-6 px-4">
          <input
            type="range"
            min="10"
            max="280"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1 select-none font-medium">
            <span>10 Largo</span>
            <span>120 Moderato</span>
            <span>280 Prestissimo</span>
          </div>
        </div>
      </div>

      {/* Interactive Beat Grid */}
      <div className="mb-8 select-none">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 text-center">
          Estructura del Compás ({numerator}/{denominator})
        </p>
        
        <div className="flex justify-center gap-3 flex-wrap">
          {Array.from({ length: numerator }).map((_, beatIdx) => {
            const isCurrent = activeBeat === beatIdx
            const isFirstBeat = beatIdx === 0
            
            return (
              <div key={beatIdx} className="flex flex-col items-center gap-1.5">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-105 relative",
                    isFirstBeat
                      ? isCurrent && flashActive
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)] scale-110"
                        : "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-500"
                      : isCurrent && flashActive
                        ? "bg-primary-500 border-primary-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.6)] scale-108"
                        : "bg-gray-50 dark:bg-gray-800/40 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  )}
                  animate={{ scale: isCurrent && flashActive ? 1.1 : 1.0 }}
                  transition={{ duration: 0.05 }}
                >
                  {beatIdx + 1}
                </motion.div>

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

      <hr className="border-gray-200 dark:border-gray-800 my-6" />

      {/* Polyrhythm Controls */}
      <PolyrhythmControls
        isActive={isPolyrhythmActive}
        rhythmA={numerator}
        rhythmB={rhythmB}
        onToggle={() => setIsPolyrhythmActive(!isPolyrhythmActive)}
        onChangeB={setRhythmB}
      />

      {/* Controls Panel */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Compás (Num)</label>
            <select
              value={numerator}
              onChange={(e) => setNumerator(parseInt(e.target.value))}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold cursor-pointer text-gray-700 dark:text-gray-300"
            >
              {NUMERATORS.map((num) => <option key={num} value={num}>{num} tiempos</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Unidad (Den)</label>
            <select
              value={denominator}
              onChange={(e) => setDenominator(parseInt(e.target.value))}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold cursor-pointer text-gray-700 dark:text-gray-300"
            >
              {DENOMINATORS.map((den) => <option key={den} value={den}>/{den}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Subdivisiones</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(
              [
                { label: 'Negras', value: 1 },
                { label: 'Off-beat', value: 'off-beat' },
                { label: 'Corcheas', value: 2 },
                { label: 'Tresillos', value: 3 },
                { label: 'Semicorch.', value: 4 },
                { label: 'Seisillos', value: 6 },
              ] as const
            ).map((subOption) => (
              <button
                key={subOption.value}
                onClick={() => setSubdivision(subOption.value)}
                className={cn(
                  "py-2 px-1 rounded-xl text-xs font-semibold border transition-all duration-200 active:scale-95",
                  subdivision === subOption.value
                    ? "bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-500/20"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                {subOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Tipo de Sonido</label>
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

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Volumen</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
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
          {isPlaying ? <Square className="w-8 h-8 fill-white stroke-none" /> : <Play className="w-8 h-8 fill-white stroke-none ml-1" />}
        </button>
      </div>

      <div className="mt-6 text-center select-none">
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-semibold px-3 py-1 rounded-full bg-gray-100/40 dark:bg-gray-800/30 border border-gray-200/30 dark:border-gray-800/40">
          <Music className="w-3 h-3 text-primary-500" />
          <span>Advanced Audio Engine</span>
        </div>
      </div>
    </div>
  )
}
