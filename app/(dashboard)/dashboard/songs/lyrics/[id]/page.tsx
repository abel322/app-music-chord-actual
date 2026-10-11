import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { LyricsEditor } from '@/components/lyrics/LyricsEditor'

interface SongLyricsDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SongLyricsDetailPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { title: 'Letras | MusicChord' }

  const song = await prisma.song.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { title: true, artist: true },
  })

  return {
    title: song ? `${song.title} - Letras (Teleprompter) | MusicChord` : 'Letras | MusicChord',
    description: 'Visor y editor de letras, versos y teleprompter para cantantes.',
  }
}

export default async function SongLyricsDetailPage({ params }: SongLyricsDetailPageProps) {
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

  // Serializar fechas para Client Component
  const serializedSong = {
    ...song,
    createdAt: song.createdAt.toISOString(),
    updatedAt: song.updatedAt.toISOString(),
  }

  return <LyricsEditor song={serializedSong} />
}
