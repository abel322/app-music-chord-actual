import { prisma } from '@/lib/prisma'
import { ChordsClient } from './chords-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Canciones - Acordes | MusicChord',
  description: 'Gestión y catálogo de canciones enfocado en acordes, tonalidades y armonía musical.',
}

export default async function SongsChordsPage() {
  let songs: any[] = []
  try {
    songs = await prisma.song.findMany({
      orderBy: { updatedAt: 'desc' },
    })
  } catch (e) {
    console.error('Error fetching songs for chords page:', e)
  }

  // Serializar fechas para el Client Component
  const serializedSongs = songs.map((s) => ({
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : (s.createdAt || new Date().toISOString()),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : (s.updatedAt || new Date().toISOString()),
  }))

  return <ChordsClient initialSongs={serializedSongs} />
}
