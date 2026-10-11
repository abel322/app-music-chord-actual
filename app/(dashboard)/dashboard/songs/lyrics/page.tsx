import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { LyricsClient } from './lyrics-client'

export const metadata = {
  title: 'Canciones - Letras | MusicChord',
  description: 'Gestión y visualización de canciones enfocado en texto, versos y contenido lírico.',
}

export default async function SongsLyricsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const songs = await prisma.song.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  // Serializar fechas para el Client Component
  const serializedSongs = songs.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return <LyricsClient initialSongs={serializedSongs} />
}
