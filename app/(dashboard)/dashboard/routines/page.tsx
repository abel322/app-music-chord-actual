import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RoutinesClient } from '@/components/routines/routines-client'
import { CalendarDays } from 'lucide-react'

export const metadata = {
  title: 'Rutinas de Práctica | MusicChord',
  description: 'Gestiona tus sesiones de práctica musical',
}

export default async function RoutinesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect('/login')
  }

  const practiceSessions = await prisma.practiceSession.findMany({
    where: { 
      userId: user.id
    },
    orderBy: { scheduledAt: 'desc' }
  })

  // Format to match the component interfaces
  const formattedSessions = practiceSessions.map(s => ({
    id: s.id,
    instrument: s.instrument,
    duration: s.duration,
    scheduledAt: s.scheduledAt,
    completed: s.completed,
    book: s.book,
    exerciseType: s.exerciseType,
    createdAt: s.createdAt
  }))

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 overflow-x-hidden px-1 sm:px-0">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">Agenda y Programación</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Planifica tus rutinas y haz seguimiento de tu progreso semanal</p>
        </div>
      </div>

      <RoutinesClient sessions={formattedSessions} />
    </div>
  )
}
