// Transposición de acordes
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
}

export function transposeChord(chord: string, semitones: number): string {
  const match = chord.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return chord

  let [, root, suffix] = match
  
  // Convertir bemoles a sostenidos
  if (root in FLAT_TO_SHARP) {
    root = FLAT_TO_SHARP[root]
  }

  const index = NOTES.indexOf(root)
  if (index === -1) return chord

  const newIndex = (index + semitones + 12) % 12
  return NOTES[newIndex] + suffix
}

export function transposeSong(lyrics: string, semitones: number): string {
  return lyrics.replace(/\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9])*)\b/g, 
    (match) => transposeChord(match, semitones)
  )
}

export function getSemitonesBetween(fromKey: string, toKey: string): number {
  const from = NOTES.indexOf(fromKey in FLAT_TO_SHARP ? FLAT_TO_SHARP[fromKey] : fromKey)
  const to = NOTES.indexOf(toKey in FLAT_TO_SHARP ? FLAT_TO_SHARP[toKey] : toKey)
  
  if (from === -1 || to === -1) return 0
  
  return (to - from + 12) % 12
}
