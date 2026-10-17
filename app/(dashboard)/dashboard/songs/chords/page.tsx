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

  if (!session && process.env.NODE_ENV !== 'development') {
    redirect('/login')
  }

  let songs: any[] = []
  if (session?.user?.id) {
    try {
      songs = await prisma.song.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
      })
    } catch (e) {
      // Offline fallback
    }
  }

  // Serializar fechas para el Client Component
  const serializedSongs = songs.map((s) => ({
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : (s.createdAt || new Date().toISOString()),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : (s.updatedAt || new Date().toISOString()),
  }))

  return <ChordsClient initialSongs={serializedSongs} />
}
