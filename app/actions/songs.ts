'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  SongInputSchema,
  UpdateSongSchema,
  type SongInput,
  type UpdateSongInput,
} from '@/lib/validations/song'
import { parseChords, detectKey } from '@/lib/chord-parser'

/**
 * Server Action para crear una nueva canción con secciones e instrumentos validados.
 */
export async function createSongAction(rawData: SongInput) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id && !session?.user?.email) {
    throw new Error('No autorizado: debes iniciar sesión')
  }

  // Obtener el ID de usuario desde la sesión o DB
  let userId = session.user.id
  if (!userId && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!dbUser) throw new Error('Usuario no encontrado')
    userId = dbUser.id
  }

  // Validación rigurosa con Zod (asegura que cada sección contenga instruments: string[])
  const data = SongInputSchema.parse(rawData)

  // Generar letras y acordes por defecto si no vienen especificados
  const rawContent = data.content || data.lyrics || ''
  const parsedChords = rawContent ? parseChords(rawContent) : []
  const detectedKey = parsedChords.length > 0 ? detectKey(parsedChords) : 'C'

  const chordsValue = data.chords
    ? typeof data.chords === 'string'
      ? data.chords
      : JSON.stringify(data.chords)
    : JSON.stringify(parsedChords)

  const song = await prisma.song.create({
    data: {
      title: data.title,
      artist: data.artist || '',
      content: data.content || data.lyrics || '',
      lyrics: data.lyrics || '',
      chords: chordsValue,
      key: data.key || detectedKey || 'C',
      timeSignature: data.timeSignature || '4/4',
      tempo: data.tempo ?? 120,
      youtubeUrl: data.youtubeUrl || null,
      genre: data.genre || null,
      instruments: data.instruments ?? [],
      // Persistencia completa del array de secciones con sus respectivos instruments: string[]
      sections: data.sections ?? [],
      tags: data.tags || [],
      isFavorite: data.isFavorite ?? false,
      userId: userId!,
    },
  })

  revalidatePath('/dashboard/songs')
  return { success: true, song }
}

/**
 * Server Action para actualizar una canción existente preservando el array de instrumentos por sección.
 */
export async function updateSongAction(id: string, rawData: UpdateSongInput) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error('No autorizado: sesión requerida')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) throw new Error('Usuario no encontrado')

  // Verificar que la canción pertenezca al usuario
  const existingSong = await prisma.song.findFirst({
    where: { id, userId: user.id },
  })
  if (!existingSong) {
    throw new Error('Canción no encontrada o no tienes permisos para editarla')
  }

  // Validar campos parciales con Zod
  const data = UpdateSongSchema.parse(rawData)

  const updatePayload: Record<string, any> = {}

  if (data.title !== undefined) updatePayload.title = data.title
  if (data.artist !== undefined) updatePayload.artist = data.artist
  if (data.content !== undefined) updatePayload.content = data.content
  if (data.lyrics !== undefined) updatePayload.lyrics = data.lyrics
  if (data.key !== undefined) updatePayload.key = data.key
  if (data.timeSignature !== undefined) updatePayload.timeSignature = data.timeSignature
  if (data.tempo !== undefined) updatePayload.tempo = data.tempo
  if (data.youtubeUrl !== undefined) updatePayload.youtubeUrl = data.youtubeUrl
  if (data.genre !== undefined) updatePayload.genre = data.genre
  if (data.instruments !== undefined) updatePayload.instruments = data.instruments
  // Actualizar secciones garantizando el array de instrumentos
  if (data.sections !== undefined) updatePayload.sections = data.sections
  if (data.tags !== undefined) updatePayload.tags = data.tags
  if (data.isFavorite !== undefined) updatePayload.isFavorite = data.isFavorite

  const updatedSong = await prisma.song.update({
    where: { id },
    data: updatePayload,
  })

  revalidatePath('/dashboard/songs')
  revalidatePath(`/dashboard/songs/${id}`)

  return { success: true, song: updatedSong }
}

/**
 * Server Action para guardar o actualizar (upsert) una canción.
 */
export async function upsertSongAction(payload: SongInput & { id?: string }) {
  if (payload.id) {
    const { id, ...data } = payload
    return updateSongAction(id, data)
  }
  return createSongAction(payload)
}
