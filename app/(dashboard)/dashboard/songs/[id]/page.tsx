import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { SongEditor } from '@/components/songs/song-editor'

export default async function SongPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  const song = await prisma.song.findFirst({
    where: {
      id: params.id,
      userId: session!.user.id,
    },
  })

  if (!song) {
    notFound()
  }

  return <SongEditor song={song} />
}
