import { prisma } from '@/lib/prisma'
import { ChordsClient } from './chords-client'
import { ensureRepertoiresTables } from '@/lib/db/ensureRepertoiresTables'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Canciones - Acordes | MusicChord',
  description: 'Gestión y catálogo de canciones enfocado en acordes, tonalidades y armonía musical.',
}

export default async function SongsChordsPage() {
  let songs: any[] = []
  let repertoires: any[] = []

  // 1. Cargar canciones de forma independiente (Garantiza que NUNCA quede en 0 de 0)
  try {
    songs = await prisma.song.findMany({
      orderBy: { updatedAt: 'desc' },
    })
  } catch (e) {
    console.error('Error fetching songs for chords page:', e)
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
    console.error('Error fetching repertoires for chords page:', e)
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

  return <ChordsClient initialSongs={serializedSongs} initialRepertoires={serializedRepertoires} />
}
