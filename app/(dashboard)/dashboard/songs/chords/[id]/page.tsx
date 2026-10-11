import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ChordLeadSheet } from '@/components/chords/ChordLeadSheet'

interface SongChordsDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SongChordsDetailPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { title: 'Acordes | MusicChord' }

  const song = await prisma.song.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { title: true, artist: true },
  })

  return {
    title: song ? `${song.title} - Acordes (Lead Sheet) | MusicChord` : 'Acordes | MusicChord',
    description: 'Lead Sheet y estructura de compases armónicos para músicos.',
  }
}

export default async function SongChordsDetailPage({ params }: SongChordsDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const song = await prisma.song.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  })

  if (!song) {
    notFound()
  }

  // Serializar fechas y Json para Client Component
  const serializedSong = {
    ...song,
    createdAt: song.createdAt.toISOString(),
    updatedAt: song.updatedAt.toISOString(),
  }

  return <ChordLeadSheet song={serializedSong} />
}
