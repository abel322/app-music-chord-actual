import { prisma } from '@/lib/prisma'
import { getAdminSession, getAdminUserId } from '@/lib/admin-auth'
import { RoutinesClient, RoutinesClientView } from '@/components/routines/routines-client'
import { CalendarDays } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Rutinas de Práctica | MusicChord',
  description: 'Gestiona tus sesiones de práctica musical',
}

function getMondayOfCurrentWeek(baseDate?: Date | string): Date {
  const d = baseDate ? new Date(baseDate) : new Date()
  if (isNaN(d.getTime())) {
    const fallback = new Date()
    const day = fallback.getDay()
    const diff = fallback.getDate() - day + (day === 0 ? -6 : 1)
    fallback.setDate(diff)
    fallback.setHours(0, 0, 0, 0)
    return fallback
  }
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

interface RoutinesPageProps {
  searchParams?: {
    week?: string
  }
}

export default async function RoutinesPage({ searchParams }: RoutinesPageProps) {
  // 1. Verificación de permisos de administrador
  const { isAdmin } = await getAdminSession()
  if (!isAdmin) {
    redirect('/dashboard/songs/chords')
  }

  let practiceSessions: any[] = []
  let currentWeekStart: Date = getMondayOfCurrentWeek()

  try {
    // 1. Manejo seguro de fecha actual (Lunes de la semana activa)
    currentWeekStart = searchParams?.week 
      ? new Date(searchParams.week) 
      : getMondayOfCurrentWeek()

    if (isNaN(currentWeekStart.getTime())) {
      currentWeekStart = getMondayOfCurrentWeek()
    } else {
      currentWeekStart = getMondayOfCurrentWeek(currentWeekStart)
    }

    // 2. Consulta Prisma LIMPIA (consultando ÚNICAMENTE los campos ya existentes en la BD)
    // NO incluir isRecurring ni relaciones que no existan en el schema actual
    let userId: string | null = null
    try {
      userId = await getAdminUserId()
    } catch (err) {
      console.warn("Usuario administrador no encontrado en BD:", err)
    }

    if (userId) {
      practiceSessions = await prisma.practiceSession.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          instrument: true,
          duration: true,
          book: true,
          exerciseType: true,
          scheduledAt: true,
          completed: true,
          createdAt: true,
        },
        orderBy: {
          scheduledAt: 'desc',
        },
      })
    }
  } catch (error) {
    if ((error as any)?.digest?.startsWith?.('NEXT_REDIRECT') || (error as any)?.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error("Error al cargar rutinas:", error)
    practiceSessions = [] // Si la BD falla o no hay datos, entregar array vacío para que renderice la UI vacía y NO colapse
  }

  // Format to match the component interfaces
  const formattedSessions = practiceSessions.map(s => ({
    id: s.id,
    instrument: s.instrument,
    duration: s.duration,
    scheduledAt: s.scheduledAt,
    completed: s.completed,
    book: s.book,
    exerciseType: s.exerciseType,
    isRecurring: true,
    createdAt: s.createdAt,
  }))

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 overflow-x-hidden px-1 sm:px-0">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            Agenda y Programación
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
            Planifica tus rutinas y haz seguimiento de tu progreso semanal
          </p>
        </div>
      </div>

      <RoutinesClientView 
        sessions={formattedSessions} 
        initialRoutines={formattedSessions}
        currentWeek={currentWeekStart.toISOString()} 
      />
    </div>
  )
}
