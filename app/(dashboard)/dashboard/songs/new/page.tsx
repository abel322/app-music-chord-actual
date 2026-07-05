'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { getDiatonicChords, getAllChordTypes, getChordDegree } from '@/lib/music-theory'
import { transposeChord } from '@/lib/transpose'

type SectionType = 'intro' | 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'instrumental' | 'outro' | 'solo'

interface Section {
  id: string
  type: SectionType
  label: string
  lines: Line[]
  timeSignature?: string
}

interface Line {
  id: string
  lyrics: string
  chords: ChordPosition[]
}

interface ChordPosition {
  id: string
  chord: string
  position: number
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro' },
  { value: 'verse', label: 'Estrofa' },
  { value: 'prechorus', label: 'Pre-Coro' },
  { value: 'chorus', label: 'Coro' },
  { value: 'bridge', label: 'Puente' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'solo', label: 'Solo' },
  { value: 'outro', label: 'Outro' },
]

const CHORD_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function NewSongPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [key, setKey] = useState('C')
  const [timeSignature, setTimeSignature] = useState('4/4')
  const [tempo, setTempo] = useState('120')
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showChordPicker, setShowChordPicker] = useState(false)
  const [selectedLine, setSelectedLine] = useState<{ sectionId: string; lineId: string } | null>(null)
  const [tapTimes, setTapTimes] = useState<number[]>([])
  const [showTapTempo, setShowTapTempo] = useState(false)
  const [metronomeActive, setMetronomeActive] = useState(false)
  const [metronomeBeat, setMetronomeBeat] = useState(false)
  const [songUrl, setSongUrl] = useState('')
  const [showPlayer, setShowPlayer] = useState(false)
  const [showTimeSignatureDetector, setShowTimeSignatureDetector] = useState(false)
  const [beatTaps, setBeatTaps] = useState<number[]>([])
  const [detectedBeats, setDetectedBeats] = useState(0)
  const [measureCount, setMeasureCount] = useState(0)
  const [beatsInCurrentMeasure, setBeatsInCurrentMeasure] = useState(0)
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null)

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const chordTypes = getAllChordTypes()
  const diatonicChords = getDiatonicChords(key)

  // Tipos de acordes expandidos organizados por categoría
  const expandedChordTypes = [
    // Tríadas básicas
    { value: '', label: 'Mayor', category: 'triads' },
    { value: 'm', label: 'Menor', category: 'triads' },
    { value: 'dim', label: 'Disminuido', category: 'triads' },
    { value: 'aug', label: 'Aumentado', category: 'triads' },
    
    // Suspendidos
    { value: 'sus2', label: 'sus2', category: 'suspended' },
    { value: 'sus4', label: 'sus4', category: 'suspended' },
    
    // Séptimas
    { value: '7', label: 'Dominante 7', category: 'sevenths' },
    { value: 'maj7', label: 'Mayor 7', category: 'sevenths' },
    { value: 'm7', label: 'Menor 7', category: 'sevenths' },
    { value: 'mMaj7', label: 'Menor Mayor 7', category: 'sevenths' },
    { value: 'dim7', label: 'Disminuido 7', category: 'sevenths' },
    { value: 'm7b5', label: 'Semidisminuido', category: 'sevenths' },
    { value: '7sus4', label: '7sus4', category: 'sevenths' },
    { value: 'maj7#5', label: 'Maj7#5', category: 'sevenths' },
    
    // Sextas
    { value: '6', label: 'Sexta', category: 'sixths' },
    { value: 'm6', label: 'Menor 6', category: 'sixths' },
    { value: '6/9', label: '6/9', category: 'sixths' },
    
    // Novenas
    { value: '9', label: 'Novena', category: 'ninths' },
    { value: 'maj9', label: 'Mayor 9', category: 'ninths' },
    { value: 'm9', label: 'Menor 9', category: 'ninths' },
    { value: 'add9', label: 'add9', category: 'ninths' },
    { value: '7b9', label: '7b9', category: 'ninths' },
    { value: '7#9', label: '7#9', category: 'ninths' },
    
    // Oncenas
    { value: '11', label: '11', category: 'elevenths' },
    { value: 'maj11', label: 'Maj11', category: 'elevenths' },
    { value: 'm11', label: 'm11', category: 'elevenths' },
    { value: '7#11', label: '7#11', category: 'elevenths' },
    
    // Trecenas
    { value: '13', label: '13', category: 'thirteenths' },
    { value: 'maj13', label: 'Maj13', category: 'thirteenths' },
    { value: 'm13', label: 'm13', category: 'thirteenths' },
    
    // Alterados
    { value: '7b5', label: '7b5', category: 'altered' },
    { value: '7#5', label: '7#5', category: 'altered' },
    { value: '7b9b5', label: '7b9b5', category: 'altered' },
    { value: '7alt', label: '7alt', category: 'altered' },
  ]

  // Poliacordes comunes - Acorde sobre su tercera mayor (patrón A/C#)
  const polyChords = [
    // Patrón: Acorde Mayor / Tercera Mayor
    { value: 'C/E', label: 'C/E', description: 'C sobre E (tercera)' },
    { value: 'C#/F', label: 'C#/F', description: 'C# sobre F (tercera)' },
    { value: 'Db/F', label: 'Db/F', description: 'Db sobre F (tercera)' },
    { value: 'D/F#', label: 'D/F#', description: 'D sobre F# (tercera)' },
    { value: 'D#/G', label: 'D#/G', description: 'D# sobre G (tercera)' },
    { value: 'Eb/G', label: 'Eb/G', description: 'Eb sobre G (tercera)' },
    { value: 'E/G#', label: 'E/G#', description: 'E sobre G# (tercera)' },
    { value: 'F/A', label: 'F/A', description: 'F sobre A (tercera)' },
    { value: 'F#/A#', label: 'F#/A#', description: 'F# sobre A# (tercera)' },
    { value: 'Gb/Bb', label: 'Gb/Bb', description: 'Gb sobre Bb (tercera)' },
    { value: 'G/B', label: 'G/B', description: 'G sobre B (tercera)' },
    { value: 'G#/C', label: 'G#/C', description: 'G# sobre C (tercera)' },
    { value: 'Ab/C', label: 'Ab/C', description: 'Ab sobre C (tercera)' },
    { value: 'A/C#', label: 'A/C#', description: 'A sobre C# (tercera)' },
    { value: 'A#/D', label: 'A#/D', description: 'A# sobre D (tercera)' },
    { value: 'Bb/D', label: 'Bb/D', description: 'Bb sobre D (tercera)' },
    { value: 'B/D#', label: 'B/D#', description: 'B sobre D# (tercera)' },
  ]

  // Función para obtener información de subdivisión del compás
  const getTimeSignatureInfo = (ts: string) => {
    const info = {
      subdivision: '',
      description: '',
      feel: ''
    }

    switch (ts) {
      case '2/4':
        info.subdivision = 'Binaria'
        info.description = 'Simple'
        info.feel = '2 tiempos, subdivisión binaria'
        break
      case '3/4':
        info.subdivision = 'Binaria'
        info.description = 'Simple (Vals)'
        info.feel = '3 tiempos, subdivisión binaria'
        break
      case '4/4':
        info.subdivision = 'Binaria'
        info.description = 'Simple (Común)'
        info.feel = '4 tiempos, subdivisión binaria'
        break
      case '5/4':
        info.subdivision = 'Binaria'
        info.description = 'Compuesto irregular'
        info.feel = '5 tiempos, subdivisión binaria'
        break
      case '6/8':
        info.subdivision = 'Ternaria'
        info.description = 'Compuesto'
        info.feel = '2 tiempos, subdivisión ternaria (6 corcheas)'
        break
      case '7/8':
        info.subdivision = 'Mixta'
        info.description = 'Compuesto irregular'
        info.feel = '7 corcheas, subdivisión irregular'
        break
      case '9/8':
        info.subdivision = 'Ternaria'
        info.description = 'Compuesto'
        info.feel = '3 tiempos, subdivisión ternaria (9 corcheas)'
        break
      case '12/8':
        info.subdivision = 'Ternaria'
        info.description = 'Compuesto'
        info.feel = '4 tiempos, subdivisión ternaria (12 corcheas)'
        break
      default:
        info.subdivision = 'Binaria'
        info.description = 'Simple'
        info.feel = 'Subdivisión estándar'
    }

    return info
  }

  const timeSignatureInfo = getTimeSignatureInfo(timeSignature)

  const handleKeyChange = (newKey: string) => {
    if (sections.length === 0 || key === newKey) {
      setKey(newKey)
      return
    }

    // Calcular semitonos de diferencia
    const oldKeyIndex = keys.indexOf(key)
    const newKeyIndex = keys.indexOf(newKey)
    const semitones = (newKeyIndex - oldKeyIndex + 12) % 12

    // Transponer todos los acordes en todas las secciones
    const transposedSections = sections.map(section => ({
      ...section,
      lines: section.lines.map(line => ({
        ...line,
        chords: line.chords.map(chord => ({
          ...chord,
          chord: transposeChord(chord.chord, semitones)
        }))
      }))
    }))

    setSections(transposedSections)
    setKey(newKey)
  }

  const addSection = (type: SectionType) => {
    // Contar cuántas secciones del mismo tipo ya existen
    const sameTypeCount = sections.filter(s => s.type === type).length
    const sectionNumber = sameTypeCount + 1
    
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      label: `${SECTION_TYPES.find(t => t.value === type)?.label || type} ${sectionNumber}`,
      lines: [{ id: Date.now().toString(), lyrics: '', chords: [] }],
      timeSignature: timeSignature, // Usar el compás global por defecto
    }
    setSections([...sections, newSection])
  }

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId))
  }

  const moveSectionUp = (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index > 0) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index - 1]
      newSections[index - 1] = temp
      setSections(newSections)
    }
  }

  const moveSectionDown = (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index < sections.length - 1) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index + 1]
      newSections[index + 1] = temp
      setSections(newSections)
    }
  }

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSectionId(sectionId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', sectionId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault()
    
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      setDraggedSectionId(null)
      return
    }

    const draggedIndex = sections.findIndex(s => s.id === draggedSectionId)
    const targetIndex = sections.findIndex(s => s.id === targetSectionId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSectionId(null)
      return
    }

    const newSections = [...sections]
    const [draggedSection] = newSections.splice(draggedIndex, 1)
    newSections.splice(targetIndex, 0, draggedSection)

    setSections(newSections)
    setDraggedSectionId(null)
  }

  const handleDragEnd = () => {
    setDraggedSectionId(null)
  }

  const updateSectionTimeSignature = (sectionId: string, newTimeSignature: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, timeSignature: newTimeSignature }
        : section
    ))
  }

  const handleTapTempo = () => {
    const now = Date.now()
    const newTapTimes = [...tapTimes, now].slice(-8) // Mantener últimos 8 taps
    setTapTimes(newTapTimes)

    if (newTapTimes.length >= 2) {
      // Calcular intervalos entre taps
      const intervals = []
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1])
      }
      
      // Calcular promedio de intervalos
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      
      // Convertir a BPM (60000 ms = 1 minuto)
      const bpm = Math.round(60000 / avgInterval)
      
      // Validar rango razonable
      if (bpm >= 40 && bpm <= 240) {
        setTempo(bpm.toString())
      }
    }

    // Resetear después de 2 segundos de inactividad
    setTimeout(() => {
      setTapTimes(prev => {
        const lastTap = prev[prev.length - 1]
        if (lastTap && Date.now() - lastTap > 2000) {
          return []
        }
        return prev
      })
    }, 2000)
  }

  const resetTapTempo = () => {
    setTapTimes([])
  }

  const toggleMetronome = () => {
    setMetronomeActive(!metronomeActive)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      let videoId = ''
      
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || ''
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1)
      }
      
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    } catch {
      return null
    }
  }

  const getSpotifyEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('spotify.com')) {
        const path = urlObj.pathname
        return `https://open.spotify.com/embed${path}`
      }
      return null
    } catch {
      return null
    }
  }

  const handleLoadSong = async () => {
    if (songUrl.trim()) {
      setShowPlayer(true)
      
      // Auto-detect song info and time signature (defaulting to 4/4 as standard for most songs if undetectable)
      try {
        if (songUrl.includes('spotify.com')) {
          const res = await fetch(`https://open.spotify.com/oembed?url=${songUrl}`)
          const data = await res.json()
          if (data.title) {
            if (data.title.includes(' - ')) {
              const parts = data.title.split(' - ')
              setArtist(parts[0].trim())
              setTitle(parts.slice(1).join(' - ').trim())
            } else {
              setTitle(data.title)
            }
          }
          setTimeSignature('4/4')
        } else if (songUrl.includes('youtube.com') || songUrl.includes('youtu.be')) {
          const res = await fetch(`https://noembed.com/embed?url=${songUrl}`)
          const data = await res.json()
          if (data.title) {
            const parts = data.title.split('-')
            if (parts.length >= 2) {
              setArtist(parts[0].trim())
              setTitle(parts.slice(1).join('-').trim())
            } else {
              setTitle(data.title)
              if (data.author_name) setArtist(data.author_name.replace(' - Topic', '').trim())
            }
          }
          setTimeSignature('4/4')
        }
      } catch (err) {
        console.error("Error fetching song info", err)
      }
    }
  }

  const handleBeatTap = () => {
    const now = Date.now()
    const newBeatTaps = [...beatTaps, now]
    setBeatTaps(newBeatTaps)

    // Analizar patrón continuamente después de 8 taps
    if (newBeatTaps.length >= 8) {
      detectTimeSignature(newBeatTaps)
    }

    // Resetear después de 3 segundos de inactividad
    setTimeout(() => {
      setBeatTaps(prev => {
        const lastTap = prev[prev.length - 1]
        if (lastTap && Date.now() - lastTap > 3000) {
          setDetectedBeats(0)
          return []
        }
        return prev
      })
    }, 3000)
  }

  const detectTimeSignature = (taps: number[]) => {
    if (taps.length < 8) return

    // Calcular intervalos entre taps
    const intervals = []
    for (let i = 1; i < taps.length; i++) {
      intervals.push(taps[i] - taps[i - 1])
    }

    // Calcular promedio y desviación estándar
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
    const stdDev = Math.sqrt(variance)

    // Buscar intervalos significativamente más largos (pausas entre compases)
    // Usar un threshold más bajo para detectar pausas más sutiles
    const threshold = avgInterval + (stdDev * 0.3)
    const measureBreaks: number[] = []
    
    intervals.forEach((interval, index) => {
      if (interval > threshold && interval > avgInterval * 1.2) {
        measureBreaks.push(index)
      }
    })

    let detectedBeatsPerMeasure = 4 // Default

    // Método 1: Detectar por pausas entre compases
    if (measureBreaks.length >= 2) {
      const beatsPerMeasureArray: number[] = []
      
      // Calcular beats entre cada pausa
      let lastBreak = -1
      measureBreaks.forEach(breakIndex => {
        const beatsInMeasure = breakIndex - lastBreak
        if (beatsInMeasure >= 2 && beatsInMeasure <= 12) {
          beatsPerMeasureArray.push(beatsInMeasure)
        }
        lastBreak = breakIndex
      })

      if (beatsPerMeasureArray.length > 0) {
        // Calcular la moda (valor más frecuente)
        const frequency: { [key: number]: number } = {}
        beatsPerMeasureArray.forEach(beats => {
          frequency[beats] = (frequency[beats] || 0) + 1
        })
        
        let maxFreq = 0
        let mode = 4
        Object.entries(frequency).forEach(([beats, freq]) => {
          if (freq > maxFreq) {
            maxFreq = freq
            mode = parseInt(beats)
          }
        })
        
        detectedBeatsPerMeasure = mode
      }
    } 
    
    // Método 2: Si no hay pausas claras, probar divisiones comunes
    if (measureBreaks.length < 2) {
      const totalTaps = taps.length
      
      // Probar divisiones comunes y ver cuál tiene mejor fit
      const possibleBeats = [2, 3, 4, 5, 6, 7, 9, 12]
      let bestFit = 4
      let bestScore = Infinity
      
      possibleBeats.forEach(beats => {
        // Calcular qué tan bien divide el total de taps
        const measures = Math.floor(totalTaps / beats)
        const remainder = totalTaps % beats
        
        // Preferir divisiones con poco remainder y al menos 2 compases
        if (measures >= 2) {
          const score = remainder + (Math.abs(beats - 4) * 0.1) // Bias hacia 4/4
          if (score < bestScore) {
            bestScore = score
            bestFit = beats
          }
        }
      })
      
      detectedBeatsPerMeasure = bestFit
    }

    // Método 3: Análisis de autocorrelación para patrones repetitivos
    if (taps.length >= 12) {
      const correlations: { [key: number]: number } = {}
      
      // Probar patrones de 2 a 12 beats
      for (let pattern = 2; pattern <= 12; pattern++) {
        let correlation = 0
        const numPatterns = Math.floor(intervals.length / pattern)
        
        if (numPatterns >= 2) {
          // Comparar cada patrón con el siguiente
          for (let i = 0; i < numPatterns - 1; i++) {
            for (let j = 0; j < pattern && (i * pattern + j) < intervals.length; j++) {
              const idx1 = i * pattern + j
              const idx2 = (i + 1) * pattern + j
              if (idx2 < intervals.length) {
                // Calcular similitud entre intervalos
                const diff = Math.abs(intervals[idx1] - intervals[idx2])
                correlation += 1 / (1 + diff / avgInterval)
              }
            }
          }
          correlations[pattern] = correlation / (numPatterns - 1)
        }
      }
      
      // Encontrar el patrón con mayor correlación
      let maxCorrelation = 0
      let bestPattern = detectedBeatsPerMeasure
      
      Object.entries(correlations).forEach(([pattern, corr]) => {
        if (corr > maxCorrelation) {
          maxCorrelation = corr
          bestPattern = parseInt(pattern)
        }
      })
      
      // Si la correlación es significativa, usar ese patrón
      if (maxCorrelation > 0.5) {
        detectedBeatsPerMeasure = bestPattern
      }
    }

    setDetectedBeats(detectedBeatsPerMeasure)

    // Asignar compás basado en los beats detectados
    switch (detectedBeatsPerMeasure) {
      case 2:
        setTimeSignature('2/4')
        break
      case 3:
        setTimeSignature('3/4')
        break
      case 5:
        setTimeSignature('5/4')
        break
      case 6:
        setTimeSignature('6/8')
        break
      case 7:
        setTimeSignature('7/8')
        break
      case 9:
        setTimeSignature('9/8')
        break
      case 12:
        setTimeSignature('12/8')
        break
      default:
        setTimeSignature('4/4')
    }
  }

  const resetBeatDetector = () => {
    setBeatTaps([])
    setDetectedBeats(0)
    setMeasureCount(0)
    setBeatsInCurrentMeasure(0)
  }

  const handleMeasureComplete = () => {
    const newMeasureCount = measureCount + 1
    setMeasureCount(newMeasureCount)
    
    if (newMeasureCount === 1) {
      // Primera medida completa, establecer el patrón
      setDetectedBeats(beatsInCurrentMeasure)
      
      // Asignar compás
      switch (beatsInCurrentMeasure) {
        case 2:
          setTimeSignature('2/4')
          break
        case 3:
          setTimeSignature('3/4')
          break
        case 5:
          setTimeSignature('5/4')
          break
        case 6:
          setTimeSignature('6/8')
          break
        case 7:
          setTimeSignature('7/8')
          break
        case 9:
          setTimeSignature('9/8')
          break
        case 12:
          setTimeSignature('12/8')
          break
        default:
          setTimeSignature('4/4')
      }
    }
    
    setBeatsInCurrentMeasure(0)
  }

  const extractYouTubeTitleFromUrl = (url: string) => {
    // Intentar extraer el título del video de YouTube (esto es limitado)
    // En la práctica, el usuario deberá ingresar el título manualmente
    return ''
  }

  // Efecto para el metrónomo
  React.useEffect(() => {
    if (!metronomeActive || !tempo) return

    const bpm = parseInt(tempo)
    if (isNaN(bpm) || bpm < 40 || bpm > 240) return

    const interval = 60000 / bpm // Intervalo en milisegundos

    // Crear contexto de audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const playClick = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configurar sonido de click
      oscillator.frequency.value = 1000 // Frecuencia en Hz
      oscillator.type = 'sine'

      // Envelope para hacer el sonido más corto y percusivo
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.05)

      // Actualizar visual
      setMetronomeBeat(true)
      setTimeout(() => setMetronomeBeat(false), 100)
    }

    // Reproducir inmediatamente al activar
    playClick()

    // Luego continuar con el intervalo
    const metronomeInterval = setInterval(playClick, interval)

    return () => {
      clearInterval(metronomeInterval)
      audioContext.close()
    }
  }, [metronomeActive, tempo])

  const addLine = (sectionId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lines: [...section.lines, { id: Date.now().toString(), lyrics: '', chords: [] }]
        }
      }
      return section
    }))
  }

  const updateLine = (sectionId: string, lineId: string, lyrics: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lines: section.lines.map(line => 
            line.id === lineId ? { ...line, lyrics } : line
          )
        }
      }
      return section
    }))
  }

  const removeLine = (sectionId: string, lineId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lines: section.lines.filter(line => line.id !== lineId)
        }
      }
      return section
    }))
  }

  const addChord = (sectionId: string, lineId: string, chord: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lines: section.lines.map(line => {
            if (line.id === lineId) {
              return {
                ...line,
                chords: [...line.chords, { id: Date.now().toString(), chord, position: 0 }]
              }
            }
            return line
          })
        }
      }
      return section
    }))
    setShowChordPicker(false)
    setSelectedLine(null)
  }

  const removeChord = (sectionId: string, lineId: string, chordId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lines: section.lines.map(line => {
            if (line.id === lineId) {
              return {
                ...line,
                chords: line.chords.filter(c => c.id !== chordId)
              }
            }
            return line
          })
        }
      }
      return section
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Convertir estructura a texto
    const content = sections.map(section => {
      const sectionTimeSignature = section.timeSignature && section.timeSignature !== timeSignature 
        ? ` (${section.timeSignature})` 
        : ''
      const sectionHeader = `[${section.label}${sectionTimeSignature}]`
      const sectionContent = section.lines.map(line => {
        const chordLine = line.chords.map(c => c.chord).join(' ')
        return chordLine ? `${chordLine}\n${line.lyrics}` : line.lyrics
      }).join('\n')
      return `${sectionHeader}\n${sectionContent}`
    }).join('\n\n')

    // Extraer solo la letra de la estructura para usarla como fallback si no hay fetch
    const autoExtractedLyrics = sections.map(section => {
      const sectionHeader = `[${section.label}]`
      const sectionLyrics = section.lines.map(line => line.lyrics).filter(Boolean).join('\n')
      return sectionLyrics ? `${sectionHeader}\n${sectionLyrics}` : ''
    }).filter(Boolean).join('\n\n')

    let fetchedLyrics = ''
    if (title && artist) {
      try {
        const lyricsResponse = await fetch('/api/lyrics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, artist }),
        })
        if (lyricsResponse.ok) {
          const lyricsData = await lyricsResponse.json()
          fetchedLyrics = lyricsData.lyrics
        }
      } catch (err) {
        console.error('Error buscando letra:', err)
      }
    }

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          artist,
          key,
          timeSignature,
          tempo: parseInt(tempo),
          content,
          lyrics: fetchedLyrics || autoExtractedLyrics || 'Sin letra',
        }),
      })

      if (response.ok) {
        const { song } = await response.json()
        router.push(`/dashboard/songs/${song.id}`)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/songs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Nueva Canción</h1>
      </div>
 
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reproductor de Canción */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎵</span>
            <h2 className="font-semibold text-lg">Reproduce tu Canción</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pega el link de YouTube o Spotify para reproducir la canción mientras trabajas
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... o https://open.spotify.com/track/..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleLoadSong}
              disabled={!songUrl.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              Cargar
            </button>
            {showPlayer && (
              <button
                type="button"
                onClick={() => setShowPlayer(false)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                title="Cerrar reproductor"
              >
                ✕
              </button>
            )}
          </div>

          {showPlayer && (
            <div className="mt-4">
              {getYouTubeEmbedUrl(songUrl) && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={getYouTubeEmbedUrl(songUrl) || ''}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              {getSpotifyEmbedUrl(songUrl) && !getYouTubeEmbedUrl(songUrl) && (
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    style={{ borderRadius: '12px' }}
                    src={getSpotifyEmbedUrl(songUrl) || ''}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  ></iframe>
                </div>
              )}
              {!getYouTubeEmbedUrl(songUrl) && !getSpotifyEmbedUrl(songUrl) && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ URL no válida. Usa un link de YouTube o Spotify
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Búsqueda automática de información musical */}

          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>💡</span>
            <div>
              <p className="font-medium mb-1">Cómo obtener el link:</p>
              <p><strong>YouTube:</strong> Abre la canción → Clic en "Compartir" → Copia el link</p>
              <p><strong>Spotify:</strong> Abre la canción → Clic en "..." → Compartir → Copiar enlace de canción</p>
            </div>
          </div>
        </div>

        {/* Info básica */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Información Básica</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Título"
              placeholder="Nombre de la canción"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Artista"
              placeholder="Nombre del artista"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Compás</label>
              <div className="flex gap-2 mb-2">
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="2/4">2/4</option>
                  <option value="3/4">3/4 (Vals)</option>
                  <option value="4/4">4/4 (Común)</option>
                  <option value="5/4">5/4</option>
                  <option value="6/8">6/8</option>
                  <option value="7/8">7/8</option>
                  <option value="9/8">9/8</option>
                  <option value="12/8">12/8</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowTimeSignatureDetector(!showTimeSignatureDetector)}
                  className="px-4 py-2 rounded-lg border border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                  title="Detectar compás"
                >
                  🎼 Detectar
                </button>
              </div>

              {/* Información de subdivisión */}
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    Subdivisión: {timeSignatureInfo.subdivision}
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    {timeSignatureInfo.description}
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {timeSignatureInfo.feel}
                </p>
              </div>

              {showTimeSignatureDetector && (
                <div className="mt-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        🎼 Detectar Compás
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetBeatDetector}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Reiniciar
                    </button>
                  </div>

                  {/* Modo Manual Simple */}
                  <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      ⭐ Modo Simple (Recomendado)
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      1. Toca "Beat" en cada tiempo de la canción<br/>
                      2. Al terminar un compás completo, toca "Fin de Compás"<br/>
                      3. Repite para confirmar el patrón
                    </p>
                    
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setBeatsInCurrentMeasure(beatsInCurrentMeasure + 1)}
                        className="flex-1 py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-lg transition-all active:scale-95"
                      >
                        🎵 Beat ({beatsInCurrentMeasure})
                      </button>
                      <button
                        type="button"
                        onClick={handleMeasureComplete}
                        disabled={beatsInCurrentMeasure === 0}
                        className="flex-1 py-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition-all active:scale-95"
                      >
                        ✓ Fin de Compás
                      </button>
                    </div>

                    {measureCount > 0 && detectedBeats > 0 && (
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500">
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">
                          ✓ Compás detectado: {timeSignature}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {detectedBeats} beats por compás • {measureCount} compás(es) registrado(s)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modo Automático */}
                  <details className="mb-3">
                    <summary className="cursor-pointer text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                      🔧 Modo Automático (Avanzado)
                    </summary>
                    
                    <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg space-y-2">
                      <p className="text-xs text-purple-800 dark:text-purple-200 font-medium">
                        💡 <strong>Para 4/4:</strong> Toca → <strong>1</strong>-2-3-4 [pausa] <strong>1</strong>-2-3-4 [pausa]
                      </p>
                      <p className="text-xs text-purple-800 dark:text-purple-200 font-medium">
                        💡 <strong>Para 3/4:</strong> Toca → <strong>1</strong>-2-3 [pausa] <strong>1</strong>-2-3 [pausa]
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 italic">
                        Haz una pausa más larga al inicio de cada compás
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleBeatTap}
                      className="w-full mt-3 py-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xl transition-all active:scale-95 active:bg-purple-800"
                    >
                      {beatTaps.length === 0 ? 'TAP EN CADA BEAT' : `TAP (${beatTaps.length})`}
                    </button>
                    
                    {beatTaps.length > 0 && (
                      <div className="mt-3 text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(beatTaps.length, 16) }).map((_, i) => (
                              <div
                                key={i}
                                className="w-2 h-8 bg-purple-500 rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                          Beats registrados: {beatTaps.length} {beatTaps.length >= 8 ? '✓ Analizando...' : `(necesitas ${8 - beatTaps.length} más)`}
                        </p>
                        {detectedBeats > 0 && beatTaps.length >= 8 && (
                          <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500">
                            <p className="text-lg font-bold text-green-900 dark:text-green-100">
                              ✓ Compás detectado: {timeSignature}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {detectedBeats} beats por compás
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Sigue tocando para mejorar la precisión
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </details>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tempo (BPM)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="40"
                  max="240"
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  placeholder="120"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowTapTempo(!showTapTempo)}
                  className="px-4 py-2 rounded-lg border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors font-medium"
                  title="Detectar tempo"
                >
                  🎵 Tap
                </button>
                <button
                  type="button"
                  onClick={toggleMetronome}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    metronomeActive
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title="Activar metrónomo"
                >
                  {metronomeActive ? '⏸' : '▶️'}
                </button>
              </div>
              
              {/* Metrónomo Visual */}
              {metronomeActive && (
                <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      🔊 Metrónomo: {tempo} BPM
                    </p>
                    <button
                      type="button"
                      onClick={toggleMetronome}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      Detener
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div
                      className={`w-16 h-16 rounded-full transition-all duration-100 ${
                        metronomeBeat
                          ? 'bg-green-500 scale-110 shadow-lg shadow-green-500/50'
                          : 'bg-green-200 dark:bg-green-800 scale-100'
                      }`}
                    />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {metronomeBeat ? '🔊' : '🔈'}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-green-700 dark:text-green-300">
                    Escucha el click y verifica que coincida con tu canción
                  </p>
                </div>
              )}

              {showTapTempo && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Detectar Tempo
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {showPlayer 
                          ? '1️⃣ Reproduce la canción arriba\n2️⃣ Toca el botón al ritmo del beat\n3️⃣ Mínimo 4 taps para mejor precisión'
                          : '1️⃣ Carga tu canción arriba o reprodúcela en otra app\n2️⃣ Toca el botón al ritmo del beat\n3️⃣ Mínimo 4 taps para mejor precisión'
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetTapTempo}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Reiniciar
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleTapTempo}
                    className="w-full py-8 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xl transition-all active:scale-95 active:bg-primary-800"
                  >
                    TAP AQUÍ
                  </button>
                  {tapTimes.length > 0 && (
                    <div className="mt-3 text-center">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Taps: {tapTimes.length} {tapTimes.length >= 4 ? '✓ Listo' : '(mínimo 4)'}
                      </p>
                      {tapTimes.length >= 2 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Tempo detectado: {tempo} BPM
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-500">
                  {parseInt(tempo) < 60 && 'Muy lento'}
                  {parseInt(tempo) >= 60 && parseInt(tempo) < 80 && 'Lento (Adagio)'}
                  {parseInt(tempo) >= 80 && parseInt(tempo) < 100 && 'Moderado (Andante)'}
                  {parseInt(tempo) >= 100 && parseInt(tempo) < 120 && 'Moderato'}
                  {parseInt(tempo) >= 120 && parseInt(tempo) < 140 && 'Allegro'}
                  {parseInt(tempo) >= 140 && parseInt(tempo) < 180 && 'Rápido (Vivace)'}
                  {parseInt(tempo) >= 180 && 'Muy rápido (Presto)'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Presets:</span>
                  {[
                    { label: 'Balada', bpm: 70 },
                    { label: 'Pop', bpm: 120 },
                    { label: 'Rock', bpm: 140 },
                    { label: 'Dance', bpm: 128 },
                    { label: 'Reggaeton', bpm: 95 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTempo(preset.bpm.toString())}
                      className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {preset.label} ({preset.bpm})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tonalidad</label>
            <div className="flex flex-wrap gap-2">
              {keys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeyChange(k)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    key === k
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            {sections.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Al cambiar la tonalidad, todos los acordes se transpondrán automáticamente
              </p>
            )}
          </div>
        </div>

        {/* Secciones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Estructura de la Canción</h2>
            <div className="flex gap-2">
              {SECTION_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => addSection(type.value as SectionType)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {sections.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Agrega secciones para estructurar tu canción
              </p>
              <p className="text-sm text-gray-500">
                Ejemplo: Intro → Estrofa → Coro → Estrofa → Coro → Puente → Coro
              </p>
            </div>
          )}

          {sections.map((section, sectionIndex) => (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section.id)}
              onDragEnd={handleDragEnd}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 transition-all ${
                draggedSectionId === section.id 
                  ? 'opacity-50 scale-95' 
                  : 'opacity-100 scale-100'
              } ${
                draggedSectionId && draggedSectionId !== section.id
                  ? 'border-primary-500 border-2'
                  : ''
              }`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                  <span className="font-semibold text-lg">{section.label}</span>
                  {section.timeSignature && section.timeSignature !== timeSignature && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded">
                      {section.timeSignature}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={section.timeSignature || timeSignature}
                    onChange={(e) => updateSectionTimeSignature(section.id, e.target.value)}
                    className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    title="Compás de esta sección"
                  >
                    <option value="2/4">2/4</option>
                    <option value="3/4">3/4</option>
                    <option value="4/4">4/4</option>
                    <option value="5/4">5/4</option>
                    <option value="6/8">6/8</option>
                    <option value="7/8">7/8</option>
                    <option value="9/8">9/8</option>
                    <option value="12/8">12/8</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSectionUp(section.id)}
                    disabled={sectionIndex === 0}
                    title="Mover arriba"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSectionDown(section.id)}
                    disabled={sectionIndex === sections.length - 1}
                    title="Mover abajo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(section.id)}
                    title="Eliminar sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Lines */}
              {section.lines.map((line) => (
                <div key={line.id} className="space-y-2">
                  {/* Chords */}
                  <div className="flex flex-wrap gap-2">
                    {line.chords.map((chord) => {
                      // Verificar si el acorde está en la tonalidad
                      const chordMatch = chord.chord.match(/^([A-G][#b]?)(.*)$/)
                      const isInKey = chordMatch && diatonicChords.inKey.some(
                        c => c.root === chordMatch[1] && c.type === chordMatch[2]
                      )
                      
                      // Obtener el grado del acorde
                      const degree = chordMatch ? getChordDegree(chordMatch[1], chordMatch[2], key) : null
                      
                      return (
                        <div
                          key={chord.id}
                          className={`inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg font-mono text-sm ${
                            isInKey
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                          }`}
                          title={isInKey ? 'Acorde diatónico' : 'Acorde cromático'}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{chord.chord}</span>
                            <button
                              type="button"
                              onClick={() => removeChord(section.id, line.id, chord.id)}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </div>
                          {degree && (
                            <span className="text-xs opacity-75 font-semibold">
                              {degree}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLine({ sectionId: section.id, lineId: line.id })
                        setShowChordPicker(true)
                      }}
                      className="px-3 py-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
                    >
                      + Acorde
                    </button>
                  </div>

                  {/* Lyrics */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={line.lyrics}
                      onChange={(e) => updateLine(section.id, line.id, e.target.value)}
                      placeholder="Escribe la letra aquí..."
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {section.lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(section.id, line.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addLine(section.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar línea
              </Button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/songs">
            <Button variant="secondary" type="button">
              Cancelar
            </Button>
          </Link>
          <Button variant="gradient" type="submit" isLoading={isLoading} disabled={sections.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Canción
          </Button>
        </div>
      </form>

      {/* Chord Picker Modal */}
      {showChordPicker && selectedLine && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowChordPicker(false)
            setSelectedLine(null)
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-6xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Seleccionar Acorde</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tonalidad: <span className="font-semibold text-primary-600">{key}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowChordPicker(false)
                  setSelectedLine(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Acordes Diatónicos (En la tonalidad) */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-green-500"></div>
                <h4 className="font-semibold text-lg">Acordes de {key} Mayor</h4>
                <span className="text-xs text-gray-500">(Diatónicos)</span>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {diatonicChords.inKey.map((chord) => (
                  <button
                    key={`${chord.root}${chord.type}`}
                    type="button"
                    onClick={() => addChord(selectedLine.sectionId, selectedLine.lineId, `${chord.root}${chord.type}`)}
                    className="px-4 py-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all font-mono group"
                  >
                    <div className="font-bold text-lg">{chord.root}{chord.type}</div>
                    <div className="text-xs text-green-700 dark:text-green-400 font-semibold">{chord.degree}</div>
                  </button>
                ))}
              </div>

              {/* Variaciones de acordes diatónicos por categoría */}
              <div className="mt-4 space-y-4">
                <details open>
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Séptimas y Extensiones
                  </summary>
                  <div className="space-y-2">
                    {diatonicChords.inKey.map((chord) => (
                      <div key={`ext-${chord.root}`} className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-12">
                          {chord.root}:
                        </span>
                        {expandedChordTypes
                          .filter(type => ['sevenths', 'ninths', 'elevenths', 'thirteenths', 'sixths'].includes(type.category))
                          .map((type) => (
                            <button
                              key={`${chord.root}${type.value}`}
                              type="button"
                              onClick={() => addChord(selectedLine.sectionId, selectedLine.lineId, `${chord.root}${type.value}`)}
                              className="px-2 py-1 rounded border border-green-400 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-xs font-mono"
                              title={type.label}
                            >
                              {chord.root}{type.value}
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            {/* Poliacordes */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                <h4 className="font-semibold text-lg">Poliacordes</h4>
                <span className="text-xs text-gray-500">(Acordes sobre bajo diferente)</span>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {polyChords.map((poly) => (
                  <button
                    key={poly.value}
                    type="button"
                    onClick={() => addChord(selectedLine.sectionId, selectedLine.lineId, poly.value)}
                    className="px-3 py-2 rounded-lg border-2 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all font-mono text-sm"
                    title={poly.description}
                  >
                    <div className="font-bold">{poly.label}</div>
                  </button>
                ))}
              </div>
              
              {/* Constructor de poliacordes personalizado */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Crear Poliacorde Personalizado
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Formato: Acorde/Bajo (ejemplo: Cmaj7/E, Dm7/G)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: Cmaj7/E"
                    className="flex-1 px-3 py-2 rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget
                        if (input.value.trim()) {
                          addChord(selectedLine.sectionId, selectedLine.lineId, input.value.trim())
                          input.value = ''
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      if (input.value.trim()) {
                        addChord(selectedLine.sectionId, selectedLine.lineId, input.value.trim())
                        input.value = ''
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Acordes No Diatónicos (Fuera de la tonalidad) */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-orange-500"></div>
                <h4 className="font-semibold text-lg">Otros Acordes</h4>
                <span className="text-xs text-gray-500">(Todos los tonos - Modulación / Intercambio Modal)</span>
              </div>
              
              <div className="space-y-4">
                {CHORD_ROOTS.map((root) => (
                  <details key={root}>
                    <summary className="cursor-pointer font-semibold mb-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded ${
                        diatonicChords.inKey.some(c => c.root === root)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      }`}>
                        {root}
                      </span>
                      {diatonicChords.inKey.some(c => c.root === root) && (
                        <span className="text-xs text-green-600 dark:text-green-400">(En tonalidad)</span>
                      )}
                      - Ver todos los tipos
                    </summary>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-2">
                      {expandedChordTypes.map((type) => (
                        <button
                          key={`${root}${type.value}`}
                          type="button"
                          onClick={() => addChord(selectedLine.sectionId, selectedLine.lineId, `${root}${type.value}`)}
                          className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500 transition-all font-mono text-xs"
                          title={type.label}
                        >
                          <div className="font-bold">{root}{type.value}</div>
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
