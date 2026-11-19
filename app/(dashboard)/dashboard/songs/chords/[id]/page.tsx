import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ChordLeadSheet } from '@/components/chords/ChordLeadSheet'
import { ensureRepertoiresTables } from '@/lib/db/ensureRepertoiresTables'

interface SongChordsDetailPageProps {
  params: {
    id: string
  }
  searchParams?: {
    repertoireId?: string
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

export default async function SongChordsDetailPage({ params, searchParams }: SongChordsDetailPageProps) {
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
      console.error('Error fetching repertoire context:', err)
    }
  }

  // Serializar fechas y Json para Client Component
  const serializedSong = {
    ...song,
    createdAt: song.createdAt instanceof Date ? song.createdAt.toISOString() : (song.createdAt || new Date().toISOString()),
    updatedAt: song.updatedAt instanceof Date ? song.updatedAt.toISOString() : (song.updatedAt || new Date().toISOString()),
  }

  return (
    <div className="w-full max-w-full min-h-screen">
      <ChordLeadSheet song={serializedSong} repertoireContext={repertoireContext} />
    </div>
  )
}
