'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { isServerAdmin, getAdminUserId } from '@/lib/admin-auth'

async function getAuthenticatedUserId(): Promise<string> {
  const isAdmin = await isServerAdmin()
  if (isAdmin) {
    return await getAdminUserId()
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado: se requieren permisos de administrador')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  return user.id
}

export async function createPracticeSession(data: { 
  instrument: any; 
  duration: number; 
  scheduledAt: Date; 
  book?: string; 
  exerciseType?: string; 
  completed?: boolean;
  isRecurring?: boolean;
}) {
  const userId = await getAuthenticatedUserId()

  await prisma.practiceSession.create({
    data: {
      userId,
      instrument: data.instrument,
      duration: data.duration,
      book: data.book,
      exerciseType: data.exerciseType,
      scheduledAt: data.scheduledAt,
      completed: data.completed ?? false,
    }
  })

  revalidatePath('/dashboard/routines')
}

export async function togglePracticeSession(id: string, completed: boolean, duration?: number) {
  const userId = await getAuthenticatedUserId()

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id } })
  if (!practiceSession || practiceSession.userId !== userId) throw new Error('No encontrado o no autorizado')

  const updateData: any = { completed }
  if (completed && duration !== undefined) {
    updateData.duration = duration
  }

  await prisma.practiceSession.update({
    where: { id },
    data: updateData
  })

  revalidatePath('/dashboard/routines')
}

export async function deletePracticeSession(id: string) {
  const userId = await getAuthenticatedUserId()

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id } })
  if (!practiceSession || practiceSession.userId !== userId) throw new Error('No encontrado o no autorizado')

  await prisma.practiceSession.delete({
    where: { id }
  })

  revalidatePath('/dashboard/routines')
}

export async function updatePracticeSession(id: string, data: { instrument: any; duration: number; book?: string; exerciseType?: string; isRecurring?: boolean }) {
  const userId = await getAuthenticatedUserId()

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id } })
  if (!practiceSession || practiceSession.userId !== userId) throw new Error('No encontrado o no autorizado')

  await prisma.practiceSession.update({
    where: { id },
    data: {
      instrument: data.instrument,
      duration: data.duration,
      book: data.book,
      exerciseType: data.exerciseType,
    }
  })

  revalidatePath('/dashboard/routines')
}

export async function createWeeklyRoutine(data: { 
  instrument: any; 
  duration: number; 
  startOfWeek: Date; 
  book?: string; 
  exerciseType?: string; 
  isRecurring?: boolean;
}) {
  const userId = await getAuthenticatedUserId()

  // Create a practice session for each of the 7 days of the week starting at startOfWeek
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(data.startOfWeek)
    d.setDate(d.getDate() + i)
    d.setHours(12, 0, 0, 0)
    return d
  })

  await prisma.practiceSession.createMany({
    data: dates.map(date => ({
      userId,
      instrument: data.instrument,
      duration: data.duration,
      book: data.book || null,
      exerciseType: data.exerciseType || null,
      scheduledAt: date,
      completed: false,
    }))
  })

  revalidatePath('/dashboard/routines')
}

export async function updateWeeklyRoutine(ids: string[], data: { 
  instrument: any; 
  duration: number; 
  book?: string; 
  exerciseType?: string; 
  isRecurring?: boolean;
}) {
  const userId = await getAuthenticatedUserId()

  const commonData: any = {
    instrument: data.instrument,
    book: data.book || null,
    exerciseType: data.exerciseType || null,
  }

  // Update uncompleted sessions (duration is updated to the new base/planned duration)
  await prisma.practiceSession.updateMany({
    where: {
      id: { in: ids },
      userId,
      completed: false
    },
    data: {
      ...commonData,
      duration: data.duration,
    }
  })

  // Update completed sessions (retaining their custom recorded duration)
  await prisma.practiceSession.updateMany({
    where: {
      id: { in: ids },
      userId,
      completed: true
    },
    data: commonData
  })

  revalidatePath('/dashboard/routines')
}

export async function deleteWeeklyRoutine(ids: string[]) {
  const userId = await getAuthenticatedUserId()

  await prisma.practiceSession.deleteMany({
    where: {
      id: { in: ids },
      userId
    }
  })

  revalidatePath('/dashboard/routines')
}

/**
 * Clona todas las rutinas base de la semana anterior (o de la semana más reciente con rutinas)
 * en la semana objetivo con todos los días desmarcados (completed: false).
 */
