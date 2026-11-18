import { prisma } from '@/lib/prisma'
import { ChordsClient } from './chords-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Canciones - Acordes | MusicChord',
  description: 'Gestión y catálogo de canciones enfocado en acordes, tonalidades y armonía musical.',
}

export default async function SongsChordsPage() {
  let songs: any[] = []
  let repertoires: any[] = []

  try {
    const [fetchedSongs, fetchedRepertoires] = await Promise.all([
      prisma.song.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.repertoire.findMany({
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
      }),
    ])
    songs = fetchedSongs
    repertoires = fetchedRepertoires
  } catch (e) {
    console.error('Error fetching songs/repertoires for chords page:', e)
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
