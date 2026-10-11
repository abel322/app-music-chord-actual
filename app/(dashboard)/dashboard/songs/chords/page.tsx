import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ChordsClient } from './chords-client'

export const metadata = {
  title: 'Canciones - Acordes | MusicChord',
  description: 'Gestión y catálogo de canciones enfocado en acordes, tonalidades y armonía musical.',
}

export default async function SongsChordsPage() {
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

  return <ChordsClient initialSongs={serializedSongs} />
}
