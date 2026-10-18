import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { LyricsEditor } from '@/components/lyrics/LyricsEditor'

interface SongLyricsDetailPageProps {
  params: {
    id: string
  }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: SongLyricsDetailPageProps) {
  try {
    const song = await prisma.song.findUnique({
      where: { id: params.id },
      select: { title: true, artist: true },
    })

    return {
      title: song ? `${song.title} - Letras (Teleprompter) | MusicChord` : 'Letras | MusicChord',
      description: 'Visor y editor de letras, versos y teleprompter para cantantes.',
    }
  } catch {
    return { title: 'Letras | MusicChord' }
  }
}

export default async function SongLyricsDetailPage({ params }: SongLyricsDetailPageProps) {
  const song = await prisma.song.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!song) {
    notFound()
  }

  // Serializar fechas para Client Component
  const serializedSong = {
    ...song,
    createdAt: song.createdAt instanceof Date ? song.createdAt.toISOString() : (song.createdAt || new Date().toISOString()),
    updatedAt: song.updatedAt instanceof Date ? song.updatedAt.toISOString() : (song.updatedAt || new Date().toISOString()),
  }

  return <LyricsEditor song={serializedSong} />
}
