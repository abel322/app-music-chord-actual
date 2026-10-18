import { prisma } from '@/lib/prisma'
import { LyricsClient } from './lyrics-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Canciones - Letras | MusicChord',
  description: 'Gestión y visualización de canciones enfocado en texto, versos y contenido lírico.',
}

export default async function SongsLyricsPage() {
  let songs: any[] = []
  try {
    songs = await prisma.song.findMany({
      orderBy: { updatedAt: 'desc' },
    })
  } catch (e) {
    console.error('Error fetching songs for lyrics page:', e)
  }

  // Serializar fechas para el Client Component
  const serializedSongs = songs.map((s) => ({
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : (s.createdAt || new Date().toISOString()),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : (s.updatedAt || new Date().toISOString()),
  }))

  return <LyricsClient initialSongs={serializedSongs} />
}
