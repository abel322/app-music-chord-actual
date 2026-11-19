import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { LyricsEditor } from '@/components/lyrics/LyricsEditor'
import { ensureRepertoiresTables } from '@/lib/db/ensureRepertoiresTables'

interface SongLyricsDetailPageProps {
  params: {
    id: string
  }
  searchParams?: {
    repertoireId?: string
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

export default async function SongLyricsDetailPage({ params, searchParams }: SongLyricsDetailPageProps) {
  const song = await prisma.song.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!song) {
    notFound()
  }

  let repertoireContext = null
  const repertoireId = searchParams?.repertoireId
  if (repertoireId) {
    try {
      await ensureRepertoiresTables()
      const rep = await prisma.repertoire.findUnique({
        where: { id: repertoireId },
        include: {
          songs: {
            orderBy: { order: 'asc' },
            include: {
              song: {
                select: {
                  id: true,
                  title: true,
                  artist: true,
                  key: true,
                },
              },
            },
          },
        },
      })

      if (rep) {
        repertoireContext = {
          id: rep.id,
          name: rep.name,
          color: rep.color,
          songs: rep.songs.map((rs) => ({
            songId: rs.songId,
            order: rs.order,
            title: rs.song.title,
            artist: rs.song.artist,
            key: rs.song.key,
          })),
        }
      }
    } catch (err) {
      console.error('Error fetching repertoire context in lyrics detail:', err)
    }
  }

  // Serializar fechas para Client Component
  const serializedSong = {
    ...song,
    createdAt: song.createdAt instanceof Date ? song.createdAt.toISOString() : (song.createdAt || new Date().toISOString()),
    updatedAt: song.updatedAt instanceof Date ? song.updatedAt.toISOString() : (song.updatedAt || new Date().toISOString()),
  }

  return <LyricsEditor song={serializedSong} repertoireContext={repertoireContext} />
}