export async function clonePreviousWeekRoutines(
  targetStartOfWeekInput: Date | string,
  sourceStartOfWeekInput?: Date | string
) {
  const userId = await getAuthenticatedUserId()

  const targetStart = new Date(targetStartOfWeekInput)
  targetStart.setHours(0, 0, 0, 0)
  const targetEnd = new Date(targetStart)
  targetEnd.setDate(targetEnd.getDate() + 7)

  let sourceStart: Date
  let sourceEnd: Date

  if (sourceStartOfWeekInput) {
    sourceStart = new Date(sourceStartOfWeekInput)
    sourceStart.setHours(0, 0, 0, 0)
    sourceEnd = new Date(sourceStart)
    sourceEnd.setDate(sourceEnd.getDate() + 7)
  } else {
    // Semana inmediatamente anterior: target - 7 días
    sourceStart = new Date(targetStart)
    sourceStart.setDate(sourceStart.getDate() - 7)
    sourceEnd = new Date(targetStart)
  }

  // Buscar sesiones de la semana origen
  let sourceSessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: sourceStart,
        lt: sourceEnd
      }
    },
    orderBy: { scheduledAt: 'asc' }
  })

  // Si la semana inmediatamente previa no tenía rutinas, buscar la semana más reciente previa que sí tenga
  if (sourceSessions.length === 0) {
    const latestPriorSession = await prisma.practiceSession.findFirst({
      where: {
        userId,
        scheduledAt: { lt: targetStart }
      },
      orderBy: { scheduledAt: 'desc' }
    })

    if (latestPriorSession) {
      const d = new Date(latestPriorSession.scheduledAt)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      sourceStart = new Date(d)
      sourceStart.setDate(diff)
      sourceStart.setHours(0, 0, 0, 0)
      sourceEnd = new Date(sourceStart)
      sourceEnd.setDate(sourceEnd.getDate() + 7)

      sourceSessions = await prisma.practiceSession.findMany({
        where: {
          userId,
          scheduledAt: {
            gte: sourceStart,
            lt: sourceEnd
          }
        },
        orderBy: { scheduledAt: 'asc' }
      })
    }
  }

  if (sourceSessions.length === 0) {
    return {
      success: false,
      message: 'No hay rutinas previas registradas para clonar.',
      count: 0,
      newSessions: []
    }
  }

  // Agrupar rutinas base únicas de la semana origen
  const uniqueBases = new Map<string, {
    instrument: any
    duration: number
    book: string | null
    exerciseType: string | null
  }>()

  for (const s of sourceSessions) {
    const key = `${s.instrument}:::${s.book || ''}:::${s.exerciseType || ''}`
    if (!uniqueBases.has(key)) {
      uniqueBases.set(key, {
        instrument: s.instrument,
        duration: s.duration,
        book: s.book,
        exerciseType: s.exerciseType,
      })
    } else {
      // Priorizar la duración planificada (sesión no completada)
      if (!s.completed) {
        const existing = uniqueBases.get(key)!
        existing.duration = s.duration
      }
    }
  }

  // Evitar duplicar rutinas que ya existan en la semana objetivo
  const existingTargetSessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: targetStart,
        lt: targetEnd
      }
    }
  })

  const existingTargetKeys = new Set(
    existingTargetSessions.map(s => `${s.instrument}:::${s.book || ''}:::${s.exerciseType || ''}`)
  )

  const routinesToCreate = Array.from(uniqueBases.values()).filter(
    b => !existingTargetKeys.has(`${b.instrument}:::${b.book || ''}:::${b.exerciseType || ''}`)
  )

  if (routinesToCreate.length === 0) {
    return {
      success: true,
      message: 'Todas las rutinas de la semana anterior ya existen en esta semana.',
      count: 0,
      newSessions: existingTargetSessions
    }
  }

  // Generar las fechas de lunes a domingo para la semana actual
  const targetDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(targetStart)
    d.setDate(d.getDate() + i)
    d.setHours(12, 0, 0, 0)
    return d
  })

  const newRecords: any[] = []
  for (const routine of routinesToCreate) {
    for (const date of targetDates) {
      newRecords.push({
        userId,
        instrument: routine.instrument,
        duration: routine.duration,
        book: routine.book,
        exerciseType: routine.exerciseType,
        scheduledAt: date,
        completed: false,
      })
    }
  }

  await prisma.practiceSession.createMany({
    data: newRecords
  })

  const allUpdatedSessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: targetStart,
        lt: targetEnd
      }
    },
    orderBy: { scheduledAt: 'asc' }
  })

  revalidatePath('/dashboard/routines')

  return {
    success: true,
    message: `¡Se clonaron ${routinesToCreate.length} rutinas con éxito!`,
    count: routinesToCreate.length,
    newSessions: allUpdatedSessions
  }
}

/**
 * Auto-pobla rutinas activas de la semana anterior si la semana objetivo está vacía
 */
