import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isServerAdmin, getAdminUserId } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/repertoires
 * Devuelve todos los repertorios ordenados por updatedAt desc con sus canciones en orden asc.
 */
export async function GET(req: NextRequest) {
  try {
    const repertoires = await prisma.repertoire.findMany({
      orderBy: { updatedAt: 'desc' },
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
                tempo: true,
                timeSignature: true,
                youtubeUrl: true,
                isFavorite: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      { repertoires },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching repertoires:', error)
    return NextResponse.json({ error: 'Failed to fetch repertoires' }, { status: 500 })
  }
}

/**
 * POST /api/repertoires
 * Crea una nueva carpeta/repertorio con canciones iniciales opcionales.
 */
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isServerAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Prohibido: se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    const adminUserId = await getAdminUserId()
    const body = await req.json()
    const { name, description, color, eventDate, songIds } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del repertorio es obligatorio' }, { status: 400 })
    }

    const repertoire = await prisma.repertoire.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || 'indigo',
        eventDate: eventDate ? new Date(eventDate) : null,
        userId: adminUserId,
        songs: Array.isArray(songIds) && songIds.length > 0
          ? {
              create: songIds.map((songId: string, index: number) => ({
                songId,
                order: index,
              })),
            }
          : undefined,
      },
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
                tempo: true,
                timeSignature: true,
                youtubeUrl: true,
                isFavorite: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ repertoire }, { status: 201 })
  } catch (error) {
    console.error('Error creating repertoire:', error)
    return NextResponse.json({ error: 'Failed to create repertoire' }, { status: 500 })
  }
}
