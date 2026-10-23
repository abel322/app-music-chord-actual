import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUserId, isServerAdmin, verifyAdminRequest } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Autorización: verificar admin por cookie HMAC o session
    const isAuthorized = (await isServerAdmin()) || verifyAdminRequest(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let userId: string
    try {
      userId = await getAdminUserId()
    } catch {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const { targetWeekStart: targetWeekInput } = body

    // 1. Manejo seguro de fecha destino (Lunes de la semana target)
    let targetStart: Date
    if (targetWeekInput) {
      targetStart = new Date(targetWeekInput)
      if (isNaN(targetStart.getTime())) {
        targetStart = new Date()
      }
    } else {
      targetStart = new Date()
    }

    const day = targetStart.getDay()
    const diff = targetStart.getDate() - day + (day === 0 ? -6 : 1)
    targetStart = new Date(targetStart)
    targetStart.setDate(diff)
    targetStart.setHours(0, 0, 0, 0)

    const targetEnd = new Date(targetStart)
    targetEnd.setDate(targetEnd.getDate() + 7)

    // 2. Calcula la fecha de 7 días antes (previousWeekStart)
    const previousWeekStart = new Date(targetStart)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    previousWeekStart.setHours(0, 0, 0, 0)
    const previousWeekEnd = new Date(targetStart)

    // 3. Busca las rutinas existentes de la semana previa (utilizando SOLO columnas físicas existentes)
    let sourceSessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: previousWeekStart,
          lt: previousWeekEnd,
        },
      },
      select: {
        id: true,
        instrument: true,
        duration: true,
        book: true,
        exerciseType: true,
        scheduledAt: true,
        completed: true,
      },
      orderBy: { scheduledAt: 'asc' },
    })

    // Si la semana inmediatamente previa no tenía rutinas, buscar la semana más reciente previa que sí tenga
    if (sourceSessions.length === 0) {
      const latestPriorSession = await prisma.practiceSession.findFirst({
        where: {
          userId,
          scheduledAt: { lt: targetStart },
        },
        select: {
          scheduledAt: true,
        },
        orderBy: { scheduledAt: 'desc' },
      })

      if (latestPriorSession) {
        const d = new Date(latestPriorSession.scheduledAt)
        const dDay = d.getDay()
        const dDiff = d.getDate() - dDay + (dDay === 0 ? -6 : 1)
        const lStart = new Date(d)
        lStart.setDate(dDiff)
        lStart.setHours(0, 0, 0, 0)
        const lEnd = new Date(lStart)
        lEnd.setDate(lEnd.getDate() + 7)

        sourceSessions = await prisma.practiceSession.findMany({
          where: {
            userId,
            scheduledAt: {
              gte: lStart,
              lt: lEnd,
            },
          },
          select: {
            id: true,
            instrument: true,
            duration: true,
            book: true,
            exerciseType: true,
            scheduledAt: true,
            completed: true,
          },
          orderBy: { scheduledAt: 'asc' },
        })
      }
    }

    if (sourceSessions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No hay rutinas previas registradas para clonar.',
        count: 0,
        newSessions: [],
      })
    }

    // 4. Mapear rutinas base únicas (instrument, book, exerciseType, duration)
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

    // Evitar duplicar rutinas que ya existan en la semana destino
    const existingTargetSessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: targetStart,
          lt: targetEnd,
        },
      },
      select: {
        id: true,
        instrument: true,
        book: true,
        exerciseType: true,
      },
    })

    const existingTargetKeys = new Set(
      existingTargetSessions.map(s => `${s.instrument}:::${s.book || ''}:::${s.exerciseType || ''}`)
    )

    const routinesToCreate = Array.from(uniqueBases.values()).filter(
      b => !existingTargetKeys.has(`${b.instrument}:::${b.book || ''}:::${b.exerciseType || ''}`)
    )

    if (routinesToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todas las rutinas de la semana anterior ya existen en esta semana.',
        count: 0,
        newSessions: existingTargetSessions,
      })
    }

    // Fechas de los 7 días de la semana destino (Lunes a Domingo a las 12:00)
    const targetDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(targetStart)
      d.setDate(d.getDate() + i)
      d.setHours(12, 0, 0, 0)
      return d
    })

    // 5. Insertar registros con completed: false y ÚNICAMENTE campos físicos existentes
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
      data: newRecords,
    })

    // 6. Revalidar ruta
    revalidatePath('/dashboard/routines')

    const allUpdatedSessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: targetStart,
          lt: targetEnd,
        },
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
      orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      message: `¡Se clonaron ${routinesToCreate.length} rutinas con éxito!`,
      count: routinesToCreate.length,
      newSessions: allUpdatedSessions,
    })
  } catch (error: any) {
    console.error('Error en API clone-previous-week:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno al clonar rutinas' },
      { status: 500 }
    )
  }
}
