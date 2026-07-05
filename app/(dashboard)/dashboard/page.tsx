import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentSongs } from '@/components/dashboard/recent-songs'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  const [totalSongs, recentSongs] = await Promise.all([
    prisma.song.count({ where: { userId: session!.user.id } }),
    prisma.song.findMany({
      where: { userId: session!.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">
          Bienvenido, {session!.user.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tu biblioteca musical en la nube
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats */}
      <DashboardStats totalSongs={totalSongs} />

      {/* Recent Songs */}
      <RecentSongs songs={recentSongs} />
    </div>
  )
}
