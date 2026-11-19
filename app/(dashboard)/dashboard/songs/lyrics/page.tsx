import { prisma } from '@/lib/prisma'
import { LyricsClient } from './lyrics-client'
import { ensureRepertoiresTables } from '@/lib/db/ensureRepertoiresTables'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Canciones - Letras | MusicChord',
  description: 'Gestión y visualización de canciones enfocado en texto, versos y contenido lírico.',
}

export default async function SongsLyricsPage() {
  let songs: any[] = []
  let repertoires: any[] = []

  // 1. Cargar canciones de forma independiente
  try {
    songs = await prisma.song.findMany({
      orderBy: { updatedAt: 'desc' },
    })
  } catch (e) {
    console.error('Error fetching songs for lyrics page:', e)
  }

  // 2. Cargar repertorios asegurando que las tablas existan en PostgreSQL
  try {
    await ensureRepertoiresTables()
    repertoires = await prisma.repertoire.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        songs: {
          orderBy: { order: 'asc' },
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                key: true,
                tempo: true,
                timeSignature: true,
                youtubeUrl: true,
                isFavorite: true,
              },
            },
          },
        },
      },
    })
  } catch (e) {
    console.error('Error fetching repertoires for lyrics page:', e)
  }

  // Serializar fechas para el Client Component
  const serializedSongs = songs.map((s) => ({
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : (s.createdAt || new Date().toISOString()),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : (s.updatedAt || new Date().toISOString()),
  }))

  const serializedRepertoires = repertoires.map((r) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt || new Date().toISOString()),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : (r.updatedAt || new Date().toISOString()),
    eventDate: r.eventDate instanceof Date ? r.eventDate.toISOString() : (r.eventDate || null),
  }))

  return <LyricsClient initialSongs={serializedSongs} initialRepertoires={serializedRepertoires} />
}
