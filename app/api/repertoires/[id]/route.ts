import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isServerAdmin } from '@/lib/admin-auth'
import { ensureRepertoiresTables } from '@/lib/db/ensureRepertoiresTables'

export const dynamic = 'force-dynamic'

/**
 * GET /api/repertoires/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureRepertoiresTables()

    const repertoire = await prisma.repertoire.findUnique({
      where: { id: params.id },
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

    if (!repertoire) {
      return NextResponse.json({ error: 'Repertorio no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ repertoire })
  } catch (error) {
    console.error('Error fetching repertoire:', error)
    return NextResponse.json({ error: 'Failed to fetch repertoire' }, { status: 500 })
  }
}

/**
 * PATCH /api/repertoires/[id]
 * Permite editar metadatos, agregar canción, quitar canción o reordenar canciones.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await isServerAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Prohibido: se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, color, eventDate, addSongId, removeSongId, orderedSongIds } = body
    const repertoireId = params.id

    await ensureRepertoiresTables()

    const existing = await prisma.repertoire.findUnique({
      where: { id: repertoireId },
      include: { songs: { select: { songId: true, order: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Repertorio no encontrado' }, { status: 404 })
    }

    // 1. Añadir canción si se especificó addSongId
    if (addSongId && typeof addSongId === 'string') {
      const alreadyIn = existing.songs.some((s) => s.songId === addSongId)
      if (!alreadyIn) {
        const maxOrder = existing.songs.length > 0
          ? Math.max(...existing.songs.map((s) => s.order))
          : -1
        await prisma.repertoireSong.create({
          data: {
            repertoireId,
            songId: addSongId,
            order: maxOrder + 1,
          },
        })
      }
    }

    // 2. Quitar canción si se especificó removeSongId
    if (removeSongId && typeof removeSongId === 'string') {
      await prisma.repertoireSong.deleteMany({
        where: {
          repertoireId,
          songId: removeSongId,
        },
      })
    }

    // 3. Reordenar canciones si se especificó orderedSongIds
    if (Array.isArray(orderedSongIds)) {
      await prisma.$transaction(
        orderedSongIds.map((sId: string, idx: number) =>
          prisma.repertoireSong.updateMany({
            where: {
              repertoireId,
              songId: sId,
            },
            data: {
              order: idx,
            },
          })
        )
      )
    }

    // 4. Actualizar metadatos si vienen en el body
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null

    const updated = await prisma.repertoire.update({
      where: { id: repertoireId },
      data: updateData,
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

    return NextResponse.json({ repertoire: updated })
  } catch (error) {
    console.error('Error updating repertoire:', error)
    return NextResponse.json({ error: 'Failed to update repertoire' }, { status: 500 })
  }
}

/**
 * DELETE /api/repertoires/[id]
 * Elimina el repertorio sin borrar las canciones de la biblioteca.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await isServerAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Prohibido: se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    await ensureRepertoiresTables()

    await prisma.repertoire.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting repertoire:', error)
    return NextResponse.json({ error: 'Failed to delete repertoire' }, { status: 500 })
  }
}
