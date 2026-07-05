import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Music, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { Song } from '@prisma/client'

export default async function SongsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }
  
  const songs = await prisma.song.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Canciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
        <Link href="/dashboard/songs/new">
          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Canción
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar canciones..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Songs Grid */}
      {songs.length === 0 ? (
        <div className="text-center py-20">
          <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No tienes canciones</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comienza creando tu primera canción
          </p>
          <Link href="/dashboard/songs/new">
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Canción
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {songs.map((song: Song) => (
            <Link
              key={song.id}
              href={`/dashboard/songs/${song.id}`}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {song.key}
                </div>
                {song.isFavorite && (
                  <span className="text-yellow-500">⭐</span>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary-600 transition-colors">
                {song.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {song.artist || 'Sin artista'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
