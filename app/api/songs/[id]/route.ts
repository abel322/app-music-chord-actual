import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { UpdateSongSchema } from '@/lib/validations/song'
import { z } from 'zod'
import { isServerAdmin } from '@/lib/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const song = await prisma.song.findUnique({
      where: { id: params.id },
    })

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    return NextResponse.json({ song })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const validatedData = UpdateSongSchema.parse(body)

    const isAdmin = await isServerAdmin()
    const isTempoOnly = Object.keys(body).length === 1 && 'tempo' in body

    if (!isAdmin && !isTempoOnly) {
      return NextResponse.json(
        { error: 'Prohibido: se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    const song = await prisma.song.update({
      where: { id: params.id },
      data: validatedData as any,
    })

    // Revalidar rutas para sincronizar Lead Sheet y Visor de Letras inmediatamente
    revalidatePath('/dashboard/songs')
    revalidatePath('/dashboard/songs/chords')
    revalidatePath('/dashboard/songs/lyrics')
    revalidatePath(`/dashboard/songs/${params.id}`)
    revalidatePath(`/dashboard/songs/chords/${params.id}`)
    revalidatePath(`/dashboard/songs/lyrics/${params.id}`)

    return NextResponse.json({ song })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating song:', error)
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 })
  }
}

export const PATCH = PUT

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await isServerAdmin()
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Prohibido: se requieren permisos de administrador' },
      { status: 403 }
    )
  }

  try {
    await prisma.song.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 })
  }
}

