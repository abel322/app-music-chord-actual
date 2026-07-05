// Parser de acordes musicales
export const CHORDS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
]

export const CHORD_REGEX = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9])*)\b/g

export function parseChords(text: string): string[] {
  const matches = text.match(CHORD_REGEX)
  return matches ? Array.from(new Set(matches)) : []
}

export function detectKey(chords: string[]): string {
  // Detectar tonalidad basada en acordes más comunes
  const rootNotes = chords.map(chord => chord.match(/^[A-G][#b]?/)?.[0] || '')
  const frequency = rootNotes.reduce((acc, note) => {
    acc[note] = (acc[note] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const mostCommon = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]
  return mostCommon ? mostCommon[0] : 'C'
}
