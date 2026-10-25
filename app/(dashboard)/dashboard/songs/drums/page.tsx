import { prisma } from '@/lib/prisma'
import { DrumsClient } from './drums-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Canciones - Batería (Drums) | MusicChord',
  description: 'Gestión y catálogo de canciones enfocado en partituras de percusión, grooves y ritmos para bateristas.',
}

export default async function SongsDrumsPage() {
  let songs: any[] = []
  try {
    songs = await prisma.song.findMany({
      orderBy: { updatedAt: 'desc' },
    })
  } catch (e) {
    console.error('Error fetching songs for drums page:', e)
  }

  // Serializar fechas para el Client Component
  const serializedSongs = songs.map((s) => ({
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : (s.createdAt || new Date().toISOString()),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : (s.updatedAt || new Date().toISOString()),
  }))

  return <DrumsClient initialSongs={serializedSongs} />
}
