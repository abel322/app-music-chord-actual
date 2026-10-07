import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateSongSchema } from '@/lib/validations/song'
import { z } from 'zod'

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
    
    const song = await prisma.song.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ song })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 })
  }
}

export const PATCH = PUT

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.song.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 })
  }
}
