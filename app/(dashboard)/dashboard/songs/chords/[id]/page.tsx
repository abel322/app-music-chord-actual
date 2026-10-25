import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ChordLeadSheet } from '@/components/chords/ChordLeadSheet'

interface SongChordsDetailPageProps {
  params: {
    id: string
  }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: SongChordsDetailPageProps) {
  try {
    const song = await prisma.song.findUnique({
      where: { id: params.id },
      select: { title: true, artist: true },
    })

    return {
      title: song ? `${song.title} - Acordes (Lead Sheet) | MusicChord` : 'Acordes | MusicChord',
      description: 'Lead Sheet y estructura de compases armónicos para músicos.',
    }
  } catch {
    return { title: 'Acordes | MusicChord' }
  }
}

export default async function SongChordsDetailPage({ params }: SongChordsDetailPageProps) {
  const song = await prisma.song.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!song) {
    notFound()
  }

  // Serializar fechas y Json para Client Component
  const serializedSong = {
    ...song,
    createdAt: song.createdAt instanceof Date ? song.createdAt.toISOString() : (song.createdAt || new Date().toISOString()),
    updatedAt: song.updatedAt instanceof Date ? song.updatedAt.toISOString() : (song.updatedAt || new Date().toISOString()),
  }

  return (
    <div className="w-full max-w-full min-h-screen">
      <ChordLeadSheet song={serializedSong} />
    </div>
  )
}
