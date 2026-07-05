'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Trash2, ChevronUp, ChevronDown, Music } from 'lucide-react'
import { transposeChord } from '@/lib/transpose'
import { getChordDegree, isChordInKey } from '@/lib/music-theory'

interface Song {
  id: string
  title: string
  artist: string | null
  key: string
  content: string
  lyrics?: string | null
  timeSignature?: string | null
  tempo?: number | null
}

interface ParsedSection {
  type: string
  label: string
  timeSignature?: string
  lines: Array<{
    chords: string[]
    lyrics: string
  }>
}

export function SongEditor({ song }: { song: Song }) {
  const router = useRouter()
  const [title, setTitle] = useState(song.title)
  const [artist, setArtist] = useState(song.artist || '')
  const [key, setKey] = useState(song.key)
  const [content, setContent] = useState(song.content)
  const [isLoading, setIsLoading] = useState(false)
  const [transpose, setTranspose] = useState(0)
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured')

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  // Parsear el contenido estructurado
  const parseContent = (text: string): ParsedSection[] => {
    const sections: ParsedSection[] = []
    const lines = text.split('\n')
    let currentSection: ParsedSection | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      const sectionMatch = line.match(/^\[([^\]]+)\](?:\s*\(([^)]+)\))?/)
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          type: sectionMatch[1].toLowerCase(),
          label: sectionMatch[1],
          timeSignature: sectionMatch[2],
          lines: []
        }
        continue
      }

      if (!currentSection) continue

      const chordPattern = /[A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M)?(?:[0-9]+)?(?:[#b][0-9]+)*(?:\/[A-G][#b]?)?/g
      const chords = line.match(chordPattern)
      
      const wordsInLine = line.split(/\s+/).filter(w => w.trim())
      const isChordLine = chords && chords.length > 0 && (
        line.length < 100 || 
        chords.length === wordsInLine.length ||
        chords.length / wordsInLine.length > 0.5
      )
      
      if (isChordLine) {
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
        const nextLineChords = nextLine.match(chordPattern)
        const nextLineWords = nextLine.split(/\s+/).filter(w => w.trim())
        const isNextLineChords = nextLineChords && nextLineChords.length > 0 && (
          nextLine.length < 100 ||
          nextLineChords.length === nextLineWords.length ||
          nextLineChords.length / nextLineWords.length > 0.5
        )
        
        currentSection.lines.push({
          chords: chords,
          lyrics: !isNextLineChords && nextLine ? nextLine : ''
        })
        
        if (!isNextLineChords && nextLine) {
          i++
        }
      } else if (line) {
        currentSection.lines.push({
          chords: [],
          lyrics: line
        })
      }
    }

    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }

  const parsedSectionsInit = parseContent(song.content)
  const lyricsFromContent = parsedSectionsInit.map(section => {
    const sectionTitle = `[${section.label}]`
    const sectionLyrics = section.lines.map((l: { chords: string[]; lyrics: string }) => l.lyrics).filter(Boolean).join('\n')
    return sectionLyrics ? `${sectionTitle}\n${sectionLyrics}` : ''
  }).filter(Boolean).join('\n\n')

  // Valores que consideramos "vacíos" (fallbacks o sin información real)
  const EMPTY_LYRICS_VALUES = ['Sin letra', '', 'sin letra']
  const storedLyricsIsReal = song.lyrics
    && song.lyrics !== song.content
    && song.lyrics.trim()
    && !EMPTY_LYRICS_VALUES.includes(song.lyrics.trim())

  const initialLyrics = storedLyricsIsReal ? song.lyrics! : lyricsFromContent

  const [lyrics, setLyrics] = useState(initialLyrics)


  // Función para verificar si una palabra es realmente un acorde
  const isChord = (word: string): boolean => {
    if (!/^[A-G]/.test(word)) return false
    const validChordPattern = /^[A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M)?(?:[0-9]+)?(?:[#b][0-9]+)*(?:\/[A-G][#b]?)?$/
    return validChordPattern.test(word)
  }

  // Función para transponer todo el contenido
  const transposeContent = (text: string, semitones: number): string => {
    if (semitones === 0) return text

    const lines = text.split('\n')
    const transposedLines = lines.map(line => {
      // No transponer líneas que son encabezados de sección
      if (line.trim().match(/^\[([^\]]+)\]/)) {
        return line
      }

      if (!line.trim()) return line

      const words = line.split(/(\s+)/)
      const transposedWords = words.map(word => {
        const trimmed = word.trim()
        if (!trimmed || /^\s+$/.test(word)) return word
        
        if (isChord(trimmed)) {
          if (trimmed.includes('/')) {
            const [upperChord, bassNote] = trimmed.split('/')
            const transposedUpper = transposeChord(upperChord, semitones)
            const transposedBass = transposeChord(bassNote, semitones)
            return word.replace(trimmed, `${transposedUpper}/${transposedBass}`)
          }
          return word.replace(trimmed, transposeChord(trimmed, semitones))
        }
        return word
      })

      return transposedWords.join('')
    })

    return transposedLines.join('\n')
  }

  // Manejar cambio de tonalidad
  const handleKeyChange = (newKey: string) => {
    if (key === newKey) return

    // Calcular semitonos de diferencia
    const oldKeyIndex = keys.indexOf(key)
    const newKeyIndex = keys.indexOf(newKey)
    const semitones = (newKeyIndex - oldKeyIndex + 12) % 12

    const transposedContent = transposeContent(content, semitones)
    setContent(transposedContent)
    setKey(newKey)
  }

  const parsedSections = parseContent(content)

  // Extraer letras de nuevo si cambia el contenido general ('content' principal)
  // Pero lo mantendremos como estado independiente para que sea editable.
  // const currentLyricsExtract = parsedSections.map(...).join('\n\n')

  // Transponer acordes (incluyendo poliacordes)
  const transposeChordWithSemitones = (chord: string, semitones: number) => {
    if (semitones === 0) return chord
    
    // Manejar poliacordes (ej: D/F#)
    if (chord.includes('/')) {
      const [upperChord, bassNote] = chord.split('/')
      const transposedUpper = transposeChord(upperChord, semitones)
      const transposedBass = transposeChord(bassNote, semitones)
      return `${transposedUpper}/${transposedBass}`
    }
    
    return transposeChord(chord, semitones)
  }

  // Analizar función armónica del acorde
  const analyzeChord = (chord: string, nextChord?: string) => {
    // Manejar poliacordes (ej: D/F#, Cmaj7/E)
    const polyChordMatch = chord.match(/^([A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M)?(?:[0-9]+)?(?:[#b][0-9]+)*)\/([A-G][#b]?)$/)
    
    if (polyChordMatch) {
      // Es un poliacorde - analizar la parte superior para determinar función
      const [, upperChord, bassNote] = polyChordMatch
      const match = upperChord.match(/^([A-G][#b]?)(.*)$/)
      if (!match) return { root: '', type: '', degree: null, isInKey: false, function: 'polychord' }
      
      const [, root, type] = match
      const degree = getChordDegree(root, type, key)
      const inKey = isChordInKey(root, type, key)
      
      let harmonicFunction = 'polychord-secondary-dominant' // Por defecto, poliacordes no diatónicos son dominantes secundarios
      
      // Si es diatónico, mantenerlo como diatónico
      if (inKey) {
        harmonicFunction = 'polychord-diatonic'
      }
      // Analizar si tiene otra función armónica específica
      else if (nextChord) {
        const nextMatch = nextChord.match(/^([A-G][#b]?)/)
        if (nextMatch) {
          const [, nextRoot] = nextMatch
          const currentIndex = NOTES.indexOf(root)
          const nextIndex = NOTES.indexOf(nextRoot)
          const interval = (nextIndex - currentIndex + 12) % 12
          
          // Si se mueve por semitonos (paso cromático)
          if (interval === 1 || interval === 11) {
            harmonicFunction = 'polychord-passing'
          }
        }
      }
      
      return { 
        root, 
        type, 
        degree: degree ? `${degree}/${bassNote}` : null, 
        isInKey: inKey, 
        function: harmonicFunction 
      }
    }
    
    const match = chord.match(/^([A-G][#b]?)(.*)$/)
    if (!match) return { root: '', type: '', degree: null, isInKey: false, function: 'unknown' }

    const [, root, type] = match
    const degree = getChordDegree(root, type, key)
    const inKey = isChordInKey(root, type, key)

    // Determinar función armónica
    let harmonicFunction = 'chromatic'
    
    if (inKey) {
      harmonicFunction = 'diatonic'
    } else if (degree) {
      // Analizar el siguiente acorde para detectar dominantes secundarias
      if (nextChord) {
        const nextMatch = nextChord.match(/^([A-G][#b]?)(.*)$/)
        if (nextMatch) {
          const [, nextRoot, nextType] = nextMatch
          
          // Calcular la relación entre este acorde y el siguiente
          const currentIndex = NOTES.indexOf(root)
          const nextIndex = NOTES.indexOf(nextRoot)
          const interval = (nextIndex - currentIndex + 12) % 12
          
          // Dominante secundaria: acorde dominante (con 7) que resuelve una quinta abajo (7 semitonos)
          if ((type.includes('7') || type === '') && interval === 7) {
            harmonicFunction = 'secondary-dominant'
          }
          // SubV7: sustituto tritonal del dominante
          else if (type.includes('7') && interval === 1) {
            harmonicFunction = 'tritone-sub'
          }
          // Acorde de paso cromático: se mueve por semitonos
          else if (interval === 1 || interval === 11) {
            harmonicFunction = 'passing'
          }
          // Dominante extendido: cadena de dominantes (II7 -> V7 -> I)
          else if (type.includes('7') && degree && (degree.includes('II') || degree.includes('VI'))) {
            harmonicFunction = 'extended-dominant'
          }
        }
      }
      
      // Si no se detectó con el contexto, analizar por características del acorde
      if (harmonicFunction === 'chromatic') {
        // Acorde napolitano (♭II)
        if (degree === '♭II' || degree === '♭ii') {
          harmonicFunction = 'neapolitan'
        }
        // Acordes prestados del modo menor (intercambio modal)
        else if (degree && (degree.includes('♭III') || degree.includes('♭VI') || degree.includes('♭VII'))) {
          harmonicFunction = 'modal-interchange'
        }
        // Acordes aumentados (generalmente cromáticos)
        else if (type.includes('aug') || type.includes('+')) {
          harmonicFunction = 'augmented'
        }
        // Acordes disminuidos (pueden ser de paso o dominantes disminuidos)
        else if (type.includes('dim') || type.includes('°')) {
          harmonicFunction = 'diminished'
        }
        // Dominante secundaria sin resolución clara
        else if (type.includes('7') && !inKey) {
          harmonicFunction = 'secondary-dominant'
        }
      }
    }

    return { root, type, degree, isInKey: inKey, function: harmonicFunction }
  }

  // Obtener estilo visual según función armónica
  const getChordStyle = (harmonicFunction: string) => {
    switch (harmonicFunction) {
      case 'diatonic':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
      case 'polychord-secondary-dominant':
        // Poliacorde dominante secundario - usar color naranja (dominante)
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-400 dark:border-orange-600'
      case 'polychord-passing':
        // Poliacorde de paso - usar color amarillo
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600'
      case 'polychord-diatonic':
        // Poliacorde diatónico - usar color verde
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-400 dark:border-green-600'
      case 'polychord':
        // Poliacorde genérico - usar color azul
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
      case 'secondary-dominant':
      case 'extended-dominant':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
      case 'passing':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
      case 'modal-interchange':
      case 'neapolitan':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
      case 'tritone-sub':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700'
      case 'diminished':
        return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700'
      case 'augmented':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
      case 'chromatic':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
    }
  }

  // Obtener etiqueta de función
  const getFunctionLabel = (harmonicFunction: string) => {
    switch (harmonicFunction) {
      case 'diatonic':
        return 'Diatónico'
      case 'polychord':
        return 'Poliacorde'
      case 'polychord-diatonic':
        return 'Diatónico'
      case 'polychord-secondary-dominant':
        return 'V/X'
      case 'polychord-passing':
        return 'Paso'
      case 'secondary-dominant':
        return 'V/X'
      case 'extended-dominant':
        return 'Dom. Ext.'
      case 'passing':
        return 'Paso'
      case 'modal-interchange':
        return 'Modal'
      case 'neapolitan':
        return 'Napolitano'
      case 'tritone-sub':
        return 'SubV7'
      case 'diminished':
        return 'Dism.'
      case 'augmented':
        return 'Aum.'
      case 'chromatic':
        return 'Cromático'
      default:
        return ''
    }
  }

  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Primero intentar buscar la letra si no existe
      if ((!lyrics || lyrics.trim() === '') && title && artist) {
        try {
          const lyricsResponse = await fetch('/api/lyrics/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, artist }),
          })
          
          if (lyricsResponse.ok) {
            const lyricsData = await lyricsResponse.json()
            setLyrics(lyricsData.lyrics)
            
            // Guardar con la letra encontrada
            await fetch(`/api/songs/${song.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, artist, key, content, lyrics: lyricsData.lyrics }),
            })
          } else {
            // Guardar sin letra
            await fetch(`/api/songs/${song.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, artist, key, content, lyrics }),
            })
          }
        } catch (error) {
          console.error('Error buscando letra:', error)
          // Guardar sin letra si falla la búsqueda
          await fetch(`/api/songs/${song.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, artist, key, content, lyrics }),
          })
        }
      } else {
        // Ya tiene letra, guardar normalmente
        await fetch(`/api/songs/${song.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, artist, key, content, lyrics }),
        })
      }
      
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta canción?')) return
    
    await fetch(`/api/songs/${song.id}`, { method: 'DELETE' })
    router.push('/dashboard/songs')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/songs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {artist && <p className="text-gray-600 dark:text-gray-400">{artist}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
          <Button variant="gradient" onClick={handleSave} isLoading={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Info Musical */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tonalidad:</span>
            <span className="text-lg font-bold text-blue-600">{key}</span>
          </div>
          {song.timeSignature && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Compás:</span>
              <span className="text-lg font-bold text-purple-600">{song.timeSignature}</span>
            </div>
          )}
          {song.tempo && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tempo:</span>
              <span className="text-lg font-bold text-green-600">{song.tempo} BPM</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-lg">Editor</h2>
            
            <Input
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <Input
              label="Artista"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Tonalidad</label>
              <div className="flex flex-wrap gap-2">
                {keys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeyChange(k)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      key === k
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Al cambiar la tonalidad, todos los acordes se transpondrán automáticamente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contenido</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-lg">Vista Previa</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('structured')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'structured'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Estructurada
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'raw'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Texto
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Transponer:
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTranspose(transpose - 1)}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <span className="text-sm font-mono w-8 text-center">
                  {transpose > 0 ? `+${transpose}` : transpose}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTranspose(transpose + 1)}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {viewMode === 'structured' ? (
              <div className="space-y-4">
                {/* Leyenda de colores */}
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Análisis Armónico:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Diatónico</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-orange-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">V/X (Dom. Sec.)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Paso Cromático</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-violet-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Disminuido</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-purple-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Modal/Napolitano</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Paso Cromático</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-purple-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Modal/Napolitano</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-pink-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">SubV7 (Tritono)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-indigo-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Disminuido</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-cyan-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Aumentado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Cromático</span>
                    </div>
                  </div>
                </div>

                {/* Secciones */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {parsedSections.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Escribe algo en el editor para ver la vista previa...
                  </p>
                ) : (
                  parsedSections.map((section, sectionIdx) => (
                    <div
                      key={sectionIdx}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      {/* Encabezado de sección */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
                        <h3 className="font-bold text-lg text-primary-600">
                          {section.label}
                        </h3>
                        {section.timeSignature && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded">
                            {section.timeSignature}
                          </span>
                        )}
                      </div>

                      {/* Líneas de la sección */}
                      <div className="space-y-3">
                        {section.lines.map((line, lineIdx) => (
                          <div key={lineIdx} className="space-y-1">
                            {/* Acordes */}
                            {line.chords.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {line.chords.map((chord, chordIdx) => {
                                  const transposedChord = transposeChordWithSemitones(chord, transpose)
                                  const nextChord = chordIdx < line.chords.length - 1 
                                    ? transposeChordWithSemitones(line.chords[chordIdx + 1], transpose)
                                    : undefined
                                  const analysis = analyzeChord(transposedChord, nextChord)
                                  const chordStyle = getChordStyle(analysis.function)
                                  const functionLabel = getFunctionLabel(analysis.function)
                                  
                                  return (
                                    <div
                                      key={chordIdx}
                                      className={`inline-flex flex-col items-center px-3 py-2 rounded-lg border ${chordStyle} font-mono transition-all hover:scale-105`}
                                      title={`${functionLabel}${analysis.degree ? ` - ${analysis.degree}` : ''}`}
                                    >
                                      {/* Cifrado funcional (grado) */}
                                      {analysis.degree && (
                                        <span className="text-xs font-semibold opacity-75 mb-0.5">
                                          {analysis.degree}
                                        </span>
                                      )}
                                      {/* Acorde */}
                                      <span className="font-bold text-base">
                                        {transposedChord}
                                      </span>
                                      {/* Etiqueta de función */}
                                      {functionLabel && analysis.function !== 'diatonic' && (
                                        <span className="text-[10px] font-medium opacity-70 mt-0.5">
                                          {functionLabel}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {/* Letra */}
                            {line.lyrics && (
                              <p className="text-gray-700 dark:text-gray-300 pl-1">
                                {line.lyrics}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 min-h-96 font-mono text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {content || 'Escribe algo en el editor...'}
              </div>
            )}
          </div>
        </div>

        {/* Letra de la cancion - Oculto a petición del usuario */}
        {/* <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Letra de la Canción</h2>
              <Button
                variant="secondary"
                size="sm"
                isLoading={isLoading}
                onClick={async () => {
                  if (!title || !artist) {
                    alert("La canción necesita título y artista para buscar la letra")
                    return
                  }
                  setIsLoading(true)
                  try {
                    const res = await fetch("/api/lyrics/search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title, artist }),
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setLyrics(data.lyrics)
                      await fetch(`/api/songs/${song.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title, artist, key, content, lyrics: data.lyrics }),
                      })
                    } else {
                      alert("No se encontró la letra. Verifica el nombre del artista y la canción.")
                    }
                  } catch {
                    alert("Error al buscar")
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                🔍 Buscar Letra
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              {lyrics && lyrics.trim() ? (
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-700 dark:text-gray-300">
                  {lyrics}
                </pre>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-gray-500">No hay letra disponible</p>
                  <p className="text-xs text-gray-400">Haz clic en Buscar Letra para encontrarla automáticamente</p>
                </div>
              )}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}