export async function autoPopulateRecurringRoutines(targetStartOfWeekInput: Date | string) {
  const userId = await getAuthenticatedUserId()

  const targetStart = new Date(targetStartOfWeekInput)
  targetStart.setHours(0, 0, 0, 0)
  const targetEnd = new Date(targetStart)
  targetEnd.setDate(targetEnd.getDate() + 7)

  // Si la semana ya tiene rutinas, no sobreescribir ni duplicar
  const existingCount = await prisma.practiceSession.count({
    where: {
      userId,
      scheduledAt: {
        gte: targetStart,
        lt: targetEnd
      }
    }
  })

  if (existingCount > 0) {
    return { success: true, autoPopulated: false, count: 0, newSessions: [] }
  }

  // Buscar sesiones de la semana inmediatamente anterior
  const prevWeekStart = new Date(targetStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)

  let sourceSessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: prevWeekStart,
        lt: targetStart
      }
    },
    orderBy: { scheduledAt: 'asc' }
  })

  // Si no hay en la semana anterior exacta, buscar en la última semana previa que tenga sesiones
  if (sourceSessions.length === 0) {
    const latestPrior = await prisma.practiceSession.findFirst({
      where: {
        userId,
        scheduledAt: { lt: targetStart }
      },
      orderBy: { scheduledAt: 'desc' }
    })

    if (latestPrior) {
      const d = new Date(latestPrior.scheduledAt)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const lStart = new Date(d)
      lStart.setDate(diff)
      lStart.setHours(0, 0, 0, 0)
      const lEnd = new Date(lStart)
      lEnd.setDate(lEnd.getDate() + 7)

      sourceSessions = await prisma.practiceSession.findMany({
        where: {
          userId,
          scheduledAt: {
            gte: lStart,
            lt: lEnd
          }
        },
        orderBy: { scheduledAt: 'asc' }
      })
    }
  }

  if (sourceSessions.length === 0) {
    return { success: true, autoPopulated: false, count: 0, newSessions: [] }
  }

  // Agrupar rutinas base únicas
  const uniqueBases = new Map<string, {
    instrument: any
    duration: number
    book: string | null
    exerciseType: string | null
  }>()

  for (const s of sourceSessions) {
    const key = `${s.instrument}:::${s.book || ''}:::${s.exerciseType || ''}`
    if (!uniqueBases.has(key)) {
      uniqueBases.set(key, {
        instrument: s.instrument,
        duration: s.duration,
        book: s.book,
        exerciseType: s.exerciseType,
      })
    } else if (!s.completed) {
      uniqueBases.get(key)!.duration = s.duration
    }
  }

  const targetDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(targetStart)
    d.setDate(d.getDate() + i)
    d.setHours(12, 0, 0, 0)
    return d
  })

  const newRecords: any[] = []
  for (const routine of Array.from(uniqueBases.values())) {
    for (const date of targetDates) {
      newRecords.push({
        userId,
        instrument: routine.instrument,
        duration: routine.duration,
        book: routine.book,
        exerciseType: routine.exerciseType,
        scheduledAt: date,
        completed: false,
      })
    }
  }

  await prisma.practiceSession.createMany({
    data: newRecords
  })

  const newSessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: targetStart,
        lt: targetEnd
      }
    },
    orderBy: { scheduledAt: 'asc' }
  })

  revalidatePath('/dashboard/routines')

  return {
    success: true,
    autoPopulated: true,
    count: uniqueBases.size,
    newSessions
  }
}

/**
 * Consulta los ejercicios más frecuentes agrupados por instrumento según el historial
 */
export async function getFrequentExercises(instrument?: string) {
  const userId = await getAuthenticatedUserId()

  const whereClause: any = { userId }
  if (instrument) {
    whereClause.instrument = instrument
  }

  const sessions = await prisma.practiceSession.findMany({
    where: whereClause,
    select: {
      instrument: true,
      book: true,
      exerciseType: true,
      duration: true,
    }
  })

  // Contar frecuencias
  const counts: Record<string, {
    instrument: string
    book: string
    exerciseType: string
    duration: number
    count: number
  }> = {}

  for (const s of sessions) {
    if (!s.book && !s.exerciseType) continue
    const key = `${s.instrument}|${s.book || ''}|${s.exerciseType || ''}`
    if (!counts[key]) {
      counts[key] = {
        instrument: s.instrument,
        book: s.book || '',
        exerciseType: s.exerciseType || '',
        duration: s.duration,
        count: 0
      }
    }
    counts[key].count += 1
  }

  return Object.values(counts).sort((a, b) => b.count - a.count)
}

