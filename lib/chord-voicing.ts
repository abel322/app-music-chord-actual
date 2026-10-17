import { ChordDef, chordProgressions } from './data/chordProgressions'

// Diccionario de voicings afinados a mano extraídos de las progresiones existentes
const PRESET_CHORD_VOICINGS: Record<string, string[]> = {}

// Inicializar el diccionario con todas las progresiones conocidas
chordProgressions.forEach((prog) => {
  prog.chords.forEach((c) => {
    if (!PRESET_CHORD_VOICINGS[c.name]) {
      PRESET_CHORD_VOICINGS[c.name] = c.notes
    }
  })
})

const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const ROOT_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

// Mapeo de sufijos de acordes a intervalos en semitonos
const CHORD_INTERVALS: Array<{ regex: RegExp; intervals: number[] }> = [
  // 13th
  { regex: /^(?:maj13|M13)$/i, intervals: [0, 4, 7, 11, 14, 21] },
  { regex: /^m13$/i, intervals: [0, 3, 7, 10, 14, 21] },
  { regex: /^13(?:b9)$/i, intervals: [0, 4, 10, 13, 21] },
  { regex: /^13$/i, intervals: [0, 4, 10, 14, 21] },

  // 11th
  { regex: /^(?:maj11|M11)$/i, intervals: [0, 4, 7, 11, 14, 17] },
  { regex: /^m11$/i, intervals: [0, 3, 7, 10, 14, 17] },
  { regex: /^7#11$/i, intervals: [0, 4, 7, 10, 18] },
  { regex: /^11$/i, intervals: [0, 7, 10, 14, 17] },

  // 9th
  { regex: /^(?:maj9|M9|\^9)$/i, intervals: [0, 4, 7, 11, 14] },
  { regex: /^(?:m9|min9|-9)$/i, intervals: [0, 3, 7, 10, 14] },
  { regex: /^(?:add9)$/i, intervals: [0, 4, 7, 14] },
  { regex: /^(?:madd9|m\(add9\))$/i, intervals: [0, 3, 7, 14] },
  { regex: /^7b9$/i, intervals: [0, 4, 7, 10, 13] },
  { regex: /^7#9$/i, intervals: [0, 4, 7, 10, 15] },
  { regex: /^9$/i, intervals: [0, 4, 7, 10, 14] },

  // Altered / Specials
  { regex: /^(?:7#5|7aug|aug7|\+7)$/i, intervals: [0, 4, 8, 10] },
  { regex: /^(?:7b5)$/i, intervals: [0, 4, 6, 10] },
  { regex: /^(?:7alt)$/i, intervals: [0, 4, 8, 10, 13] },
  { regex: /^(?:7b13)$/i, intervals: [0, 4, 10, 20] },
  { regex: /^(?:maj7#5)$/i, intervals: [0, 4, 8, 11] },

  // 7th
  { regex: /^(?:maj7|M7|\^7|Δ7|Δ)$/i, intervals: [0, 4, 7, 11] },
  { regex: /^(?:m7|min7|-7)$/i, intervals: [0, 3, 7, 10] },
  { regex: /^(?:m\(maj7\)|mmaj7)$/i, intervals: [0, 3, 7, 11] },
  { regex: /^(?:m7b5|ø7|ø)$/i, intervals: [0, 3, 6, 10] },
  { regex: /^(?:dim7|°7)$/i, intervals: [0, 3, 6, 9] },
  { regex: /^(?:7sus4|7sus)$/i, intervals: [0, 5, 7, 10] },
  { regex: /^7$/i, intervals: [0, 4, 7, 10] },

  // 6th
  { regex: /^6\/9$/i, intervals: [0, 4, 7, 9, 14] },
  { regex: /^m6$/i, intervals: [0, 3, 7, 9] },
  { regex: /^6$/i, intervals: [0, 4, 7, 9] },

  // Suspended
  { regex: /^sus2$/i, intervals: [0, 2, 7] },
  { regex: /^(?:sus4|sus)$/i, intervals: [0, 5, 7] },

  // Basic triads
  { regex: /^(?:dim|°)$/i, intervals: [0, 3, 6] },
  { regex: /^(?:aug|\+)$/i, intervals: [0, 4, 8] },
  { regex: /^(?:m|min|-)$/i, intervals: [0, 3, 7] },
  { regex: /^(?:maj|M)?$/i, intervals: [0, 4, 7] },
]

/**
 * Convierte un nombre de acorde (ej. "Ebmaj9", "G7#5", "Cm9", "Fm9", "Bb13")
 * en un arreglo de notas con octavas listo para el sintetizador (ej. ['Eb3', 'G3', 'Bb3', 'D4', 'F4']).
 */
export function chordNameToNotes(chordName: string): string[] {
  const trimmed = chordName.trim()
  if (!trimmed) return []

  // Si existe predefinido en catálogo con voicing afinado
  if (PRESET_CHORD_VOICINGS[trimmed]) {
    return PRESET_CHORD_VOICINGS[trimmed]
  }

  // Parsear posible slash chord (ej: C/E)
  let mainChord = trimmed
  let bassNote: string | null = null
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    mainChord = parts[0].trim()
    bassNote = parts[1].trim()
  }

  // Extraer fundamental y sufijo
  const match = mainChord.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return []

  const root = match[1]
  const suffix = match[2].trim()

  const rootSemitone = ROOT_TO_SEMITONE[root]
  if (rootSemitone === undefined) return []

  const useFlats = root.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root)
  const noteList = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP

  // Buscar intervalos correspondientes al sufijo
  let intervals = [0, 4, 7] // default mayor
  for (const item of CHORD_INTERVALS) {
    if (item.regex.test(suffix)) {
      intervals = item.intervals
      break
    }
  }

  // Generar notas con octavas (octava base 3 para fundamental)
  const baseOctave = 3
  const notes: string[] = []

  // Si tiene nota de bajo personalizada (Slash Chord)
  if (bassNote && ROOT_TO_SEMITONE[bassNote] !== undefined) {
    const bassSemitone = ROOT_TO_SEMITONE[bassNote]
    const bassName = (bassNote.includes('b') ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[bassSemitone]
    notes.push(`${bassName}2`)
  }

  intervals.forEach((interval, idx) => {
    // Si la fundamental es muy baja o muy alta, adaptamos octava
    const totalSemitones = rootSemitone + interval
    const noteIndex = totalSemitones % 12
    const octaveOffset = Math.floor(totalSemitones / 12)

    let octave = baseOctave + octaveOffset

    // Si es un acorde con bajo y es la primera nota (fundamental), la mantenemos en 3
    // Si la nota sobrepasa ciertos semitonos, la elevamos de forma natural
    if (idx >= 3 && octave === baseOctave) {
      octave += 1
    }

    const noteName = noteList[noteIndex]
    const formatted = `${noteName}${octave}`
    if (!notes.includes(formatted)) {
      notes.push(formatted)
    }
  })

  return notes
}

/**
 * Parsea un string libre de acordes separados por comas, espacios o saltos
 * (ej: "Ebmaj9, G7#5, Cm9, Fm9, Bb13") a una lista de ChordDef válidos.
 */
export function parseChordInput(rawInput: string): ChordDef[] {
  if (!rawInput) return []

  // Dividir por comas, puntos y comas, barras o espacios
  const tokens = rawInput
    .split(/[\s,;|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && /^[A-G]/i.test(t))

  return tokens.map((token) => {
    // Corregir primera letra en mayúscula si es necesario
    const formattedName = token.charAt(0).toUpperCase() + token.slice(1)
    const notes = chordNameToNotes(formattedName)
    return {
      name: formattedName,
      notes,
    }
  })
}
