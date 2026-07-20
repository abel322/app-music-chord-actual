'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPracticeSession(data: { 
  instrument: any; 
  duration: number; 
  scheduledAt: Date; 
  book?: string; 
  exerciseType?: string; 
  completed?: boolean;
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  await prisma.practiceSession.create({
    data: {
      userId: user.id,
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

export async function togglePracticeSession(id: string, completed: boolean) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id } })
  if (!practiceSession || practiceSession.userId !== user.id) throw new Error('No encontrado o no autorizado')

  await prisma.practiceSession.update({
    where: { id },
    data: { completed }
  })

  revalidatePath('/dashboard/routines')
}

export async function deletePracticeSession(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id } })
  if (!practiceSession || practiceSession.userId !== user.id) throw new Error('No encontrado o no autorizado')

  await prisma.practiceSession.delete({
    where: { id }
  })

  revalidatePath('/dashboard/routines')
}

export async function updatePracticeSession(id: string, data: { instrument: any; duration: number; book?: string; exerciseType?: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id } })
  if (!practiceSession || practiceSession.userId !== user.id) throw new Error('No encontrado o no autorizado')

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
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  // Create a practice session for each of the 7 days of the week starting at startOfWeek
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(data.startOfWeek)
    d.setDate(d.getDate() + i)
    d.setHours(12, 0, 0, 0)
    return d
  })

  await prisma.practiceSession.createMany({
    data: dates.map(date => ({
      userId: user.id,
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
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  await prisma.practiceSession.updateMany({
    where: {
      id: { in: ids },
      userId: user.id
    },
    data: {
      instrument: data.instrument,
      duration: data.duration,
      book: data.book || null,
      exerciseType: data.exerciseType || null,
    }
  })

  revalidatePath('/dashboard/routines')
}

export async function deleteWeeklyRoutine(ids: string[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) throw new Error('No autorizado')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) throw new Error('Usuario no encontrado')

  await prisma.practiceSession.deleteMany({
    where: {
      id: { in: ids },
      userId: user.id
    }
  })

  revalidatePath('/dashboard/routines')
}
