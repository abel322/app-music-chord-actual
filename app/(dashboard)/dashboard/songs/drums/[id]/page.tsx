import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DrumLeadSheet } from '@/components/drums/DrumLeadSheet'

interface SongDrumsDetailPageProps {
  params: {
    id: string
  }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: SongDrumsDetailPageProps) {
  try {
    const song = await prisma.song.findUnique({
      where: { id: params.id },
      select: { title: true, artist: true },
    })

    return {
      title: song ? `${song.title} - Batería (Drums) | MusicChord` : 'Batería | MusicChord',
      description: 'Partitura interactiva de batería, grabador cuantizado y conexión Donner USB MIDI.',
    }
  } catch {
    return { title: 'Batería | MusicChord' }
  }
}

export default async function SongDrumsDetailPage({ params }: SongDrumsDetailPageProps) {
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
      <DrumLeadSheet song={serializedSong} />
    </div>
  )
}
