import { z } from 'zod'

/**
 * Lista base predeterminada de instrumentos musicales para el selector de secciones.
 */
export const DEFAULT_PRESET_INSTRUMENTS = [
  'Piano',
  'Guitarra Eléctrica',
  'Guitarra Acústica',
  'Bajo',
  'Batería',
  'Synth',
  'Pad',
  'Pluck',
  'Cuerdas',
  'Voz Lead',
  'Coros',
] as const

export type PresetInstrument = (typeof DEFAULT_PRESET_INSTRUMENTS)[number]

/**
 * Esquema para la posición de un acorde en una línea lírica.
 */
export const ChordPositionSchema = z.object({
  id: z.string(),
  chord: z.string(),
  position: z.number().default(0),
})

/**
 * Esquema para una línea de letra con sus acordes asociados.
 */
export const LineSchema = z.object({
  id: z.string(),
  lyrics: z.string().default(''),
  chords: z.array(ChordPositionSchema).default([]),
})

/**
 * Tipos de sección comunes en estructuras de canciones.
 */
export const SectionTypeSchema = z.enum([
  'intro',
  'verse',
  'prechorus',
  'chorus',
  'bridge',
  'instrumental',
  'solo',
  'outro',
]).or(z.string())

/**
 * Esquema Zod de una Sección con soporte de lista de instrumentos (chips).
 * Cada sección preserva su propio array de instrumentos: string[].
 */
export const SectionSchema = z.object({
  id: z.string(),
  type: SectionTypeSchema,
  label: z.string(),
  /**
   * Etiquetas de instrumentos asignados específicamente a esta sección.
   * Ej: ['Piano', 'Pad', 'Voz Lead']
   */
  instruments: z.array(z.string()).default([]),
  timeSignature: z.string().optional(),
  lines: z.array(LineSchema).default([]),
})

/**
 * Esquema para crear o actualizar una canción en la base de datos PostgreSQL con Prisma.
 */
export const SongInputSchema = z.object({
  title: z.string().min(1, 'El título de la canción es obligatorio'),
  artist: z.string().optional().nullable().default(''),
  lyrics: z.string().optional().nullable().default(''),
  content: z.string().optional().nullable().default(''),
  key: z.string().optional().nullable().default('C'),
  timeSignature: z.string().optional().nullable().default('4/4'),
  tempo: z.coerce.number().optional().nullable().default(120),
  youtubeUrl: z.string().optional().nullable().default(''),
  genre: z.string().optional().nullable(),
  instruments: z.array(z.string()).optional().nullable().default([]), // Instrumentos globales
  sections: z.array(SectionSchema).optional().nullable().default([]), // Secciones con instrumentos por sección
  chords: z.any().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
})

/**
 * Esquema parcial para actualizaciones vía PUT/PATCH.
 */
export const UpdateSongSchema = SongInputSchema.partial()

// Tipos TypeScript inferidos directamente de Zod
export type ChordPosition = z.infer<typeof ChordPositionSchema>
export type Line = z.infer<typeof LineSchema>
export type Section = z.infer<typeof SectionSchema>
export type SectionType = z.infer<typeof SectionTypeSchema>
export type SongInput = z.infer<typeof SongInputSchema>
export type UpdateSongInput = z.infer<typeof UpdateSongSchema>

/**
 * Sanitiza y valida un nombre de instrumento ingresado por el usuario.
 */
export function sanitizeInstrumentName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * Comprueba si un instrumento ya existe en una lista ignorando mayúsculas/minúsculas.
 */
export function isInstrumentDuplicate(list: string[], candidate: string): boolean {
  const normalizedCandidate = candidate.trim().toLowerCase()
  return list.some(item => item.trim().toLowerCase() === normalizedCandidate)
}
