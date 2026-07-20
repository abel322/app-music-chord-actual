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
    <div className="max-w-5xl mx-auto py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Agenda y Programación</h1>
          <p className="text-slate-500 font-medium">Planifica tus rutinas y haz seguimiento de tu progreso semanal</p>
        </div>
      </div>

      <RoutinesClient sessions={formattedSessions} />
    </div>
  )
}
